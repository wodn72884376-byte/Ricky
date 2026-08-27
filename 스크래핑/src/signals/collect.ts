/**
 * 인기도 신호 수집 — 네이버 API 호출부.
 * 점수 계산은 popularity.ts(순수 함수)가 담당하고 여기서는 원자료만 모은다.
 *
 * 쇼핑 검색 API 종료(2026-07-31) 이후, "한국에서 무엇이 팔리는가"의 근거는
 * 블로그·카페 **글 제목** 이다. 후기·하울·추천 글 제목에는 제품 라인명이
 * 그대로 등장하므로("아크테릭스 베타 LT 자켓 3년 후기") 수요 매칭 재료로 쓸 만하다.
 * 다만 가격은 얻을 수 없다 — 국내 가격은 브랜드 공식몰에서만 온다.
 */
import type { BrandKey, PopularityScore, PopularitySignal } from '../core/types.ts';
import { BRANDS } from '../config/brands.ts';
import { log } from '../core/logger.ts';
import { runtime } from '../config/runtime.ts';
import { naverSearch, stripTags, tryNaverTrend } from './naverClient.ts';
import { recentRatio, scorePopularity, splitTrend } from './popularity.ts';

export type BrandSignals = {
  brand: BrandKey;
  scores: PopularityScore[];
  signals: PopularitySignal[];
  /** 국내 게시글에서 관측한 제품 언급 — CA 카탈로그 매칭의 재료가 된다. */
  observedProducts: ObservedProduct[];
};

/**
 * 국내에서 관측된 제품 언급 1건.
 * 이름이 Product 지만 실체는 "제품을 언급한 글"이다 — 가격 정보는 없다.
 */
export type ObservedProduct = {
  /** 글 제목(태그 제거). 여기에 제품 라인명이 들어 있다. */
  title: string;
  source: 'blog' | 'cafe';
  postUrl: string | null;
  /** 이 글을 발견한 검색어 */
  fromQuery: string;
};

/** 브랜드 1개의 인기도 신호를 수집한다. */
export async function collectBrandSignals(brand: BrandKey): Promise<BrandSignals> {
  const cfg = BRANDS[brand];
  const signals: PopularitySignal[] = [];
  const observed: ObservedProduct[] = [];
  const seen = new Set<string>();

  for (const query of cfg.naverSeeds) {
    log.info(`  신호 수집: ${query}`);

    // 블로그는 최신순으로 받아야 recentRatio 가 "최근 글이 실제로 있는가"를 왜곡 없이 잰다.
    const [blog, cafe, trend] = await Promise.all([
      naverSearch('blog', query, { display: 100, sort: 'date' }).catch(() => null),
      naverSearch('cafearticle', query, { display: 50 }).catch(() => null),
      tryNaverTrend(query, 24),
    ]);

    const { recent, prev } = splitTrend(trend, 3);

    signals.push({
      brand,
      query,
      blogTotal: blog?.total ?? 0,
      cafeTotal: cafe?.total ?? 0,
      recentBlogRatio: recentRatio(blog?.items ?? []),
      trendRecent: recent,
      trendPrev: prev,
      // 쇼핑 검색 API 종료로 더 이상 수집할 수 없다. 점수 계산이 이 축을 알아서 뺀다.
      shoppingTotal: null,
      lowestKrw: null,
      collectedAt: new Date().toISOString(),
    });

    for (const [items, source] of [
      [blog?.items ?? [], 'blog'],
      [cafe?.items ?? [], 'cafe'],
    ] as const) {
      for (const item of items) {
        const title = stripTags(item.title);
        const key = title.toLowerCase();
        if (!title || seen.has(key)) continue;
        seen.add(key);
        observed.push({ title, source, postUrl: item.link ?? null, fromQuery: query });
      }
    }
  }

  return {
    brand,
    signals,
    scores: signals.map(scorePopularity),
    observedProducts: observed,
  };
}

/**
 * 국내 최저가 조회 — 현재 불가능하다.
 *
 * 네이버 쇼핑 검색 API 가 2026-07-31 종료됐고 공식 대체가 없다.
 * (Shopping Insight 는 클릭 추이만 주고 상품 목록·가격을 주지 않는다.)
 * 파이프라인 호출부를 남겨 두는 이유는, 대체 소스가 생겼을 때 이 함수만
 * 채우면 되도록 접점을 하나로 유지하기 위해서다.
 */
export const KR_LOWEST_UNAVAILABLE_REASON =
  '네이버 쇼핑 검색 API 종료(2026-07-31) — 공식 대체 없음';

export async function lookupKrLowest(
  _query: string,
): Promise<{ lowestKrw: number | null; mallName: string | null; total: number }> {
  return { lowestKrw: null, mallName: null, total: 0 };
}

/** 키가 설정돼 있는지. CLI 안내용. */
export const naverEnabled = () => runtime.naver.enabled;
