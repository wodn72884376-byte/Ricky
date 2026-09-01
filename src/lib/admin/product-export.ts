import { publishBlockers, type AdminProductRow } from '@/components/admin/product-table';

/**
 * 상품 목록 → 엑셀에서 열리는 CSV.
 *
 * **xlsx 가 아니라 CSV 다.** 엑셀은 CSV 를 그대로 열고, xlsx 를 만들려면 라이브러리가
 * 하나 더 붙는다. 이 표에는 서식도 수식도 없고 값만 있으므로 얻을 게 없다.
 *
 * 대신 CSV 가 엑셀에서 깨지는 두 가지를 여기서 막는다.
 *
 *   1. **BOM 없이는 한글이 깨진다.** 엑셀은 BOM 이 없으면 시스템 기본 인코딩(한국어
 *      윈도우는 CP949)으로 읽는다. `상품` 이 `��` 이 된다.
 *   2. **수식 주입.** `=`, `+`, `-`, `@` 로 시작하는 값을 엑셀이 수식으로 실행한다.
 *      상품명은 수집기와 운영자가 넣는 값이라 우리가 통제하지 못한다 —
 *      앞에 `'` 를 붙여 텍스트로 고정한다.
 */

const CATEGORY_LABEL: Record<string, string> = {
  outerwear: '아우터', top: '상의', bottom: '하의',
  bag: '가방', wallet: '지갑', shoes: '신발', accessory: '악세서리',
};

const GENDER_LABEL: Record<string, string> = { men: '남성', women: '여성', unisex: '공용', kids: '아동' };

const STATUS_LABEL: Record<string, string> = {
  draft: '작성 중', active: '판매 중', paused: '판매 중지', archived: '보관',
};

/** 엑셀이 수식으로 해석하는 선두 문자. 탭·개행도 포함된다. */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** 값 하나를 CSV 필드로. 숫자는 따옴표 없이 둬야 엑셀이 숫자로 읽는다. */
export function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';

  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const HEADERS = [
  '상품명', '슬러그', '브랜드', '공식몰', '공식몰 범위',
  '성별', '분류', '옵션 수', '판매가(원)', '배송비(원)',
  '상태', '게시 조건', '스마트스토어', '구매 경로 범위',
] as const;

const brandField = (
  b: AdminProductRow['brands'],
  key: 'name' | 'official_site_url',
): string | null => {
  const one = Array.isArray(b) ? b[0] : b;
  return one?.[key] ?? null;
};

/**
 * 한 행. 화면의 표와 **같은 값**을 낸다 — 다르면 어느 쪽이 맞는지 알 수 없다.
 *
 * 배송비는 숫자로 둔다. 빈칸은 `무게 기준`, `0` 은 무료다 — 화면에서는 글자로
 * 풀어 쓰지만 스프레드시트에서는 합계를 내야 하므로 숫자가 맞다.
 */
export function productCsvRow(row: AdminProductRow): string {
  const variants = (row.product_variants ?? []).filter((v) => v.active);
  const missing = publishBlockers(row);

  return [
    row.name,
    `/${row.slug}`,
    brandField(row.brands, 'name'),
    // 파일에는 **전체 주소**를 넣는다. 화면은 열 폭 때문에 줄이지만 여기는 그럴 이유가 없고,
    // 스프레드시트에서는 주소를 그대로 복사해 쓸 일이 많다.
    row.official_url ?? brandField(row.brands, 'official_site_url'),
    row.official_url ? '상품' : '브랜드 홈',
    GENDER_LABEL[row.gender] ?? row.gender,
    CATEGORY_LABEL[row.category] ?? row.category,
    variants.length,
    variants[0]?.price_krw ?? null,
    row.shipping_krw,
    STATUS_LABEL[row.status] ?? row.status,
    missing.length === 0 ? '갖춰졌어요' : `${missing.join(' · ')} 없음`,
    row.smartstore_url,
    // 화면의 `구매 경로` 열과 같은 값이다. 색상별로 몇 개가 자기 주소를 가졌는지.
    buyPathLabel(row),
  ]
    .map(csvField)
    .join(',');
}

