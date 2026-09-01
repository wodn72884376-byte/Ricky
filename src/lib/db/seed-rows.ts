/**
 * 카탈로그·재고를 DB 행으로 바꾸는 순수 변환.
 *
 * **쓰기와 분리해 둔다.** 행을 만드는 규칙에 단위 테스트를 붙일 수 있어야 하는데,
 * Supabase 클라이언트에 묶어 두면 실제 프로젝트 없이는 아무것도 검증할 수 없다.
 * 여기는 입력 → 행 배열만 만들고, 실제 insert는 scripts/가 한다.
 *
 * 규칙 두 가지가 이 파일의 전부다.
 *
 *   1. **variant는 (사이즈 × 색상)이다.** 카탈로그는 색상 단위이고 사이즈를 상품에
 *      공유 배열로 들고 있지만, DB는 `unique (product_id, size, color)`다.
 *      재고도 (색상, 사이즈) 단위로 들어오므로 여기서 펼쳐야 짝이 맞는다.
 *
 *   2. **재고를 모르면 행을 만들지 않는다.** `availability = 'unknown'`으로 채워 넣으면
 *      "확인했는데 모름"과 "확인한 적 없음"이 구분되지 않는다. 후자는 행의 부재로 둔다
 *      (PROJECT.md §6.5 — 확인되지 않은 재고로 판매하지 않는다).
 */
import type { CatalogProduct } from '@/lib/catalog.generated';
import type { AvailabilityState } from '@/lib/supabase/types';
import { AS_CONTACT } from '../disclosure';

/**
 * 사이즈가 없는 상품(가방·지갑)의 사이즈 표기.
 *
 * **양쪽 표기가 다르다.** 카탈로그는 `ONE SIZE`, 수집기는 `-`를 쓴다.
 * 정규화하지 않으면 코치 가방 재고가 통째로 버려진다 — 붙을 variant를 못 찾는다.
 * 운영자가 읽을 표기는 `ONE SIZE`이므로 그쪽으로 모은다.
 */
export const NO_SIZE = 'ONE SIZE';

const NO_SIZE_ALIASES = new Set(['-', '', 'OS', 'ONESIZE', 'ONE SIZE', 'ONE-SIZE', 'F', 'FREE']);

/** 사이즈 표기를 한 축으로 모은다. variant 생성과 재고 적재가 **같은 함수**를 써야 한다. */
export function canonicalSize(label: string): string {
  const t = label.trim().toUpperCase();
  return NO_SIZE_ALIASES.has(t) ? NO_SIZE : label.trim();
}

export type ProductRowSeed = {
  brand_slug: string;
  slug: string;
  name: string;
  name_en: string | null;
  category: string;
  gender: string;
  origin_country: string | null;
  material: string | null;
  care: string | null;
  manufacturer: string | null;
  /** A/S 책임자 및 연락처. 전 상품 공통이라 disclosure.ts 가 원본이다. */
  as_contact: string;
  kr_retail_krw: number | null;
  shipping_krw: number | null;
  smartstore_url: string | null;
  /** 브랜드 공식몰의 **이 상품** 페이지. 브랜드 홈으로 대신 채우지 않는다. */
  official_url: string | null;
  /** 카탈로그는 게시 상태를 모른다. 고시 항목이 비어 있으면 DB 제약이 active를 막는다. */
  status: 'draft';
};

export type VariantRowSeed = {
  product_slug: string;
  sku: string;
  size: string;
  color: string;
  cost_cad_cents: number | null;
  price_krw: number | null;
  /**
   * 공식몰 표기 무게. **추정 대체값을 넣지 않는다** — `weightGOf()` 의 카테고리 기본값은
   * 화면에서 배송비를 보여주기 위한 임시값이지 사실이 아니다. DB 는 아는 것만 담는다.
   */
  weight_g: number | null;
  /** 이 색상의 공식몰 페이지. 색상마다 PDP 가 다른 브랜드에서만 채워진다. */
  official_url: string | null;
  /** 이 색상만의 스마트스토어 상품 URL. null 이면 상품 단위 주소로 떨어진다. */
  smartstore_url: string | null;
};

