/**
 * 정중한 크롤링 장치 (CLAUDE.md 규칙 8 / PROJECT.md §6.3).
 *
 *  - 호스트별 동시성 제한
 *  - 호스트별 요청 간 최소 지연
 *  - 429/5xx 지수 백오프 (Retry-After 존중)
 *  - robots.txt 파싱 후 Disallow 경로 접근 차단
 *
 * 이 모듈을 우회하는 직접 fetch 는 파이프라인 어디에도 두지 않는다.
 */
import { runtime } from '../config/runtime.ts';
import { log } from './logger.ts';

// ---------------------------------------------------------------------------
// 호스트별 게이트 (동시성 + 지연)
// ---------------------------------------------------------------------------

type Gate = { active: number; queue: Array<() => void>; lastStart: number };
const gates = new Map<string, Gate>();

const gateFor = (host: string): Gate => {
  let g = gates.get(host);
  if (!g) {
    g = { active: 0, queue: [], lastStart: 0 };
    gates.set(host, g);
  }
  return g;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 호스트 슬롯을 확보할 때까지 대기하고, 해제 함수를 돌려준다. */
async function acquire(host: string): Promise<() => void> {
  const g = gateFor(host);
  if (g.active >= runtime.concurrency) {
    await new Promise<void>((resolve) => g.queue.push(resolve));
  }
  g.active += 1;

  const since = Date.now() - g.lastStart;
  if (since < runtime.delayMs) await sleep(runtime.delayMs - since);
  g.lastStart = Date.now();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    g.active -= 1;
    g.queue.shift()?.();
  };
}

/** 같은 호스트에 대한 요청을 동시성·지연 규칙 안에서 실행한다. */
export async function withPoliteness<T>(url: string, fn: () => Promise<T>): Promise<T> {
  const host = new URL(url).host;
  const release = await acquire(host);
  try {
    return await fn();
  } finally {
    release();
  }
}

// ---------------------------------------------------------------------------
// 지수 백오프
// ---------------------------------------------------------------------------

export class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly retryAfterMs: number | null = null,
  ) {
    super(`HTTP ${status} ${url}`);
    this.name = 'HttpStatusError';
  }
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * @param maxRetry 재시도 횟수. 0 이면 한 번만 시도한다(doctor 의 생존 확인용).
 */
export async function withBackoff<T>(
  label: string,
  fn: () => Promise<T>,
  maxRetry = runtime.maxRetry,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err instanceof HttpStatusError ? err.status : 0;
      const retryable = status === 0 || RETRYABLE.has(status);
      if (!retryable || attempt === maxRetry) break;

      const serverHint = err instanceof HttpStatusError ? err.retryAfterMs : null;
      // 429 는 봇 차단(Kasada/Akamai)인 경우가 많고 쿨오프가 분 단위다.
      // 일반 오류와 같은 초 단위 재시도로는 뚫리지 않을뿐더러 차단만 깊어진다.
      const base = status === 429 ? 15_000 : 1000;
      const cap = status === 429 ? 120_000 : 30_000;
      const wait = serverHint ?? Math.min(cap, base * 2 ** attempt) + Math.random() * 500;
      log.warn(`${label} 재시도 ${attempt + 1}/${maxRetry} (${Math.round(wait)}ms 대기)`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

type Robots = { disallow: string[]; crawlDelayMs: number | null };
const robotsCache = new Map<string, Promise<Robots>>();

/** `*` 와일드카드와 `$` 종결자를 지원하는 robots 경로 패턴 매칭. */
function pathMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const rx = body
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${rx}${anchored ? '$' : ''}`).test(path);
}

function parseRobots(text: string): Robots {
  const disallow: string[] = [];
  let crawlDelayMs: number | null = null;
  // User-agent 그룹 단위로 읽고, `*` 그룹에 해당하는 규칙만 채택한다.
  let inStar = false;
  let sawAgentInBlock = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      // 규칙 라인 뒤에 다시 user-agent 가 나오면 새 그룹의 시작이다.
      if (sawAgentInBlock === false) inStar = false;
      sawAgentInBlock = true;
      if (value === '*') inStar = true;
      continue;
    }
    sawAgentInBlock = false;
    if (!inStar) continue;
    if (field === 'disallow' && value) disallow.push(value);
    if (field === 'crawl-delay') {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) crawlDelayMs = n * 1000;
    }
  }
  return { disallow, crawlDelayMs };
}

async function loadRobots(origin: string): Promise<Robots> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;

  const p = (async (): Promise<Robots> => {
    try {
      const res = await fetch(`${origin}/robots.txt`, {
        headers: { 'user-agent': runtime.userAgent },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return { disallow: [], crawlDelayMs: null };
      return parseRobots(await res.text());
    } catch {
      // robots 를 못 읽었다고 크롤링을 막지는 않되, 기본 지연은 그대로 적용된다.
      return { disallow: [], crawlDelayMs: null };
    }
  })();

  robotsCache.set(origin, p);
  return p;
}

/** robots.txt 가 허용하는 경로인지 확인한다. 차단 경로면 false. */
export async function isAllowed(url: string): Promise<boolean> {
  const u = new URL(url);
  const robots = await loadRobots(u.origin);
  const path = u.pathname + u.search;
  return !robots.disallow.some((d) => pathMatches(d, path));
}

/** robots 가 명시한 crawl-delay 를 기본 지연보다 우선 적용한다. */
export async function effectiveDelayMs(url: string): Promise<number> {
  const robots = await loadRobots(new URL(url).origin);
  return Math.max(runtime.delayMs, robots.crawlDelayMs ?? 0);
}

export const __test__ = { parseRobots, pathMatches };
