/**
 * 인기도 점수 산출 — 순수 함수. 네트워크를 타지 않으므로 단위 테스트가 붙는다.
 *
 * 네 가지 축을 합산한다.
 *   volume   언급 총량      블로그+카페 문서 수 (로그 스케일)
 *   momentum 증가세         검색어 트렌드 최근 3개월 vs 직전 3개월
 *   recency  최신성         최근 12개월 내 작성된 블로그 글 비율
 *   commerce 유통 폭        네이버쇼핑 등록 상품 수 (로그 스케일)
 *
 * "최근 1~2년 사이 인기"를 판정해야 하므로 volume 단독으로는 부족하다.
 * 오래된 스테디셀러는 volume 이 높지만 momentum·recency 가 낮게 나온다.
 *
 * commerce 는 네이버 쇼핑 검색 API 종료(2026-07-31)로 현재 수집되지 않는다.
 * 축이 빠졌다고 점수를 깎으면 안 되므로, 없는 축은 제외하고 남은 가중치를
 * 재정규화한다. 나중에 대체 소스가 생기면 값만 채우면 원래대로 돌아온다.
 */
import type { PopularityScore, PopularitySignal } from '../core/types.ts';

/** 가중치 합은 1.0 이다. */
export const WEIGHTS = {
  volume: 0.3,
  momentum: 0.3,
  recency: 0.2,
  commerce: 0.2,
} as const;

/**
 * 로그 스케일 정규화. 문서 수는 브랜드별로 자릿수가 다르므로 선형 비교가 무의미하다.
 * count=0 → 0, count=ceiling → 1.
 */
export function logScale(count: number, ceiling: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (ceiling <= 1) return 1;
  const v = Math.log10(1 + count) / Math.log10(1 + ceiling);
  return Math.min(1, Math.max(0, v));
}

/**
 * 증가세 → 0~1.
 * -50% 이하는 0, 변화 없음은 0.5, +100% 이상은 1 로 매핑한다.
 */
export function momentumScore(recent: number, prev: number): { score: number; pct: number } {
  if (prev <= 0) {
    // 직전 기간에 검색이 없었는데 지금 있다면 신규 부상이다.
    return recent > 0 ? { score: 1, pct: 1 } : { score: 0.5, pct: 0 };
  }
  const pct = (recent - prev) / prev;
  const clamped = Math.min(1, Math.max(-0.5, pct));
  // -0.5 → 0, 0 → 0.5, 1 → 1
  const score = clamped <= 0 ? (clamped + 0.5) / 0.5 / 2 : 0.5 + clamped / 2;
  return { score: Math.min(1, Math.max(0, score)), pct };
}

/** 문서 수 상한 — 브랜드 최상위 키워드가 대략 이 정도다. 상한을 넘으면 1 로 포화된다. */
const VOLUME_CEILING = 300_000;
const COMMERCE_CEILING = 100_000;

export function scorePopularity(signal: PopularitySignal): PopularityScore {
  const volume = logScale(signal.blogTotal + signal.cafeTotal, VOLUME_CEILING);
  const { score: momentum, pct } = momentumScore(signal.trendRecent, signal.trendPrev);
  const recency = Math.min(1, Math.max(0, signal.recentBlogRatio));
  const commerce =
    signal.shoppingTotal === null ? null : logScale(signal.shoppingTotal, COMMERCE_CEILING);

  // 값이 있는 축만 모아 가중 평균한다 → 축이 빠져도 0~100 범위가 유지된다.
  const axes: Array<[value: number, weight: number]> = [
    [volume, WEIGHTS.volume],
    [momentum, WEIGHTS.momentum],
    [recency, WEIGHTS.recency],
  ];
  if (commerce !== null) axes.push([commerce, WEIGHTS.commerce]);

  const weightSum = axes.reduce((sum, [, w]) => sum + w, 0);
  const total =
    weightSum === 0 ? 0 : axes.reduce((sum, [v, w]) => sum + v * w, 0) / weightSum;

  const r2 = (n: number) => Math.round(n * 100) / 100;

  return {
    query: signal.query,
    score: Math.round(total * 1000) / 10, // 0~100, 소수 1자리
    breakdown: {
      volume: r2(volume),
      momentum: r2(momentum),
      recency: r2(recency),
      commerce: commerce === null ? null : r2(commerce),
    },
    momentumPct: Math.round(pct * 1000) / 10,
  };
}

/** 데이터랩 시계열 → 최근 N개월 / 직전 N개월 평균 */
export function splitTrend(
  points: Array<{ period: string; ratio: number }>,
  window = 3,
): { recent: number; prev: number } {
  if (points.length === 0) return { recent: 0, prev: 0 };
  const sorted = [...points].sort((a, b) => a.period.localeCompare(b.period));

  const avg = (arr: Array<{ ratio: number }>) =>
    arr.length === 0 ? 0 : arr.reduce((s, p) => s + p.ratio, 0) / arr.length;

  const recent = sorted.slice(-window);
  const prev = sorted.slice(-window * 2, -window);
  return { recent: avg(recent), prev: avg(prev) };
}

/** 블로그 검색 결과에서 최근 12개월 내 글의 비율을 구한다. */
export function recentRatio(
  items: Array<{ postdate?: string }>,
  now = Date.now(),
  windowDays = 365,
): number {
  const dated = items
    .map((i) => i.postdate)
    .filter((d): d is string => typeof d === 'string' && /^\d{8}$/.test(d));
  if (dated.length === 0) return 0;

  const cutoff = now - windowDays * 86_400_000;
  const fresh = dated.filter((d) => {
    const t = Date.parse(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00Z`);
    return Number.isFinite(t) && t >= cutoff;
  });
  return fresh.length / dated.length;
}