/** 카탈로그 상품 → products 행 하나. */
export function productRow(p: CatalogProduct): ProductRowSeed {
  return {
    brand_slug: p.brandSlug,
    slug: p.slug,
    name: p.name,
    name_en: null,
    category: p.category,
    gender: p.gender,
    origin_country: p.originCountry,
    material: p.material,
    care: p.care,
    manufacturer: p.manufacturer,
    /*
     * 판매 방식에서 나오는 값이라 상품과 무관하게 같다. 카탈로그에 두지 않는 이유 —
     * 원본 폴더의 details.txt 는 브랜드가 준 상품 정보이고, 이건 우리가 파는 방식이다.
     * 게시 게이트가 이 값을 요구하므로 비워 두면 아무것도 게시할 수 없다.
     */
    as_contact: AS_CONTACT,
    kr_retail_krw: p.krRetailKrw,
    shipping_krw: p.shippingKrw,
    smartstore_url: p.smartstoreUrl,
    official_url: p.officialUrl,
    // 고시 항목이 다 차 있어도 여기서 게시하지 않는다 — 게시는 운영자가 판단한다.
    status: 'draft',
  };
}

/**
 * 브랜드 상품코드가 없어 브랜드명이 SKU 앞자리로 들어간 경우.
 *
 * 룰루레몬은 카탈로그에 상품코드가 없어 SKU가 `LULULEMON-{색상}`이 된다.
 * 그러면 **다른 상품끼리 SKU가 겹친다** — 실제로 헤어클립 2종이 같은 색상을
 * 공유해 3건이 충돌했다. `sku`는 DB에서 전역 unique라 insert가 통째로 실패한다.
 */
const BRAND_NOISE = new Set(['LULULEMON', 'ARCTERYX', 'COACH', 'POLO', 'TUMI']);

/**
 * 카탈로그 상품 → product_variants 행들. (사이즈 × 색상)으로 펼친다.
 *
 * SKU는 카탈로그 variant SKU에 사이즈를 덧붙인다. 카탈로그 SKU는 (상품, 색상)까지만
 * 가리키므로 그대로 쓰면 사이즈가 여럿일 때 unique 제약에 걸린다.
 *
 * 앞자리가 상품코드가 아니라 브랜드명이면 상품 slug를 대신 넣는다 —
 * (slug, 색상, 사이즈)는 DB의 unique 제약과 같은 축이라 반드시 유일하다.
 */
/**
 * 사이즈 표기의 표준 순서. 화면에 그대로 나가므로 순서가 맞아야 한다.
 * 여기 없는 값(숫자 사이즈·`L/XL` 같은 조합)은 뒤에 원래 순서로 붙인다.
 */
const SIZE_ORDER = [
  'XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  'XXS/XS', 'XS/S', 'S/M', 'M/L', 'L/XL', 'XL/XXL',
];

/**
 * 카탈로그 사이즈와 **공식몰에서 실제로 관측한 사이즈**를 합친다.
 *
 * `details.txt` 의 사이즈 목록은 사람이 적은 값이라 빠지는 게 있다 — 실측:
 * 아크테릭스 XXL, 폴로 XS 등 30여 조합이 공식몰에는 있는데 카탈로그엔 없어
 * 수집한 재고 472행이 붙을 자리를 못 찾았다. **파는 사이즈는 공식몰이 안다.**
 *
 * 없는 것을 만들지는 않는다 — 관측된 것만 더한다.
 */
export function mergeSizes(catalogSizes: readonly string[], observed: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...catalogSizes, ...observed]) {
    const size = canonicalSize(raw);
    if (size === NO_SIZE || seen.has(size)) continue;
    seen.add(size);
    out.push(size);
  }

  const rank = (x: string) => {
    const i = SIZE_ORDER.indexOf(x.toUpperCase());
    return i === -1 ? SIZE_ORDER.length : i;
  };
  return out.sort((a, b) => rank(a) - rank(b) || out.indexOf(a) - out.indexOf(b));
}

