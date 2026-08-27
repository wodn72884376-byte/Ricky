/**
 * 카탈로그 조회. 화면은 이 파일만 보고, 생성 파일을 직접 import하지 않는다.
 *
 * DB를 붙이면 이 함수들의 속만 `store_variants` 뷰 조회로 바꾸면 된다 —
 * 호출하는 쪽은 그대로다. `product_variants` 직접 조회는 원가 노출이다 (PROJECT.md §3.1).
 */
import { CATALOG, type CatalogProduct } from './catalog.generated';
import { estimateCustoms, type CustomsEstimate } from './customs';
import { CUSTOMS_USD_KRW } from './checkout';
import type { ProductCardProps } from '@/components/store/product-card';

export type { CatalogProduct };

/** 배송비 산정용 무게. TODO(data): 실측값으로 교체 (생성 파일 주석 참조) */
const FALLBACK_WEIGHT_G: Record<string, number> = {
  outerwear: 650, top: 420, bag: 900, accessory: 150, bottom: 350,
};

export function weightGOf(p: CatalogProduct): number {
  return FALLBACK_WEIGHT_G[p.category] ?? 500;
}

function customsFor(p: CatalogProduct): CustomsEstimate {
  return estimateCustoms({
    goodsValueKrw: p.priceKrw,
    usdKrwRate: CUSTOMS_USD_KRW,
    category: p.category,
    // 원산지 미확인이면 CKFTA를 적용하지 않는다 — 유리하게 추정하지 않는다 (§3.3)
    ckftaEligible: p.originCountry === 'CA',
  });
}

/** 상품 카드 props로 변환. 카드는 첫 색상의 대표 이미지를 쓴다. */
export function toCardProps(p: CatalogProduct): ProductCardProps & {
  id: string; category: string; arrivedAt: string; brandSlug: string;
} {
  const v = p.variants[0]!;
  return {
    id: p.slug,
    href: `/products/${p.slug}`,
    imageUrl: v.cardImage,
    imageAlt: `${p.name} ${v.colorKo}`,
    brand: p.brand,
    brandSlug: p.brandSlug,
    name: `${p.name} ${v.colorKo}`,
    priceKrw: p.priceKrw,
    // 한국 정발가를 비교가로 보여준다 — 우리가 만든 할인이 아니라 실제 가격 차이다
    compareAtKrw: p.krRetailKrw && p.krRetailKrw > p.priceKrw ? p.krRetailKrw : undefined,
    customs: customsFor(p),
    category: p.category,
    arrivedAt: '2026-08-27',
  };
}

export function allProducts() {
  return CATALOG;
}

export function byBrand(brandSlug: string) {
  return CATALOG.filter((p) => p.brandSlug === brandSlug);
}

export function byGender(gender: 'men' | 'women') {
  return CATALOG.filter((p) => p.gender === gender || p.gender === 'unisex');
}

export function findProduct(slug: string) {
  return CATALOG.find((p) => p.slug === slug);
}

/** 홈 BEST. TODO(data): featured_rank 또는 판매량으로 교체 (수동 큐레이션 우선) */
export function bestSellers(n = 6) {
  return [...CATALOG]
    .filter((p) => p.krRetailKrw)
    .sort((a, b) => (b.krRetailKrw! - b.priceKrw) - (a.krRetailKrw! - a.priceKrw))
    .slice(0, n);
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
