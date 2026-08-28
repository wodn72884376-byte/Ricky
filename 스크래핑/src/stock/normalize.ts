/**
 * 색상·사이즈 정규화 — 순수 함수.
 *
 * 브랜드마다 사이즈를 담는 자리가 다르다. 이 파일이 그 차이를 흡수해
 * 나머지 코드가 하나의 `VariantSize` 만 보게 한다.
 *
 *   Arc'teryx  size 필드가 정본        "XS" … "XXXL"
 *   Coach 의류  size 필드 = SKU 토큰    "CAF56 KHA  M"     size="M"
 *   Coach 신발  size 필드는 폭 라벨      "CCN27 CBD  9.5 D" size="extra wide"
 *              → 실제 치수 9.5 는 SKU 안에만 있다
 *   Coach 가방  사이즈 개념 없음         "CW380 CQ/BK"      size="large wristlet"(분류 라벨)
 */
import type { BrandKey } from '../core/types.ts';
import type { VariantSize } from './types.ts';

/** 의류 사이즈 토큰 */
const APPAREL_RX = /^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|X{2,4}L|\d{1,2})$/i;
/** 신발 치수 (9, 9.5, 10) */
const SHOE_RX = /^\d{1,2}(\.5)?$/;
/** 신발 폭 코드 */
const WIDTH_RX = /^(A|B|C|D|E|EE|EEE|M|W|N)$/i;

/**
 * Coach SKU 를 토큰으로 쪼갠다.
 *
 *   "CCN27 CBD  9.5 D"  → { style:'CCN27', colourCode:'CBD', rest:['9.5','D'] }
 *   "CAF56 KHA  M"      → { style:'CAF56', colourCode:'KHA', rest:['M'] }
 *   "CW380 CQ/BK"       → { style:'CW380', colourCode:'CQ/BK', rest:[] }
 *
 * 공백이 1개일 때도 2개일 때도 있어서 연속 공백을 하나로 본다.
 */
export function parseCoachSku(sku: string | null): {
  style: string | null;
  colourCode: string | null;
  rest: string[];
} {
  if (!sku) return { style: null, colourCode: null, rest: [] };
  const parts = sku.trim().split(/\s+/).filter(Boolean);
  return {
    style: parts[0] ?? null,
    colourCode: parts[1] ?? null,
    rest: parts.slice(2),
  };
}

/** 사이즈가 없는 상품(가방·지갑)의 표시값 */
const NO_SIZE = '-';

/**
 * 사이즈를 정규화한다.
 * @param declared JSON-LD 의 size 필드
 * @param sku      variant SKU
 */
export function normalizeSize(
  brand: BrandKey,
  declared: string | null,
  sku: string | null,
): VariantSize {
  const clean = declared?.trim() || null;

  if (brand === 'coach') {
    const { rest } = parseCoachSku(sku);
    const first = rest[0] ?? null;
    const second = rest[1] ?? null;

    // 신발 — 치수는 SKU 에만 있고 size 필드는 폭 라벨이다
    if (first && SHOE_RX.test(first)) {
      const width = second && WIDTH_RX.test(second) ? second.toUpperCase() : null;
      return {
        declared: clean,
        code: first,
        width,
        label: width ? `${first} ${width}` : first,
      };
    }

    // 의류 — SKU 토큰과 size 필드가 같은 값이다
    if (first && APPAREL_RX.test(first)) {
      return { declared: clean, code: first.toUpperCase(), width: null, label: first.toUpperCase() };
    }

    /*
     * 가방·지갑 — SKU 에 사이즈 토큰이 없다.
     * size 필드에는 "large wristlet" 같은 분류 라벨이 들어 있는데, 이건 사이즈가 아니다.
     * 사이즈로 취급하면 "색상 8 × 사이즈 1" 같은 잘못된 매트릭스가 나온다.
     */
    return { declared: clean, code: null, width: null, label: NO_SIZE };
  }

  // Arc'teryx 등 — size 필드가 정본이다
  if (!clean || clean.toUpperCase() === 'NA' || clean.toUpperCase() === 'N/A') {
    return { declared: clean, code: null, width: null, label: NO_SIZE };
  }
  return { declared: clean, code: clean.toUpperCase(), width: null, label: clean.toUpperCase() };
}

/** SKU 앞자리 스타일코드. Coach 처럼 한 페이지에 여러 스타일이 섞일 때 갈라 주는 축이다. */
export function extractStyleCode(brand: BrandKey, sku: string | null): string | null {
  if (brand === 'coach') return parseCoachSku(sku).style;
  return null;
}

/** SKU 에서 색상 코드를 뽑는다. 없으면 null. */
export function extractColourCode(brand: BrandKey, sku: string | null): string | null {
  if (brand === 'coach') return parseCoachSku(sku).colourCode;
  return null;
}

/** 색상명 표시 정규화 — 공백 정리만 한다. 색상명 자체는 브랜드 표기를 존중한다. */
export function normalizeColour(colour: string | null): string | null {
  const c = colour?.replace(/\s+/g, ' ').trim();
  return c || null;
}

/**
 * 사이즈 정렬 순서.
 * XS < S < M < L < XL 처럼 사람이 기대하는 순서로 보여 주기 위한 것이다.
 * 숫자 사이즈는 숫자 크기 순으로 둔다.
 */
const APPAREL_ORDER = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export function sizeSortKey(label: string): [number, number, string] {
  if (label === NO_SIZE) return [2, 0, ''];

  const num = label.match(/^(\d{1,2}(?:\.5)?)/);
  if (num?.[1]) return [1, Number(num[1]), label];

  const idx = APPAREL_ORDER.indexOf(label.toUpperCase());
  if (idx >= 0) return [0, idx, label];

  return [3, 0, label];
}

export function compareSizes(a: string, b: string): number {
  const [ga, na, sa] = sizeSortKey(a);
  const [gb, nb, sb] = sizeSortKey(b);
  if (ga !== gb) return ga - gb;
  if (na !== nb) return na - nb;
  return sa.localeCompare(sb);
}
