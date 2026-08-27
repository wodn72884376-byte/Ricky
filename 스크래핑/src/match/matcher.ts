/**
 * CA 리스팅 ↔ 한국 관측치 매칭 — 순수 함수.
 *
 * 두 단계로 판정한다.
 *   1) productCode 완전 일치 → confidence 1.0 (TUMI·랄프로렌처럼 코드를 공유하는 브랜드)
 *   2) 상품명 토큰 유사도    → confidence = 유사도 (플랫폼이 다른 나머지 브랜드)
 *
 * 임계값 미만은 매칭하지 않는다. 잘못 이은 가격 비교는 없는 것보다 나쁘다.
 */
import type { BrandConfig } from '../config/brands.ts';
import type { Listing } from '../core/types.ts';
import type { ObservedProduct } from '../signals/collect.ts';
import { brandDropTokens, extractStyleCodes, similarity, tokenize } from './normalize.ts';

/** 브랜드별 매칭 사전 — 한글 라인명 치환표 + 버릴 토큰(브랜드명). */
export type MatchProfile = { aliases: Record<string, string>; drop: string[] };

export const profileOf = (cfg: BrandConfig): MatchProfile => ({
  aliases: cfg.aliases,
  drop: brandDropTokens(cfg.label, cfg.labelKo),
});

/** 이 값 미만이면 매칭하지 않는다. 실측으로 조정한 보수적 기준. */
export const MATCH_THRESHOLD = 0.45;

export type MatchResult<T> = {
  target: T | null;
  confidence: number;
  method: 'product_code' | 'name_similarity' | 'unmatched';
};

const codesOf = (listing: Listing): string[] => {
  const out = new Set<string>();
  if (listing.productCode) out.add(listing.productCode.toUpperCase());
  for (const c of extractStyleCodes(listing.name)) out.add(c);
  for (const v of listing.variants) if (v.sku) out.add(v.sku.toUpperCase());
  return [...out];
};

/**
 * CA 리스팅에 대응하는 한국 리스팅을 찾는다.
 * @param profile 브랜드별 매칭 사전
 */
export function matchListing(
  ca: Listing,
  candidates: Listing[],
  profile: MatchProfile,
): MatchResult<Listing> {
  if (candidates.length === 0) return { target: null, confidence: 0, method: 'unmatched' };

  // 1) 상품코드 일치
  const caCodes = new Set(codesOf(ca));
  if (caCodes.size > 0) {
    for (const cand of candidates) {
      if (codesOf(cand).some((c) => caCodes.has(c))) {
        return { target: cand, confidence: 1, method: 'product_code' };
      }
    }
  }

  // 2) 이름 유사도
  const caTokens = tokenize(ca.name, profile.aliases, profile.drop);
  let best: Listing | null = null;
  let bestScore = 0;

  for (const cand of candidates) {
    const score = similarity(caTokens, tokenize(cand.rawName || cand.name, profile.aliases, profile.drop));
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  if (best && bestScore >= MATCH_THRESHOLD) {
    return { target: best, confidence: Math.round(bestScore * 100) / 100, method: 'name_similarity' };
  }
  return { target: null, confidence: Math.round(bestScore * 100) / 100, method: 'unmatched' };
}

/** CA 리스팅에 대응하는 네이버쇼핑 관측치를 찾는다(국내 최저가용). */
export function matchObserved(
  ca: Listing,
  observed: ObservedProduct[],
  profile: MatchProfile,
): MatchResult<ObservedProduct> {
  if (observed.length === 0) return { target: null, confidence: 0, method: 'unmatched' };

  const caCodes = new Set(codesOf(ca));
  if (caCodes.size > 0) {
    for (const o of observed) {
      if (extractStyleCodes(o.title).some((c) => caCodes.has(c))) {
        return { target: o, confidence: 1, method: 'product_code' };
      }
    }
  }

  const caTokens = tokenize(ca.name, profile.aliases, profile.drop);
  let best: ObservedProduct | null = null;
  let bestScore = 0;

  for (const o of observed) {
    const score = similarity(caTokens, tokenize(o.title, profile.aliases, profile.drop));
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }

  if (best && bestScore >= MATCH_THRESHOLD) {
    return { target: best, confidence: Math.round(bestScore * 100) / 100, method: 'name_similarity' };
  }
  return { target: null, confidence: Math.round(bestScore * 100) / 100, method: 'unmatched' };
}

/**
 * 한국 인기 신호(쇼핑 관측 상품명)에 가장 가까운 CA 리스팅들을 찾는다.
 * "한국에서 뜨는 제품이 캐나다 공식몰에 있는가"라는 질문의 답이다.
 */
export function rankCaByKoreanDemand(
  observed: ObservedProduct[],
  caListings: Listing[],
  profile: MatchProfile,
  limit = 50,
): Array<{ listing: Listing; demandScore: number; matchedTitles: string[] }> {
  const scored = new Map<string, { listing: Listing; demandScore: number; matchedTitles: string[] }>();

  for (const o of observed) {
    const krTokens = tokenize(o.title, profile.aliases, profile.drop);
    for (const listing of caListings) {
      const score = similarity(tokenize(listing.name, profile.aliases, profile.drop), krTokens);
      if (score < MATCH_THRESHOLD) continue;

      const prev = scored.get(listing.url);
      if (prev) {
        // 여러 국내 상품명이 같은 CA 상품을 가리키면 그만큼 수요가 두껍다는 뜻이다.
        prev.demandScore += score;
        if (prev.matchedTitles.length < 5) prev.matchedTitles.push(o.title);
      } else {
        scored.set(listing.url, { listing, demandScore: score, matchedTitles: [o.title] });
      }
    }
  }

  return [...scored.values()].sort((a, b) => b.demandScore - a.demandScore).slice(0, limit);
}
