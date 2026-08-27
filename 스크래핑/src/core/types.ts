/**
 * 소싱 파이프라인 공통 도메인 타입.
 *
 * 통화 규칙(CLAUDE.md 규칙 2): KRW는 원 단위 정수, CAD/USD는 cent 단위 정수.
 * 이 파일의 어떤 금액 필드도 실수(float)로 다루지 않는다.
 */

export type BrandKey =
  | 'arcteryx'
  | 'tommy'
  | 'polo'
  | 'canadagoose'
  | 'lululemon'
  | 'coach'
  | 'tumi';

export type Region = 'CA' | 'KR';

/** 재고 상태 — PROJECT.md §6.2 와 동일한 어휘를 쓴다. */
export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'unknown';

/** 수집 방식. 어느 경로로 얻은 값인지 리포트에 남겨 신뢰도를 판단한다. */
export type FetchMode = 'http' | 'browser' | 'cache' | 'manual';

/** 상품 단위(색상·사이즈 조합) */
export type Variant = {
  sku: string | null;
  gtin: string | null;
  color: string | null;
  size: string | null;
  /** CAD면 cent, KRW면 원. 통화는 부모 Listing.currency 를 따른다. */
  priceMinor: number | null;
  listPriceMinor: number | null;
  availability: Availability;
  imageUrl: string | null;
};

/** 한 사이트(CA 또는 KR)에서 수집한 상품 1건 */
export type Listing = {
  brand: BrandKey;
  region: Region;
  url: string;
  /** 브랜드가 부여한 상품 그룹 식별자. 있으면 CA↔KR 매칭의 1순위 키. */
  productCode: string | null;
  name: string;
  /** 원문 상품명(한국 사이트의 한글명 등). 매칭 로그용. */
  rawName: string;
  category: string | null;
  currency: 'CAD' | 'KRW';
  /** 대표가 = variant 최저가. CAD면 cent, KRW면 원. */
  priceMinor: number | null;
  listPriceMinor: number | null;
  onSale: boolean;
  availability: Availability;
  /** 실물 라벨 기준이 아니므로 참고값이다. CKFTA 판정에 그대로 쓰지 않는다 (CLAUDE.md 규칙 5). */
  originCountryHint: string | null;
  releaseDate: string | null;
  /** 사이트맵 lastmod. 신제품 판정 보조 신호. */
  lastModified: string | null;
  imageUrl: string | null;
  variants: Variant[];
  fetchedAt: string;
  fetchMode: FetchMode;
};

/** 한국 시장 인기도 신호 (네이버 검색 + 데이터랩) */
export type PopularitySignal = {
  brand: BrandKey;
  /** 신호를 수집할 때 사용한 한국어 검색어 */
  query: string;
  /** 블로그 문서 총건수 */
  blogTotal: number;
  /** 카페 문서 총건수 */
  cafeTotal: number;
  /** 최근 12개월 내 작성된 블로그 글 비율 0~1. 최신성 지표. */
  recentBlogRatio: number;
  /** 데이터랩 검색어 트렌드 최근 3개월 평균 (0~100 상대값) */
  trendRecent: number;
  /** 데이터랩 직전 3개월 평균 */
  trendPrev: number;
  /**
   * 네이버쇼핑 상품 등록 수 — 유통 폭.
   * 쇼핑 검색 API 가 2026-07-31 종료돼 현재는 항상 null 이다.
   * null 이면 점수 계산에서 이 축을 빼고 나머지 가중치를 재정규화한다.
   */
  shoppingTotal: number | null;
  /** 네이버쇼핑 최저가(원). 쇼핑 API 종료로 현재는 항상 null. */
  lowestKrw: number | null;
  collectedAt: string;
};

/** 인기도 점수 산출 결과 */
export type PopularityScore = {
  query: string;
  /** 0~100 */
  score: number;
  /** 세부 기여도 — 리포트에 근거를 남긴다. commerce 는 신호가 없으면 null. */
  breakdown: {
    volume: number;
    momentum: number;
    recency: number;
    commerce: number | null;
  };
  momentumPct: number;
};

/** CA↔KR 매칭 + 가격 비교 결과 = 파이프라인 최종 산출 단위 */
export type ComparisonRow = {
  brand: BrandKey;
  productName: string;
  productCode: string | null;
  caUrl: string | null;
  krOfficialUrl: string | null;

  caPriceCents: number | null;
  caListPriceCents: number | null;
  caOnSale: boolean;
  caAvailability: Availability;

  krOfficialKrw: number | null;
  /** 국내 공식가를 얻은 경로. product_code 는 양국이 같은 상품 ID 를 쓸 때만 나온다. */
  krOfficialMatch: 'product_code' | 'name_similarity' | null;
  krLowestKrw: number | null;
  krLowestSource: string | null;

  /** CA 현재가를 시장환율로 환산한 원화 (원가 기준, 관세 미포함) */
  caPriceKrw: number | null;
  /** §5 공식으로 산출한 예상 판매가 */
  estimatedSaleKrw: number | null;
  /** 한국 공식가 대비 예상 판매가 절감률 (0~1). 공식가가 없으면 최저가 기준. */
  savingRate: number | null;
  savingBaseline: 'kr_official' | 'kr_lowest' | null;

  popularity: PopularityScore | null;
  /** 신제품 여부 — releaseDate 또는 sitemap lastmod 기준 */
  isNew: boolean;
  matchConfidence: number;
  matchMethod: 'product_code' | 'name_similarity' | 'unmatched';
  notes: string[];
};

export type BrandRunResult = {
  brand: BrandKey;
  caListings: Listing[];
  krListings: Listing[];
  rows: ComparisonRow[];
  errors: string[];
};
