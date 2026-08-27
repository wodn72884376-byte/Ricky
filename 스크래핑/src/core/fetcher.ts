/**
 * HTTP 계층. 정중함 장치를 통과한 요청만 나간다.
 *
 * PROJECT.md §6.3 1번 원칙: 사이트가 스스로 쓰는 JSON 엔드포인트를 우선 사용하고,
 * HTML 파싱은 대안으로 둔다. 이 모듈은 그 두 경우 모두를 담당한다.
 */
import { runtime } from '../config/runtime.ts';
import { readCache, writeCache } from './cache.ts';
import { HttpStatusError, isAllowed, withBackoff, withPoliteness } from './politeness.ts';
import { log } from './logger.ts';

export type FetchOptions = {
  /** 캐시를 무시하고 새로 받는다. */
  fresh?: boolean;
  /** robots.txt Disallow 여부를 검사하지 않는다. sitemap/robots 자체를 읽을 때만 쓴다. */
  skipRobots?: boolean;
  headers?: Record<string, string>;
  /** 캐시 키 분리용. POST 본문 등 URL 밖의 요청 요소를 넣는다. */
  cacheSalt?: string;
  /** 재시도 횟수 상한. 0 이면 단발 시도 — doctor 처럼 "살아있나"만 볼 때 쓴다. */
  maxRetry?: number;
  /** 요청 타임아웃 개별 지정(ms) */
  timeoutMs?: number;
  /**
   * HTTP 가 막히면 브라우저 세션으로 한 번 더 받는다.
   * 봇 차단 뒤에 있는 정적 자원(사이트맵 XML 등)에만 켠다 — 브라우저는 비싸다.
   */
  browserFallback?: boolean;
  /** 브라우저 폴백 시 사용할 지역 컨텍스트 */
  region?: 'CA' | 'KR';
};

export type TextResult = { body: string; fromCache: boolean; status: number };

/**
 * 캐나다 리전 페이지를 캐나다 사용자와 같은 조건으로 요청한다 (PROJECT.md §6.3 4번).
 * Accept-Language 를 지역에 맞추지 않으면 가격이 다른 통화로 내려오는 사이트가 있다.
 */
export const regionHeaders = (region: 'CA' | 'KR'): Record<string, string> => ({
  'user-agent': runtime.userAgent,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': region === 'CA' ? 'en-CA,en;q=0.9' : 'ko-KR,ko;q=0.9,en;q=0.6',
  // accept-encoding 은 의도적으로 지정하지 않는다. undici 는 자기가 붙인 경우에만
  // 응답을 자동 해제하므로, 직접 넣으면 압축된 바이트가 그대로 문자열이 된다.
  'cache-control': 'no-cache',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'upgrade-insecure-requests': '1',
});

export async function fetchText(url: string, opts: FetchOptions = {}): Promise<TextResult> {
  const salt = opts.cacheSalt ?? '';

  if (!opts.fresh) {
    const hit = await readCache(url, salt);
    if (hit !== null) return { body: hit, fromCache: true, status: 200 };
  }

  if (!opts.skipRobots && !(await isAllowed(url))) {
    throw new Error(`robots.txt 가 차단한 경로다: ${url}`);
  }

  const body = await withPoliteness(url, () =>
    withBackoff(
      url,
      async () => {
        const res = await fetch(url, {
          headers: { ...regionHeaders('CA'), ...opts.headers },
          redirect: 'follow',
          signal: AbortSignal.timeout(opts.timeoutMs ?? runtime.requestTimeoutMs),
        });

        if (!res.ok) {
          const ra = res.headers.get('retry-after');
          const retryAfterMs = ra && Number.isFinite(Number(ra)) ? Number(ra) * 1000 : null;
          throw new HttpStatusError(res.status, url, retryAfterMs);
        }
        return res.text();
      },
      opts.maxRetry,
    ),
  );

  await writeCache(url, body, salt);
  return { body, fromCache: false, status: 200 };
}

/** JSON 엔드포인트용. 파싱 실패는 곧 마크업/스키마 변경 신호이므로 그대로 던진다. */
export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const { body } = await fetchText(url, {
    ...opts,
    headers: { accept: 'application/json, text/plain, */*', ...opts.headers },
  });
  return JSON.parse(body) as T;
}

/** 실패해도 파이프라인을 멈추지 않아야 하는 자리에서 쓴다. */
export async function tryFetchText(
  url: string,
  opts: FetchOptions = {},
): Promise<TextResult | null> {
  try {
    return await fetchText(url, opts);
  } catch (err) {
    if (opts.browserFallback) {
      // 동적 import — 브라우저를 안 쓰는 실행 경로에서 Playwright 를 끌어오지 않는다.
      const { fetchViaBrowser } = await import('./browser.ts');
      const body = await fetchViaBrowser(url, opts.region ?? 'CA');
      if (body !== null) {
        await writeCache(url, body, opts.cacheSalt ?? '');
        return { body, fromCache: false, status: 200 };
      }
    }
    log.warn(`fetch 실패 ${url}`, err instanceof Error ? err.message : err);
    return null;
  }
}
