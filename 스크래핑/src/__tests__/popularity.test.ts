import { describe, expect, it } from 'vitest';
import { logScale, momentumScore, recentRatio, scorePopularity, splitTrend } from '../signals/popularity.ts';
import type { PopularitySignal } from '../core/types.ts';

const base: PopularitySignal = {
  brand: 'arcteryx',
  query: '아크테릭스 베타',
  blogTotal: 0,
  cafeTotal: 0,
  recentBlogRatio: 0,
  trendRecent: 0,
  trendPrev: 0,
  shoppingTotal: null,
  lowestKrw: null,
  collectedAt: '2026-08-26T00:00:00.000Z',
};

describe('logScale', () => {
  it('0건은 0, 상한은 1', () => {
    expect(logScale(0, 1000)).toBe(0);
    expect(logScale(1000, 1000)).toBeCloseTo(1, 5);
  });

  it('상한을 넘어도 1을 넘지 않는다', () => {
    expect(logScale(10_000_000, 1000)).toBe(1);
  });

  it('자릿수가 다른 브랜드를 비교 가능하게 압축한다', () => {
    const small = logScale(100, 300_000);
    const big = logScale(100_000, 300_000);
    expect(big).toBeGreaterThan(small);
    // 1000배 차이가 점수로는 3배 미만이어야 한다
    expect(big / small).toBeLessThan(3);
  });
});

describe('momentumScore', () => {
  it('변화 없음은 0.5', () => {
    expect(momentumScore(50, 50).score).toBeCloseTo(0.5, 5);
  });

  it('두 배로 늘면 1', () => {
    expect(momentumScore(100, 50).score).toBeCloseTo(1, 5);
  });

  it('반토막이면 0', () => {
    expect(momentumScore(25, 50).score).toBeCloseTo(0, 5);
  });

  it('직전 기간이 0인데 지금 있으면 신규 부상으로 본다', () => {
    expect(momentumScore(30, 0).score).toBe(1);
  });

  it('양쪽 다 0이면 중립', () => {
    expect(momentumScore(0, 0).score).toBe(0.5);
  });

  it('폭증해도 1을 넘지 않는다', () => {
    expect(momentumScore(10_000, 1).score).toBe(1);
  });
});

describe('splitTrend', () => {
  it('최근 3개월과 직전 3개월 평균을 나눈다', () => {
    const points = [
      { period: '2026-01', ratio: 10 },
      { period: '2026-02', ratio: 10 },
      { period: '2026-03', ratio: 10 },
      { period: '2026-04', ratio: 20 },
      { period: '2026-05', ratio: 20 },
      { period: '2026-06', ratio: 20 },
    ];
    expect(splitTrend(points, 3)).toEqual({ recent: 20, prev: 10 });
  });

  it('순서가 뒤섞여 와도 기간으로 정렬한다', () => {
    const points = [
      { period: '2026-06', ratio: 20 },
      { period: '2026-01', ratio: 10 },
    ];
    expect(splitTrend(points, 1)).toEqual({ recent: 20, prev: 10 });
  });

  it('빈 배열은 0', () => {
    expect(splitTrend([], 3)).toEqual({ recent: 0, prev: 0 });
  });
});

describe('recentRatio', () => {
  const now = Date.parse('2026-08-26T00:00:00Z');

  it('최근 1년 내 글 비율을 센다', () => {
    const items = [
      { postdate: '20260801' },
      { postdate: '20260601' },
      { postdate: '20200101' },
      { postdate: '20190101' },
    ];
    expect(recentRatio(items, now)).toBe(0.5);
  });

  it('날짜가 없는 결과는 0', () => {
    expect(recentRatio([{}, {}], now)).toBe(0);
  });
});

describe('scorePopularity', () => {
  it('오래된 스테디셀러는 언급량이 커도 만점이 안 된다', () => {
    const steady = scorePopularity({
      ...base,
      blogTotal: 300_000,
      cafeTotal: 0,
      recentBlogRatio: 0.1,
      trendRecent: 40,
      trendPrev: 80, // 검색은 반토막
      shoppingTotal: 100_000,
    });
    expect(steady.score).toBeLessThan(60);
    expect(steady.breakdown.volume).toBeCloseTo(1, 1);
    expect(steady.breakdown.momentum).toBeCloseTo(0, 1);
  });

  it('신규 부상 상품은 언급량이 적어도 점수를 받는다', () => {
    const rising = scorePopularity({
      ...base,
      blogTotal: 800,
      cafeTotal: 200,
      recentBlogRatio: 0.95,
      trendRecent: 90,
      trendPrev: 30,
      shoppingTotal: 500,
    });
    expect(rising.breakdown.momentum).toBe(1);
    expect(rising.breakdown.recency).toBeCloseTo(0.95, 2);
    expect(rising.momentumPct).toBe(200);
  });

  it('점수는 0~100 범위다', () => {
    const max = scorePopularity({
      ...base,
      blogTotal: 10_000_000,
      cafeTotal: 10_000_000,
      recentBlogRatio: 1,
      trendRecent: 100,
      trendPrev: 1,
      shoppingTotal: 10_000_000,
    });
    expect(max.score).toBeLessThanOrEqual(100);
    expect(scorePopularity(base).score).toBeGreaterThanOrEqual(0);
  });
});

describe('scorePopularity — 축이 빠졌을 때', () => {
  /*
   * 네이버 쇼핑 검색 API 종료로 commerce 축이 사라졌다.
   * 축이 없다고 점수가 깎이면 "인기가 식었다"로 오독된다.
   */
  const full = {
    ...base,
    blogTotal: 50_000,
    cafeTotal: 10_000,
    recentBlogRatio: 0.8,
    trendRecent: 70,
    trendPrev: 50,
  };

  it('commerce 가 null 이면 남은 가중치를 재정규화한다', () => {
    const withCommerce = scorePopularity({ ...full, shoppingTotal: 0 });
    const withoutCommerce = scorePopularity({ ...full, shoppingTotal: null });

    // shoppingTotal=0 은 commerce=0 으로 점수를 끌어내린다.
    // null 은 축 자체를 빼므로 더 높아야 한다 — 이게 재정규화의 요점이다.
    expect(withoutCommerce.score).toBeGreaterThan(withCommerce.score);
    expect(withoutCommerce.breakdown.commerce).toBeNull();
    expect(withCommerce.breakdown.commerce).toBe(0);
  });

  it('축이 빠져도 0~100 범위를 지킨다', () => {
    const maxed = scorePopularity({
      ...base,
      blogTotal: 10_000_000,
      cafeTotal: 10_000_000,
      recentBlogRatio: 1,
      trendRecent: 100,
      trendPrev: 1,
      shoppingTotal: null,
    });
    expect(maxed.score).toBeLessThanOrEqual(100);
    expect(maxed.score).toBeCloseTo(100, 0);
  });

  it('commerce 가 있으면 기존 가중치대로 계산한다', () => {
    // 전 축 만점이면 commerce 유무와 무관하게 100 이어야 한다
    const perfect = {
      ...base,
      blogTotal: 300_000,
      cafeTotal: 0,
      recentBlogRatio: 1,
      trendRecent: 100,
      trendPrev: 1,
      shoppingTotal: 100_000,
    };
    expect(scorePopularity(perfect).score).toBeCloseTo(100, 0);
  });
});
