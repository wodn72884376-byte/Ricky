/**
 * 수집 결과(스크래핑 프로젝트의 `연동-*.json`)를 DB 적재 입력으로 바꾸는 순수 변환.
 *
 * `seed-rows.ts`와 같은 원칙 — **쓰기와 분리한다.** 여기는 파일 → 행 배열만 만들고
 * 실제 insert는 `scripts/load-stock.mjs`가 한다. 그래야 Supabase 프로젝트 없이도
 * 규칙에 테스트를 붙일 수 있다.
 *
 * ## 왜 `재고-*.json`이 아니라 `연동-*.json`인가
 * 재고 스냅샷은 상품 URL을 **행 단위**로 들고 있어서, 거기서 variant별 URL을 되찾으려면
 * 조인을 한 번 더 해야 한다. 실제로 그렇게 짰다가 브랜드 첫 행의 URL을 그 브랜드
 * 전체에 붙이는 버그가 났다 — `supplier_listings.product_url`이 엉뚱한 상품을 가리키고,
 * 유니크 키가 `(variant_id, product_url)`이라 행이 뭉개진다.
 * `연동-*.json`은 이미 variant마다 자기 `supplierUrl`을 들고 있다.
 */
import type { LinkedStock } from './seed-rows';

/** 스크래핑 프로젝트 `toSupabasePayload()`의 산출물 중 우리가 쓰는 부분. */
export type StockPayload = {
  meta: { audience: string; snapshot: string; generatedAt: string };
  variants: {
    slug: string;
    brand: string;
    sku: string;
    color: string;
    supplierUrl: string | null;
    observedCadCents: number | null;
    onSale: boolean;
    sizes: { label: string; availability: string; cadCents: number | null }[];
    checkedAt: string;
    source: string;
  }[];
};

export type LoadInput = {
  linked: LinkedStock[];
};

/**
 * 여러 회차를 합친다.
 *
 * 회차마다 담긴 브랜드가 다르다 — 최신 파일 하나만 보면 나머지 브랜드가 통째로 빠진다.
 * 같은 variant가 여러 번 나오면 **가장 최근 관측**을 쓴다. 오래된 값이 최신 값을 덮으면
 * 품절이 되살아난다.
 *
 * 오래된 회차가 섞이는 것 자체는 문제가 아니다 — 각 행이 자기 `checkedAt`을 들고 있어
 * 신선도 게이트가 요청 시점에 걸러 낸다.
 */
export function mergePayloads(payloads: StockPayload[]): StockPayload['variants'] {
  const byKey = new Map<string, StockPayload['variants'][number]>();

  for (const p of payloads) {
    for (const v of p.variants) {
      const key = `${v.slug}|${v.sku}|${v.color}`;
      const prev = byKey.get(key);
      if (!prev || v.checkedAt > prev.checkedAt) byKey.set(key, v);
    }
  }
  return [...byKey.values()];
}

/**
 * 적재 입력으로 바꾼다.
 *
 * 공급처 URL이 없는 variant는 **버린다.** `supplier_listings.product_url`은 not null이고,
 * 무엇보다 어디서 본 재고인지 모르는 값으로 판매를 열 수는 없다.
 */
export function toLoadInput(variants: StockPayload['variants']): LoadInput {
  const usable = variants.filter((v) => v.supplierUrl);

  const linked: LinkedStock[] = usable.map((v) => ({
    slug: v.slug,
    brand: v.brand,
    sku: v.sku,
    color: v.color,
    productUrl: v.supplierUrl!,
    sizes: v.sizes.map((s) => ({
      label: s.label,
      availability: s.availability,
      priceCents: s.cadCents,
      // 세일 여부는 색상 단위다 — 사이즈마다 다르지 않다 (실측 380행에서 0건)
      onSale: v.onSale,
    })),
    checkedAt: v.checkedAt,
    source: v.source,
  }));

  return { linked };
}
