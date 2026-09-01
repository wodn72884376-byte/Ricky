/**
 * 수집 결과를 상위 프로젝트(RICKY)가 Supabase 에 넣을 수 있는 모양으로 낸다.
 *
 * `link.ts` 가 재고 행을 카탈로그 variant 에 붙이는 **조인**이라면,
 * 여기는 그 결과를 파일로 내보내는 **적재용 산출물**이다.
 *
 * ## 이 파일은 관리자 전용이다
 * CAD 원가가 들어 있다. CLAUDE.md 규칙 1 — 원가(CAD)·마진율·환율은 관리자 전용 데이터이며
 * **고객용 API 응답에 절대 포함하지 않는다.** 스토어는 `store_variants` 뷰를 통해서만
 * 재고·가격을 읽는다. 그래서 payload 에 `audience: 'admin'` 을 박아 둔다 —
 * 이걸 그대로 고객 응답에 실으면 규칙 위반이라는 걸 받는 쪽이 알 수 있어야 한다.
 *
 * ## 가격의 단위는 색상이다
 * 실측(2026-08-29, 380행): 같은 색상 안에서 사이즈별로 가격이 갈리는 경우는 **0건**이었다.
 * 반대로 색상별로는 갈린다 — 랄프로렌 638616 은 RL 2000 Red 가 CA$149.99, 나머지가 CA$218.00.
 * 카탈로그 variant 도 (상품, 색상) 단위이므로 둘의 결이 맞는다.
 *
 * ## 신선도는 여기서 판정하지 않는다
 * `checkedAt` 만 싣는다. `ageHours` 나 `stale` 을 계산해 넣으면 파일이 만들어진 순간의
 * 값이 굳어 버리고, 받는 쪽이 그 굳은 값을 믿는다. 신선도 게이트(기본 6h, PROJECT.md §6)는
 * **요청 시점에** 계산해야 하는 것이다.
 */
import { CATALOG } from '@app/lib/catalog.generated.ts';
import type { BrandKey } from '../core/types.ts';
import { linkStock, type CatalogLike, type LinkedVariant } from './link.ts';
import type { StockRow } from './types.ts';

export type VariantSize = {
  label: string;
  availability: StockRow['availability'];
  cadCents: number | null;
};

export type VariantStock = {
  /** 카탈로그 상품 slug — Supabase products 행을 가리킨다 */
  slug: string;
  brand: BrandKey;
  /** 카탈로그 variant SKU — (상품, 색상). Supabase variants 의 조인 키 */
  sku: string;
  color: string;
  /** 공급처(캐나다 공식몰) 상품 페이지. 사람이 되짚을 수 있게 남긴다 */
  supplierUrl: string | null;
  /** 카탈로그를 만들 때 쓴 CAD 원가 */
  catalogCadCents: number | null;
  /** 이번에 관측한 CAD 원가. 색상 단위 */
  observedCadCents: number | null;
  /** 관측값이 카탈로그와 다르다 → 판매가를 다시 계산해야 한다 */
  priceChanged: boolean;
  /**
   * 사이트가 **직접 세일이라고 말한** 경우만 true.
   * variant 최고가에서 추론하지 않는다 — 실측에서 그렇게 했다가 없는 43% 세일을 지어냈다.
   */
  onSale: boolean;
  sizes: VariantSize[];
  /** 이 variant 를 마지막으로 확인한 시각. 신선도 게이트가 요청 시점에 쓴다 */
  checkedAt: string;
  source: StockRow['source'];
};

/** 색상별 가격이 갈리는데 사이트가 세일이라고 말하지 않은 건. 사람이 봐야 한다. */
export type PriceAlert = {
  slug: string;
  brand: BrandKey;
  /** 이 상품에서 가장 흔한 가격 — 정가로 볼 만한 값 */
  typicalCadCents: number;
  odd: { color: string; cadCents: number }[];
};

export type SupabasePayload = {
  meta: {
    /** 이 파일은 원가를 담고 있다. 고객 응답에 실으면 안 된다 (CLAUDE.md 규칙 1) */
    audience: 'admin';
    generatedAt: string;
    snapshot: string;
    counts: { linked: number; unlinked: number; orphanRows: number };
    /** 신선도는 받는 쪽이 요청 시점에 계산한다 — 여기서 굳히지 않는다 */
    freshnessNote: string;
  };
  variants: VariantStock[];
  /** 카탈로그에 있는데 이번에 재고를 못 받은 variant. 스토어에서 "확인 중"이 된다 */
  unlinked: { slug: string; brand: string; sku: string; color: string }[];
  priceAlerts: PriceAlert[];
};

/**
 * 적재에 필요한 카탈로그 모양. `CatalogLike` 에 원가만 더한 것이다.
 * 테스트가 실제 카탈로그에 매달리지 않도록 주입받는다.
 */
export type PricedCatalog = readonly {
  slug: string;
  name: string;
  brandSlug: string;
  variants: readonly { sku: string; color: string; cadCents?: number }[];
}[];

/** 카탈로그 variant 의 CAD 원가를 SKU 로 찾는다. */
function catalogCad(catalog: PricedCatalog): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of catalog) {
    for (const v of p.variants) {
      if (typeof v.cadCents === 'number') out.set(v.sku, v.cadCents);
    }
  }
  return out;
}

/**
 * variant 하나의 CAD 가격.
 *
 * 사이즈별로 갈리는 경우는 실측에서 없었지만, 생기면 **가장 낮은 값**을 쓰지 않는다 —
 * 그러면 못 사는 사이즈의 가격으로 판매가를 매기게 된다. 가장 흔한 값을 쓴다.
 */
