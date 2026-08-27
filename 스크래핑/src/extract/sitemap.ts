/**
 * sitemap.xml 기반 상품 URL 발견 + 신제품 판정.
 *
 * 카테고리 페이지를 무한 스크롤로 긁는 것보다 사이트맵을 읽는 쪽이
 * 상대 서버에 훨씬 가볍고, lastmod 라는 신제품 신호를 덤으로 준다.
 * (검증: arcteryx.com sitemap 은 45,036 URL + 전 항목 lastmod 를 제공한다.)
 */
import { fetchText, tryFetchText } from '../core/fetcher.ts';
import { log } from '../core/logger.ts';

export type SitemapEntry = { url: string; lastModified: string | null };

const LOC_RX = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
const ENTRY_RX = /<(url|sitemap)\b[^>]*>([\s\S]*?)<\/\1>/gi;

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

function parseEntries(xml: string): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const m of xml.matchAll(ENTRY_RX)) {
    const block = m[2] ?? '';
    const loc = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/i)?.[1] ?? null;
    out.push({ url: decode(loc), lastModified: lastmod });
  }

  // <url>/<sitemap> 래퍼 없이 <loc> 만 있는 변형 대응
  if (out.length === 0) {
    for (const m of xml.matchAll(LOC_RX)) {
      if (m[1]) out.push({ url: decode(m[1]), lastModified: null });
    }
  }
  return out;
}

const isIndex = (xml: string) => /<sitemapindex/i.test(xml);

export type CollectOptions = {
  /** 상품 상세 URL 만 남기는 필터 */
  match: (url: string) => boolean;
  /** 하위 사이트맵 중 이 조건에 맞는 것만 따라간다. 대형 사이트에서 필수. */
  followIndex?: (url: string) => boolean;
  /** 최대 수집 URL 수 */
  limit?: number;
  /** 재귀 깊이 상한 */
  maxDepth?: number;
  /** 캐시를 무시하고 사이트맵을 새로 받는다 */
  fresh?: boolean;
  /** 봇 차단으로 HTTP 가 막히면 브라우저 세션으로 받는다 */
  browserFallback?: boolean;
  region?: 'CA' | 'KR';
};

/**
 * sitemapindex 를 재귀적으로 따라가며 상품 URL 을 모은다.
 * 하위 사이트맵은 순차로 읽는다 — 동시성은 politeness 계층이 이미 제한한다.
 */
export async function collectFromSitemap(
  sitemapUrl: string,
  opts: CollectOptions,
  depth = 0,
): Promise<SitemapEntry[]> {
  const limit = opts.limit ?? 5000;
  const maxDepth = opts.maxDepth ?? 3;
  if (depth > maxDepth) return [];

  // sitemap 자체는 robots 가 가리키는 공개 자원이므로 Disallow 검사 대상이 아니다.
  const res = await tryFetchText(sitemapUrl, {
    skipRobots: true,
    fresh: opts.fresh,
    maxRetry: 1,
    browserFallback: opts.browserFallback,
    region: opts.region,
  });
  if (!res) return [];
  const xml = res.body;

  const entries = parseEntries(xml);
  if (!isIndex(xml)) return entries.filter((e) => opts.match(e.url)).slice(0, limit);

  const children = entries.filter((e) => (opts.followIndex ? opts.followIndex(e.url) : true));
  const out: SitemapEntry[] = [];
  for (const child of children) {
    if (out.length >= limit) break;
    const got = await collectFromSitemap(
      child.url,
      { ...opts, limit: limit - out.length },
      depth + 1,
    );
    out.push(...got);
  }
  return out.slice(0, limit);
}

/** robots.txt 가 선언한 사이트맵 위치를 읽는다. */
export async function sitemapsFromRobots(origin: string): Promise<string[]> {
  try {
    const { body } = await fetchText(`${origin}/robots.txt`, { skipRobots: true });
    return [...body.matchAll(/^\s*sitemap:\s*(\S+)/gim)]
      .map((m) => m[1])
      .filter((u): u is string => Boolean(u));
  } catch {
    return [];
  }
}

/** lastmod / releaseDate 가 최근 windowDays 이내인가. */
export function isRecent(date: string | null, windowDays: number, now = Date.now()): boolean {
  if (!date) return false;
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return false;
  return now - t <= windowDays * 86_400_000 && t <= now + 86_400_000;
}

/** 최신 lastmod 순으로 정렬한다. lastmod 없는 항목은 뒤로 보낸다. */
export function byNewest(a: SitemapEntry, b: SitemapEntry): number {
  const ta = a.lastModified ? Date.parse(a.lastModified) : 0;
  const tb = b.lastModified ? Date.parse(b.lastModified) : 0;
  return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
}

export const __test__ = { parseEntries, isIndex };