export function variantRows(
  p: CatalogProduct,
  observedSizes: Iterable<string> = [],
): VariantRowSeed[] {
  const merged = mergeSizes(p.sizes, observedSizes);
  const sizes = merged.length > 0 ? merged : [NO_SIZE];

  return p.variants.flatMap((v) => {
    const head = v.sku.split('-')[0]?.toUpperCase() ?? '';
    const base = BRAND_NOISE.has(head)
      ? `${skuPart(p.slug)}-${skuPart(v.color)}`
      : v.sku;

    return sizes.map((raw) => {
      const size = canonicalSize(raw);
      return {
      product_slug: p.slug,
      // 사이즈가 없는 상품은 SKU를 늘리지 않는다 — `…-BLACK--`가 되면 읽기 어렵다.
      sku: size === NO_SIZE ? base : `${base}-${skuPart(size)}`,
      size,
      color: v.color,
      // 색상마다 값이 다른 경우(코치 — 소재가 다르면 가격이 다르다)가 우선한다.
      cost_cad_cents: v.cadCents ?? p.cadCents ?? null,
      price_krw: v.priceKrw ?? p.priceKrw ?? null,
      weight_g: p.weightG ?? null,
      official_url: v.officialUrl,
      smartstore_url: v.smartstoreUrl,
      };
    });
  });
}

/** SKU에 붙일 수 있는 형태로. 한글·기호를 그대로 두면 시스템 간 이동에서 깨진다. */
export function skuPart(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase() || 'X'
  );
}

/** 수집기가 준 재고 한 줄 — 스크래핑 프로젝트의 LinkedVariant를 그대로 받는다. */
export type LinkedStock = {
  slug: string;
  brand: string;
  sku: string;
  color: string;
  /**
   * 이 재고를 본 공급처 페이지. **variant마다 다를 수 있다.**
   * 캐나다구스는 로고 디스크마다 PDP가 따로라(MacMillan Parka = 2080M · 2080MB)
   * 한 상품의 색상들이 서로 다른 페이지에서 온다. slug로 되찾으면 한 URL이
   * 나머지 색상에까지 붙고, `supplier_listings`의 유니크 키가 (variant_id, product_url)이라
   * 행이 뭉개진다.
   */
  productUrl: string;
  sizes: { label: string; availability: string; priceCents: number | null; onSale: boolean }[];
  checkedAt: string;
  source: string;
};

export type ListingRowSeed = {
  /** (상품 slug, 색상, 사이즈)로 variant를 찾는다 */
  product_slug: string;
  color: string;
  size: string;
  brand_slug: string;
  product_url: string;
  availability: AvailabilityState;
  current_price_cad_cents: number | null;
  on_sale: boolean;
  last_checked_at: string;
  /** 수집이 성공했을 때만 채운다. 신선도 게이트가 이 값만 본다 (§6.5) */
  last_success_at: string;
};

const AVAILABILITY: Record<string, AvailabilityState> = {
  in_stock: 'in_stock',
  low_stock: 'low_stock',
  out_of_stock: 'out_of_stock',
  discontinued: 'discontinued',
  unknown: 'unknown',
};

/**
 * 연결된 재고 → supplier_listings 행들.
 *
 * `availability`가 unknown인 줄은 **버린다.** 조회는 했지만 판정하지 못한 것이라
 * 판매 근거가 되지 못하고, 행으로 남기면 뷰가 신선하다고 착각한다.
 */
export function listingRows(linked: LinkedStock[]): ListingRowSeed[] {
  const rows: ListingRowSeed[] = [];

  for (const l of linked) {
    // 어디서 본 재고인지 모르면 판매 근거가 되지 못한다.
    const url = l.productUrl;
    if (!url) continue;

    for (const s of l.sizes) {
      const availability = AVAILABILITY[s.availability];
      if (!availability || availability === 'unknown') continue;

      rows.push({
        product_slug: l.slug,
        color: l.color,
        // variant 생성과 같은 정규화를 태운다. 여기가 어긋나면 재고가 조용히 버려진다.
        size: canonicalSize(s.label),
        brand_slug: l.brand,
        product_url: url,
        availability,
        current_price_cad_cents: s.priceCents,
        on_sale: s.onSale,
        last_checked_at: l.checkedAt,
        last_success_at: l.checkedAt,
      });
    }
  }

  return rows;
}