function variantCad(sizes: LinkedVariant['sizes']): number | null {
  const seen = new Map<number, number>();
  for (const s of sizes) {
    if (s.priceCents === null) continue;
    seen.set(s.priceCents, (seen.get(s.priceCents) ?? 0) + 1);
  }
  if (seen.size === 0) return null;
  return [...seen.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
}

/**
 * 색상별 가격이 갈리는데 세일 표기가 없는 상품을 찾는다.
 *
 * 실측(랄프로렌 638616): RL 2000 Red 만 CA$149.99, 나머지 14색은 CA$218.00 인데
 * JSON-LD 에는 세일 표기가 없다. 이 149.99 를 그대로 원가로 넣으면 마크다운이 끝났을 때
 * 원화 판매가가 조용히 어긋난다. **판정하지 않고 알린다** — 세일을 지어내지는 않는다.
 *
 * 비교 단위는 상품이 아니라 **공급처 페이지**다. 한 카탈로그 상품이 페이지 둘에 걸칠 수
 * 있다 — 아크테릭스는 정가몰과 아울렛이 갈리고(Beta AR: 정가 840, 아울렛 588) 그건
 * 값이 다른 게 당연하다. 상품 단위로 보면 그 상품은 **매 회차 영원히** 경고를 낸다.
 * 늘 켜져 있는 경고는 곧 아무도 안 보는 경고가 된다.
 */
function priceAlerts(variants: VariantStock[]): PriceAlert[] {
  const byProduct = new Map<string, VariantStock[]>();
  for (const v of variants) {
    const bucket = `${v.slug}\u0000${v.supplierUrl ?? ''}`;
    const list = byProduct.get(bucket) ?? [];
    list.push(v);
    byProduct.set(bucket, list);
  }

  const out: PriceAlert[] = [];
  for (const [bucket, list] of byProduct) {
    const slug = bucket.split('\u0000')[0]!;
    const priced = list.filter((v) => v.observedCadCents !== null && !v.onSale);
    if (priced.length < 2) continue;

    const freq = new Map<number, number>();
    for (const v of priced) freq.set(v.observedCadCents!, (freq.get(v.observedCadCents!) ?? 0) + 1);
    if (freq.size < 2) continue;

    const typical = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]![0];
    const odd = priced
      .filter((v) => v.observedCadCents !== typical)
      .map((v) => ({ color: v.color, cadCents: v.observedCadCents! }))
      .sort((a, b) => a.cadCents - b.cadCents);

    if (odd.length > 0) out.push({ slug, brand: list[0]!.brand, typicalCadCents: typical, odd });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function toSupabasePayload(
  rows: StockRow[],
  meta: { snapshot: string; generatedAt?: string; catalog?: PricedCatalog },
): SupabasePayload {
  const catalog = meta.catalog ?? (CATALOG as PricedCatalog);
  const { linked, unlinked, orphanRows } = linkStock(rows, catalog as CatalogLike);
  const cad = catalogCad(catalog);

  const variants: VariantStock[] = linked.map((v) => {
    const observed = variantCad(v.sizes);
    const catalogue = cad.get(v.sku) ?? null;
    return {
      slug: v.slug,
      brand: v.brand,
      sku: v.sku,
      color: v.color,
      // variant 자신이 관측된 페이지를 쓴다 — 캐나다구스는 디스크마다 PDP 가 다르다
      supplierUrl: v.productUrl,
      catalogCadCents: catalogue,
      observedCadCents: observed,
      priceChanged: observed !== null && catalogue !== null && observed !== catalogue,
      onSale: v.sizes.some((s) => s.onSale),
      sizes: v.sizes.map((s) => ({
        label: s.label,
        availability: s.availability,
        cadCents: s.priceCents,
      })),
      checkedAt: v.checkedAt,
      source: v.source,
    };
  });

  return {
    meta: {
      audience: 'admin',
      generatedAt: meta.generatedAt ?? new Date().toISOString(),
      snapshot: meta.snapshot,
      counts: { linked: linked.length, unlinked: unlinked.length, orphanRows },
      freshnessNote:
        'checkedAt 만 싣는다. 신선도(기본 6h)는 받는 쪽이 요청 시점에 계산한다 — PROJECT.md §6',
    },
    variants,
    unlinked,
    priceAlerts: priceAlerts(variants),
  };
}

/** 사람이 눈으로 확인하는 용도. 적재는 JSON 을 쓴다. */
export function toSupabaseCsv(payload: SupabasePayload): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = [
    'slug', '브랜드', 'SKU', '색상', '사이즈', '재고',
    '관측CAD', '카탈로그CAD', '가격변동', '세일', '확인시각', '수집경로', '공급처URL',
  ];
  const lines = [head.join(',')];

  for (const v of payload.variants) {
    for (const s of v.sizes) {
      lines.push(
        [
          v.slug, v.brand, v.sku, v.color, s.label, s.availability,
          s.cadCents === null ? '' : (s.cadCents / 100).toFixed(2),
          v.catalogCadCents === null ? '' : (v.catalogCadCents / 100).toFixed(2),
          v.priceChanged ? '변동' : '',
          v.onSale ? '세일' : '',
          v.checkedAt, v.source, v.supplierUrl ?? '',
        ]
          .map(esc)
          .join(','),
      );
    }
  }
  // 엑셀이 한글을 깨지 않도록 BOM
  return '﻿' + lines.join('\n') + '\n';
}
