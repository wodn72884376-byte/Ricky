/**
 * 카탈로그 조회. 화면은 이 파일만 보고, 생성 파일을 직접 import하지 않는다.
 *
 * DB를 붙이면 이 함수들의 속만 `store_variants` 뷰 조회로 바꾸면 된다 —
 * 호출하는 쪽은 그대로다. `product_variants` 직접 조회는 원가 노출이다 (PROJECT.md §3.1).
 */
import { CATALOG, type CatalogProduct, type CatalogVariant } from './catalog.generated';
import { swatchHex } from './color-swatch';
import { BRAND_COLUMNS, type CategoryEntry, type Gender } from './nav';
import { type CheckoutLine } from './checkout';
import { quoteShipping } from './shipping';
import type { CartLine } from './cart-store';
import type { ProductCardProps } from '@/components/store/product-card';

export type { CatalogProduct, CatalogVariant };

/**
 * 색상별 판매가. 코치는 소재가 다르면 값이 다르므로 상품 하나에 가격 하나가 아니다.
 * 색상별 값이 없으면 상품 대표가를 쓴다.
 */
export function priceOf(p: CatalogProduct, variant?: CatalogVariant): number {
  return variant?.priceKrw ?? p.priceKrw;
}

/** 한 상품 안에서 색상마다 값이 다른가 */
export function hasVariantPricing(p: CatalogProduct): boolean {
  return new Set(p.variants.map((v) => v.priceKrw ?? p.priceKrw)).size > 1;
}

/**
 * 공식몰 표기 무게가 없는 상품의 대체값. 카테고리 평균이라 어디까지나 추정이다.
 * TODO(data): 남은 브랜드도 실측값으로 교체 (생성 파일 주석 참조)
 */
const FALLBACK_WEIGHT_G: Record<string, number> = {
  outerwear: 650, top: 420, bag: 900, accessory: 150, bottom: 350,
  wallet: 200, shoes: 900,
};

/**
 * 배송비 산정용 무게.
 *
 * 공식몰이 밝힌 값이 있으면 그것을 쓴다 — 아크테릭스는 상품 상세에서 읽어 왔다.
 * 추정값과 실제가 꽤 벌어진다(예: Squamish Hoody는 추정 420g, 실제 123g).
 */
export function weightGOf(p: CatalogProduct): number {
  return p.weightG ?? FALLBACK_WEIGHT_G[p.category] ?? 500;
}

/**
 * 이 상품 한 점의 배송비.
 *
 * 운영자가 상품 등록 화면에서 넣은 값이 우선이고, 없으면 무게 기준 계산값을 쓴다.
 * **`?? `로 판단한다** — 0은 무료배송이라는 뜻이므로 falsy로 다루면 계산값에 덮인다.
 */
export function shippingKrwOf(p: CatalogProduct): number {
  return p.shippingKrw ?? quoteShipping(weightGOf(p)).shippingKrw;
}

/**
 * 상품 카드 props로 변환. 카드는 첫 색상의 대표 이미지를 쓴다.
 *
 * **상품명에 색상을 붙이지 않는다.** 카드 하나가 색상 하나를 뜻하지 않기 때문이다 —
 * 어떤 색이 있는지는 이름이 아니라 컬러칩이 말한다.
 */
export function toCardProps(p: CatalogProduct): ProductCardProps & {
  id: string; category: string; arrivedAt: string; brandSlug: string;
} {
  const v = p.variants[0]!;
  return {
    id: p.slug,
    href: `/products/${p.slug}`,
    imageUrl: v.cardImage,
    /*
      카드에서 넘겨 볼 컷들. 첫 장은 4:5로 자른 카드 컷이고, 그 원본(detailImages[0])은
      같은 사진이라 건너뛴다 — 호버했는데 같은 사진이 나오면 안 바뀐 것처럼 보인다.
    */
    images: [v.cardImage, ...v.detailImages.slice(1)],
    imageAlt: `${p.name} ${v.colorKo}`,
    brand: p.brand,
    brandSlug: p.brandSlug,
    name: p.name,
    priceKrw: p.priceKrw,
    // 한국 정발가를 비교가로 보여준다 — 우리가 만든 할인이 아니라 실제 가격 차이다
    compareAtKrw: p.krRetailKrw && p.krRetailKrw > p.priceKrw ? p.krRetailKrw : undefined,
    colors: colorChips(p),
    category: p.category,
    arrivedAt: '2026-08-27',
  };
}

/**
 * 카드의 컬러칩. 색 이름과 근사 색을 함께 넘긴다 —
 * 칩만으로 색을 판단하게 두지 않는다 (`swatchHex`의 주석 참고).
 */
export function colorChips(p: CatalogProduct) {
  return p.variants.map((v) => ({ label: v.colorKo, hex: swatchHex(v.color) }));
}

export function allProducts() {
  return CATALOG;
}

export function byBrand(brandSlug: string) {
  return CATALOG.filter((p) => p.brandSlug === brandSlug);
}

export function byGender(gender: Gender) {
  return filterGender(CATALOG, gender);
}

/**
 * 성별 필터.
 *
 * `unisex` 는 **어른 목록 양쪽에** 나온다 (마이그레이션 20260826000004 주석).
 * 아동 목록에는 나오지 않는다 — 성인 프리 사이즈 옷이 아동 목록에 섞이면 부모가
 * 사이즈를 착각한다. 아동은 어른과 겹치는 축이 아니라 별개의 축이다 (20260830000014).
 */
export function filterGender<T extends { gender: CatalogProduct['gender'] }>(
  items: T[],
  gender: Gender | null,
): T[] {
  if (!gender) return items;
  if (gender === 'kids') return items.filter((p) => p.gender === 'kids');
  return items.filter((p) => p.gender === gender || p.gender === 'unisex');
}

