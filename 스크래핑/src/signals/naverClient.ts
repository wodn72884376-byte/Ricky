/**
 * 네이버 검색·트렌드 API 클라이언트.
 *
 * ---------------------------------------------------------------------------
 * 2026년 이관 (중요)
 * ---------------------------------------------------------------------------
 * 네이버는 검색 API / Search Trend / Shopping Insight 를 개발자센터에서
 * **NAVER API HUB(네이버 클라우드 플랫폼)** 로 옮겼다.
 *
 *   이관됨  뉴스·블로그·웹문서·이미지·지식iN·지역·카페글·백과사전 검색, Search Trend
 *           → 도메인 naverapihub.apigw.ntruss.com, 헤더 X-NCP-APIGW-API-KEY-ID / -KEY
 *           → 기존 openapi.naver.com 키는 2027-06-30 까지만 유예
 *
 *   종료됨  쇼핑·책·전문자료 검색 (2026-07-31, 대체 API 없음)
 *           → 이 파이프라인의 "국내 최저가" 수집 경로가 사라졌다. 아래 주석 참조.
 *
 * 그래서 developers.naver.com 애플리케이션 등록 화면의 "사용 API" 드롭다운에는
 * 검색·데이터랩이 더 이상 나오지 않는다. 신규 발급은 HUB 콘솔에서 받아야 한다.
 *
 * 이 모듈은 두 방식을 모두 지원한다 — 기존 키를 가진 사람은 유예 기간까지 그대로 쓰고,
 * 신규 발급자는 HUB 키를 넣으면 된다. 어느 쪽인지는 환경변수로 자동 판별한다.
 */
import { runtime } from '../config/runtime.ts';
import { readCache, writeCache } from '../core/cache.ts';
import { HttpStatusError, withBackoff, withPoliteness } from '../core/politeness.ts';
import { log } from '../core/logger.ts';

// ---------------------------------------------------------------------------
// 전송 방식
// ---------------------------------------------------------------------------

const LEGACY = {
  search: 'https://openapi.naver.com/v1/search',
  trend: 'https://openapi.naver.com/v1/datalab/search',
} as const;

const HUB = {
  search: 'https://naverapihub.apigw.ntruss.com/search/v1',
  trend: 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search',
} as const;

export type NaverMode = 'hub' | 'legacy' | 'none';

export function naverMode(): NaverMode {
  if (runtime.naver.hubKeyId && runtime.naver.hubKey) return 'hub';
  if (runtime.naver.clientId && runtime.naver.clientSecret) return 'legacy';
  return 'none';
}

export class NaverNotConfiguredError extends Error {
  constructor() {
    super(
      '네이버 API 키가 없다. 스크래핑/.env 에 아래 중 한 쌍을 넣어라.\n' +
        '\n' +
        '  [신규 발급 — 권장] NAVER API HUB (네이버 클라우드 플랫폼)\n' +
        '      NAVER_HUB_KEY_ID=... / NAVER_HUB_KEY=...\n' +
        '      https://www.ncloud.com/product/applicationService/naverApiHub\n' +
        '      ※ developers.naver.com 의 "사용 API" 드롭다운에는 검색·데이터랩이 없다.\n' +
        '        2026년에 API HUB 로 이관됐기 때문이며, 신규는 HUB 에서만 발급된다.\n' +
        '\n' +
        '  [기존 키 보유자] developers.naver.com (2027-06-30 까지 유예)\n' +
        '      NAVER_CLIENT_ID=... / NAVER_CLIENT_SECRET=...',
    );
    this.name = 'NaverNotConfiguredError';
  }
}

/**
 * 쇼핑 검색 API 종료 안내.
 * 가격을 주는 공개 API 가 더는 없다는 사실 자체가 리포트에 남아야 할 정보다.
 */
export class NaverShopApiRetiredError extends Error {
  constructor() {
    super(
      '네이버 쇼핑 검색 API 는 2026-07-31 종료됐고 대체 API 가 없다. ' +
        '국내 최저가는 브랜드 한국 공식몰 정가로 대체한다.',
    );
    this.name = 'NaverShopApiRetiredError';
  }
}

function authHeaders(): Record<string, string> {
  const mode = naverMode();
  if (mode === 'hub') {
    return {
      'X-NCP-APIGW-API-KEY-ID': runtime.naver.hubKeyId,
      'X-NCP-APIGW-API-KEY': runtime.naver.hubKey,
    };
  }
  if (mode === 'legacy') {
    return {
      'X-Naver-Client-Id': runtime.naver.clientId,
      'X-Naver-Client-Secret': runtime.naver.clientSecret,
    };
  }
  throw new NaverNotConfiguredError();
}