/** BOM + 헤더 + 행들. 줄바꿈은 CRLF — 엑셀이 기대하는 형식이다. */
function csvDocument(headers: readonly string[], lines: string[]): string {
  return `﻿${[headers.join(','), ...lines].join('\r\n')}\r\n`;
}

/**
 * 색상별 구매 경로가 몇 개나 채워졌는지. 화면의 `구매 경로` 열과 같은 규칙이다.
 *
 * 섞여 있으면(`색상별 2/5`) 안 채운 색이 **다른 색 페이지로 떨어진다** —
 * 파일에서 그 상품을 찾아내라고 두는 열이다.
 */
function buyPathLabel(row: AdminProductRow): string {
  const variants = (row.product_variants ?? []).filter((v) => v.active);
  const own = variants.filter((v) => v.smartstore_url).length;
  if (own === 0) return row.smartstore_url ? '상품' : '';
  return own === variants.length ? `색상별 ${own}` : `색상별 ${own}/${variants.length}`;
}

export function productsCsv(rows: AdminProductRow[]): string {
  return csvDocument(HEADERS, rows.map(productCsvRow));
}

// ── 옵션 단위 ────────────────────────────────────────────────────

/**
 * 옵션(색상·사이즈) 한 줄에 한 행.
 *
 * 상품 단위 파일과 **grain 이 다르다.** 캐나다구스는 색상마다 공식몰 페이지가 따로라
 * 상품 단위로는 나머지 색상 주소를 담을 수 없다 — 자동화가 순회할 대상이 옵션이면
 * 파일도 옵션이어야 한다.
 */
const VARIANT_HEADERS = [
  '상품명', '슬러그', '브랜드', '색상', '사이즈', 'SKU',
  '판매가(원)', '무게(g)', '공식몰', '공식몰 범위',
  '스마트스토어', '구매 경로 범위', '판매 중',
] as const;

export type AdminVariantRow = {
  sku: string;
  size: string | null;
  color: string | null;
  price_krw: number | null;
  weight_g: number | null;
  official_url: string | null;
  smartstore_url: string | null;
  active: boolean;
  products: VariantProductRef | VariantProductRef[] | null;
};

type VariantProductRef = {
  name: string;
  slug: string;
  official_url: string | null;
  smartstore_url: string | null;
  brands: { name: string } | { name: string }[] | null;
};

export function variantCsvRow(row: AdminVariantRow): string {
  const product = (Array.isArray(row.products) ? row.products[0] : row.products) ?? null;
  const brand = product ? (Array.isArray(product.brands) ? product.brands[0] : product.brands) : null;

  /*
   * 옵션 주소가 있으면 그것이 정확하다. 없으면 상품 주소로 떨어지되
   * **떨어졌다는 사실을 적는다** — 안 적으면 색상별 주소인 줄 알고 자동화가 돈다.
   */
  const url = row.official_url ?? product?.official_url ?? null;
  const scope = row.official_url ? '옵션' : product?.official_url ? '상품' : '';

  /* 구매 경로도 같은 규칙이다. `상품` 이면 고객이 스마트스토어에서 색을 다시 고른다. */
  const buy = row.smartstore_url ?? product?.smartstore_url ?? null;
  const buyScope = row.smartstore_url ? '옵션' : product?.smartstore_url ? '상품' : '';

  return [
    product?.name ?? null,
    product ? `/${product.slug}` : null,
    brand?.name ?? null,
    row.color,
    row.size,
    row.sku,
    row.price_krw,
    row.weight_g,
    url,
    scope,
    buy,
    buyScope,
    row.active ? 'Y' : 'N',
  ]
    .map(csvField)
    .join(',');
}

export function variantsCsv(rows: AdminVariantRow[]): string {
  return csvDocument(VARIANT_HEADERS, rows.map(variantCsvRow));
}

/** `RICKY-상품-20260830.csv` · `RICKY-옵션-20260830.csv` */
export function exportFileName(kind: '상품' | '옵션' = '상품', now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `RICKY-${kind}-${kst.toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
}
