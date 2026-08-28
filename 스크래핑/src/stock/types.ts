/**
 * 재고 조회 도메인 타입.
 *
 * 이 모듈의 단위는 상품이 아니라 **variant(색상 × 사이즈)** 다.
 * PROJECT.md §6.2 가 요구하는 수집 단위이자, 실제 매입이 일어나는 단위이기도 하다.
 * supplier_listings / stock_checks 테이블에 그대로 옮길 수 있는 모양으로 맞춰 둔다.
 */
import type { Availability, BrandKey } from '../core/types.ts';

/**
 * 사이즈는 사이트마다 표기 방식이 달라 한 필드로는 담기지 않는다.
 *
 * 예를 들어 Coach 신발은 JSON-LD 의 size 필드에 폭(width) 라벨이 들어가고
 * 실제 치수(9.5)는 SKU 문자열 안에 있다. 둘을 뭉개면 "9.5 D"와 "10 D"를
 * 구분하지 못해 재고 조회가 무의미해진다.
 */
export type VariantSize = {
  /** 사이트가 선언한 size 필드 원문 */
  declared: string | null;
  /** 실제 치수 토큰 — 의류 M/L, 신발 9.5 */
  code: string | null;
  /** 신발 폭 코드 (B, D, EE …) */
  width: string | null;
  /** 표시·대조용 정규화 라벨. 이 값이 사이즈의 정본이다. */
  label: string;
};

/** variant 1건의 재고 스냅샷 */
export type StockRow = {
  brand: BrandKey;
  /** 브랜드 상품 그룹 코드 (Arc'teryx X000010868 / Coach CAM16) */
  productCode: string | null;
  productName: string;
  productUrl: string;

  /** variant 고유 식별자. 재고 대조의 기준 키. */
  sku: string | null;
  gtin: string | null;
  /**
   * SKU 앞자리 스타일코드.
   *
   * Coach 는 한 페이지에 스타일이 다른 관련 상품을 여러 개 묶어 둔다.
   * 그래서 (색상, 사이즈)가 variant 를 유일하게 지목하지 못한다 —
   * 같은 "Black / 7 D" 가 스타일별로 재고가 다르게 두 줄 존재한다.
   * 매트릭스를 그릴 때 이 값으로 먼저 갈라야 한 쪽이 가려지지 않는다.
   */
  styleCode: string | null;

  colour: string | null;
  /** SKU 에서 뽑은 색상 코드 (Coach BLK, B4POP …) */
  colourCode: string | null;
  size: VariantSize;

  availability: Availability;
  /** CAD cent 정수 */
  priceCents: number | null;
  listPriceCents: number | null;
  onSale: boolean;

  checkedAt: string;
  /**
   * 이 값을 어떤 경로로 얻었는지 — 신뢰도 판단 근거.
   * manual = 운영자가 북마클릿으로 직접 수집. 사람이 본 시점의 값이라 자동 폴링과 신선도가 다르다.
   */
  source: 'http' | 'browser' | 'cache' | 'manual';
};

/** 상품 1건 조회 결과 */
export type ProductStock = {
  brand: BrandKey;
  productUrl: string;
  productName: string;
  productCode: string | null;
  rows: StockRow[];
  /** 조회 자체가 실패한 경우의 사유. 성공이면 null. */
  error: string | null;
  checkedAt: string;
};

/**
 * 재고 요약 — variant 를 세는 것만으로 판단이 서게 한다.
 * PROJECT.md §6.5 신선도 게이트가 참고할 값이기도 하다.
 */
export type StockSummary = {
  totalVariants: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  unknown: number;
  colours: number;
  sizes: number;
};

export function summarize(rows: StockRow[]): StockSummary {
  const count = (a: Availability) => rows.filter((r) => r.availability === a).length;
  return {
    totalVariants: rows.length,
    inStock: count('in_stock'),
    lowStock: count('low_stock'),
    outOfStock: count('out_of_stock'),
    unknown: count('unknown') + count('discontinued'),
    colours: new Set(rows.map((r) => r.colour).filter(Boolean)).size,
    sizes: new Set(rows.map((r) => r.size.label).filter((s) => s !== '-')).size,
  };
}