export type MenuBrand = {
  slug: string;
  label: string;
  categories: CategoryEntry[];
};

/**
 * 메가 드롭다운의 내용. **성별마다 다르다** —
 * `Men's`에 여성 숄더백 카테고리를 띄우면 눌렀을 때 빈 목록이 나온다.
 *
 * 상품이 한 점도 없는 브랜드·카테고리는 아예 만들지 않는다 (DESIGN.md §12-8).
 * 라벨과 순서는 nav.ts가 정하고, 존재 여부는 카탈로그가 정한다.
 */
export function brandMenu(gender: Gender): MenuBrand[] {
  const menu: MenuBrand[] = [];

  for (const brand of BRAND_COLUMNS) {
    const products = filterGender(byBrand(brand.slug), gender);
    if (products.length === 0) continue;

    const present = new Set(products.map((p) => p.category));
    const categories = brand.categories.filter((c) => c.value === null || present.has(c.value));
    // `전체` 하나만 남으면 목록이 아니라 링크다 — 그래도 컬럼은 남긴다
    menu.push({ slug: brand.slug, label: brand.label, categories });
  }

  return menu;
}

export function findProduct(slug: string) {
  return CATALOG.find((p) => p.slug === slug);
}

/**
 * BEST. TODO(data): featured_rank 또는 판매량으로 교체 (수동 큐레이션 우선).
 *
 * 주문이 없으니 판매량을 알 수 없다. 그래서 **정발가와의 차이가 큰 순**으로 둔다 —
 * 지어낸 인기 순위보다 정직하고, 이 브랜드를 찾는 이유와도 맞는다.
 * 정발가를 아직 확인하지 못한 상품은 뒤로 보낸다.
 */
export function bestSellers(n = 6) {
  const gap = (p: CatalogProduct) => (p.krRetailKrw ? p.krRetailKrw - p.priceKrw : -1);
  return [...CATALOG].sort((a, b) => gap(b) - gap(a)).slice(0, n);
}

export type ListSort = 'recommended' | 'price_low' | 'price_high' | 'discount' | 'newest';

/** 목록 정렬. 브랜드·전체·검색·BEST가 같은 규칙을 쓴다. */
export function sortCards<T extends { priceKrw: number; compareAtKrw?: number; arrivedAt: string }>(
  items: T[],
  sort: ListSort,
): T[] {
  const rate = (p: T) => (p.compareAtKrw ? 1 - p.priceKrw / p.compareAtKrw : 0);
  switch (sort) {
    case 'price_low':
      return [...items].sort((a, b) => a.priceKrw - b.priceKrw);
    case 'price_high':
      return [...items].sort((a, b) => b.priceKrw - a.priceKrw);
    case 'discount':
      return [...items].sort((a, b) => rate(b) - rate(a));
    case 'newest':
      return [...items].sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt));
    default:
      return items;
  }
}

/**
 * 검색. 상품명·브랜드·색상(한글/영문)을 본다.
 * 형태소 분석 없이 부분 일치만 한다 — 카탈로그가 48개인 지금은 이걸로 충분하다.
 */
export function searchProducts(query: string): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return CATALOG.filter((p) => {
    const haystack = [
      p.name, p.brand, p.category,
      ...p.variants.flatMap((v) => [v.color, v.colorKo]),
    ].join(' ').toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

/** 카탈로그에 실제로 존재하는 카테고리만 탭으로 노출한다 */
export function categoryTabs(products: CatalogProduct[]) {
  const LABEL: Record<string, string> = {
    outerwear: '아우터', top: '상의', bottom: '하의', bag: '가방', accessory: '악세서리',
  };
  const present = [...new Set(products.map((p) => p.category))];
  return [
    { value: null, label: '전체' },
    ...present.map((c) => ({ value: c, label: LABEL[c] ?? c })),
  ];
}


/**
 * 장바구니 저장 항목 → 결제 계산용 줄.
 *
 * **가격은 저장소가 아니라 여기서 카탈로그를 다시 읽어 정한다** (docs/IA.md §5-6).
 * 색상까지 맞춰야 값이 맞는다 — 코치는 소재가 다르면 가격이 다르다.
 * 색상 없이 저장된 예전 항목은 첫 색상으로 본다.
 *
 * 장바구니와 결제가 같은 함수를 쓴다. 두 곳에서 따로 계산하면 금액이 갈린다.
 */
export function resolveCartLines(stored: CartLine[]): CheckoutLine[] {
  return stored.flatMap((line) => {
    const p = findProduct(line.id);
    if (!p) return []; // 카탈로그에서 사라진 항목은 조용히 제외한다
    const v = p.variants.find((x) => x.color === line.color) ?? p.variants[0]!;
    return [
      {
        id: p.slug,
        slug: p.slug,
        brand: p.brand,
        name: `${p.name} ${v.colorKo}`,
        color: v.color,
        imageUrl: v.cardImage,
        imageAlt: `${p.name} ${v.colorKo}`,
        size: line.size,
        qty: line.qty,
        unitPriceKrw: priceOf(p, v),
        category: p.category,
        // 원산지 미확인이면 CKFTA를 적용하지 않는다 (PROJECT.md §3.3)
        originCountry: p.originCountry ?? '',
        weightG: weightGOf(p),
        shippingKrw: shippingKrwOf(p),
        // 색상 전용 주소가 있으면 그것이 이긴다 — 장바구니는 색상이 확정된 화면이다
        smartstoreUrl: v.smartstoreUrl ?? p.smartstoreUrl,
        // TODO(stock): 공급처 신선도 게이트가 붙기 전까지는 항상 구매 가능으로 둔다 (§6.5)
        purchasable: true,
      },
    ];
  });
}
