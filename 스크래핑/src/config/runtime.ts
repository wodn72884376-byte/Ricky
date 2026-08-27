/** 실행 설정. 환경변수 > 기본값. */
import 'dotenv/config';

const int = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
};

export const runtime = {
  /** 같은 호스트 요청 간 최소 지연(ms) — CLAUDE.md 규칙 8 */
  delayMs: int(process.env.CRAWL_DELAY_MS, 2500),
  /** 호스트당 동시 요청 수 */
  concurrency: int(process.env.CRAWL_CONCURRENCY, 2),
  maxRetry: int(process.env.CRAWL_MAX_RETRY, 3),
  cacheTtlMs: int(process.env.CACHE_TTL_MIN, 360) * 60_000,
  requestTimeoutMs: 30_000,
  browserTimeoutMs: 45_000,

  naver: {
    /** NAVER API HUB (네이버 클라우드) — 2026년 이관 후 신규 발급 경로 */
    hubKeyId: process.env.NAVER_HUB_KEY_ID ?? '',
    hubKey: process.env.NAVER_HUB_KEY ?? '',
    /** developers.naver.com 기존 키 — 2027-06-30 까지 유예 */
    clientId: process.env.NAVER_CLIENT_ID ?? '',
    clientSecret: process.env.NAVER_CLIENT_SECRET ?? '',
    get enabled() {
      return Boolean(
        (process.env.NAVER_HUB_KEY_ID && process.env.NAVER_HUB_KEY) ||
          (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
      );
    },
  },

  fx: {
    cadKrw: Number(process.env.FX_CAD_KRW) || null,
    usdKrw: Number(process.env.FX_USD_KRW) || null,
  },

  /** 신제품 판정: releaseDate/lastmod 가 최근 N일 이내 */
  newProductWindowDays: 120,

  paths: {
    cache: new URL('../../cache/', import.meta.url),
    data: new URL('../../data/', import.meta.url),
  },

  /**
   * 캐나다 공식몰 상당수가 기본 UA에 즉시 403을 준다.
   * 차단 회피가 아니라 일반 브라우저와 동일한 조건으로 공개 페이지를 읽기 위한 헤더다.
   * 로그인/결제 영역은 어떤 경우에도 접근하지 않는다 (CLAUDE.md 규칙 8).
   */
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
} as const;