// ---------------------------------------------------------------------------
// 검색 API
// ---------------------------------------------------------------------------

/**
 * 이 파이프라인이 쓰는 검색 종류.
 * `shop` 은 의도적으로 뺐다 — 2026-07-31 종료됐고 대체가 없다.
 */
export type SearchKind = 'blog' | 'cafearticle' | 'news';

export type SearchItem = {
  title: string;
  link: string;
  description: string;
  /** 블로그: postdate(YYYYMMDD) */
  postdate?: string;
  bloggername?: string;
};

export type SearchResponse = {
  total: number;
  start: number;
  display: number;
  items: SearchItem[];
};

/** HTML 태그가 섞여 오는 title/description 을 정리한다. */
export const stripTags = (s: string): string =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** 전송 방식에 맞는 검색 URL 을 만든다. 경로 규칙이 서로 다르다. */
function searchUrlFor(kind: SearchKind, params: URLSearchParams): string {
  // legacy: /v1/search/blog.json?...   hub: /search/v1/blog?...
  return naverMode() === 'hub'
    ? `${HUB.search}/${kind}?${params}`
    : `${LEGACY.search}/${kind}.json?${params}`;
}

export async function naverSearch(
  kind: SearchKind,
  query: string,
  opts: { display?: number; sort?: 'sim' | 'date'; fresh?: boolean } = {},
): Promise<SearchResponse> {
  if (naverMode() === 'none') throw new NaverNotConfiguredError();

  const params = new URLSearchParams({
    query,
    display: String(opts.display ?? 20),
    sort: opts.sort ?? 'sim',
  });
  const url = searchUrlFor(kind, params);

  if (!opts.fresh) {
    const hit = await readCache(url, 'naver');
    if (hit) return JSON.parse(hit) as SearchResponse;
  }

  const body = await withPoliteness(url, () =>
    withBackoff(`naver:${kind}:${query}`, async () => {
      const res = await fetch(url, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(runtime.requestTimeoutMs),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 429) log.warn(`네이버 API 호출 한도 도달: ${text.slice(0, 200)}`);
        if (res.status === 401 || res.status === 403) {
          log.warn(
            `네이버 인증 실패(${res.status}). 키 종류와 전송 방식이 맞는지 확인하라 ` +
              `(현재 모드: ${naverMode()}). ${text.slice(0, 160)}`,
          );
        }
        throw new HttpStatusError(res.status, url);
      }
      return res.text();
    }),
  );

  await writeCache(url, body, 'naver');
  return JSON.parse(body) as SearchResponse;
}

// ---------------------------------------------------------------------------
// 검색어 트렌드 (Search Trend)
// ---------------------------------------------------------------------------

export type TrendPoint = { period: string; ratio: number };

/**
 * 검색어 트렌드를 월 단위로 가져온다.
 * ratio 는 기간 내 최댓값을 100 으로 둔 상대값이다 — 절대 검색량이 아니다.
 * 요청·응답 구조는 이관 후에도 동일하고 경로와 헤더만 바뀌었다.
 */
export async function naverTrend(
  keyword: string,
  opts: { months?: number; fresh?: boolean } = {},
): Promise<TrendPoint[]> {
  if (naverMode() === 'none') throw new NaverNotConfiguredError();

  const months = opts.months ?? 24;
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const payload = {
    startDate: iso(start),
    endDate: iso(end),
    timeUnit: 'month',
    keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
  };

  const endpoint = naverMode() === 'hub' ? HUB.trend : LEGACY.trend;
  const cacheKey = `${endpoint}?${keyword}&${months}`;

  if (!opts.fresh) {
    const hit = await readCache(cacheKey, 'datalab');
    if (hit) return JSON.parse(hit) as TrendPoint[];
  }

  const points = await withPoliteness(endpoint, () =>
    withBackoff(`trend:${keyword}`, async () => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(runtime.requestTimeoutMs),
      });
      if (!res.ok) throw new HttpStatusError(res.status, endpoint);

      const json = (await res.json()) as {
        results?: Array<{ data?: Array<{ period: string; ratio: number }> }>;
      };
      return json.results?.[0]?.data ?? [];
    }),
  );

  await writeCache(cacheKey, JSON.stringify(points), 'datalab');
  return points;
}

/** 트렌드 실패가 전체를 멈추지 않도록 감싼다. 키 미설정만 위로 던진다. */
export async function tryNaverTrend(keyword: string, months = 24): Promise<TrendPoint[]> {
  try {
    return await naverTrend(keyword, { months });
  } catch (err) {
    if (err instanceof NaverNotConfiguredError) throw err;
    log.warn(`검색어 트렌드 실패: ${keyword}`, err instanceof Error ? err.message : err);
    return [];
  }
}
