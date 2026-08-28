/**
 * 재고 조회 실행부.
 *
 * 기존 어댑터의 `fetchListing` 이 이미 JSON-LD 에서 variant 를 뽑아 주므로,
 * 여기서는 그 결과를 variant 단위 행으로 펼치고 사이즈·색상을 정규화한다.
 * 새 수집 경로를 만들지 않는 것이 요점이다 — 파싱 로직이 두 벌이 되면 반드시 갈라진다.
 */
import { getAdapter } from '../adapters/index.ts';
import { BRANDS } from '../config/brands.ts';
import { log } from '../core/logger.ts';
import type { BrandKey } from '../core/types.ts';
import { byNewest } from '../extract/sitemap.ts';
import {
  compareSizes,
  extractColourCode,
  extractStyleCode,
  normalizeColour,
  normalizeSize,
} from './normalize.ts';
import type { ProductStock, StockRow } from './types.ts';

export type CheckOptions = {
  brands: BrandKey[];
  /** 브랜드당 조회할 상품 수. watchUrls 가 있으면 무시된다. */
  limit: number;
  fresh: boolean;
  /** 이 URL 들만 조회한다. 운영에서 실제로 쓰는 방식(감시 목록). */
  watchUrls?: string[];
};

/** 상품 1건의 variant 재고를 조회한다. */
export async function checkProduct(
  brand: BrandKey,
  url: string,
  opts: { fresh?: boolean } = {},
): Promise<ProductStock> {
  const checkedAt = new Date().toISOString();
  const adapter = getAdapter(brand);

  let listing;
  try {
    listing = await adapter.fetchListing(url, 'CA', { fresh: opts.fresh });
  } catch (err) {
    return {
      brand,
      productUrl: url,
      productName: '',
      productCode: null,
      rows: [],
      error: err instanceof Error ? err.message : String(err),
      checkedAt,
    };
  }

  if (!listing) {
    return {
      brand,
      productUrl: url,
      productName: '',
      productCode: null,
      rows: [],
      // 차단·파싱 실패를 "재고 없음"으로 오해하면 안 된다. §6.5 에 따라 판매 차단 사유가 된다.
      error: '상품 데이터를 얻지 못했다 (차단 또는 마크업 변경)',
      checkedAt,
    };
  }

  const source = listing.fetchMode === 'manual' ? 'http' : listing.fetchMode;

  const rows: StockRow[] = listing.variants.map((v) => ({
    brand,
    productCode: listing.productCode,
    productName: listing.name,
    productUrl: listing.url,
    sku: v.sku,
    gtin: v.gtin,
    styleCode: extractStyleCode(brand, v.sku),
    colour: normalizeColour(v.color),
    colourCode: extractColourCode(brand, v.sku),
    size: normalizeSize(brand, v.size, v.sku),
    availability: v.availability,
    priceCents: v.priceMinor,
    listPriceCents: listing.listPriceMinor,
    onSale:
      listing.listPriceMinor !== null &&
      v.priceMinor !== null &&
      listing.listPriceMinor > v.priceMinor,
    checkedAt,
    source,
  }));

  // 색상 → 사이즈 순으로 정렬해 두면 리포트에서 매트릭스가 그대로 읽힌다.
  rows.sort(
    (a, b) =>
      (a.colour ?? '').localeCompare(b.colour ?? '') || compareSizes(a.size.label, b.size.label),
  );

  /*
   * variant 가 하나도 없으면 그건 "품절"이 아니라 "수집 실패"다.
   * 이 구분을 잃으면 멀쩡한 상품을 판매 중지시키게 된다.
   */
  if (rows.length === 0) {
    return {
      brand,
      productUrl: url,
      productName: listing.name,
      productCode: listing.productCode,
      rows: [],
      error: 'variant 정보가 없다 (사이즈·색상 마크업 변경 의심)',
      checkedAt,
    };
  }

  return {
    brand,
    productUrl: listing.url,
    productName: listing.name,
    productCode: listing.productCode,
    rows,
    error: null,
    checkedAt,
  };
}

/** 브랜드별로 조회 대상 URL 을 정한다. */
async function resolveUrls(
  brand: BrandKey,
  opts: CheckOptions,
): Promise<Array<{ url: string; lastModified: string | null }>> {
  if (opts.watchUrls?.length) {
    const origin = BRANDS[brand].ca.origin;
    return opts.watchUrls
      .filter((u) => u.startsWith(origin))
      .map((url) => ({ url, lastModified: null }));
  }

  const found = await getAdapter(brand).discover('CA', {
    limit: opts.limit,
    fresh: opts.fresh,
  });
  return [...found].sort(byNewest).slice(0, opts.limit);
}

export async function runStockCheck(opts: CheckOptions): Promise<ProductStock[]> {
  const out: ProductStock[] = [];

  for (const brand of opts.brands) {
    const cfg = BRANDS[brand];

    // 감시 목록 모드에서는 해당 브랜드 URL 이 없으면 조용히 건너뛴다.
    // 목록에 없는 브랜드까지 "조회 대상 없음"을 찍으면 실제 실패가 묻힌다.
    const targets = await resolveUrls(brand, opts);
    if (targets.length === 0) {
      if (!opts.watchUrls?.length) log.warn(`${cfg.labelKo}: 조회 대상 없음`);
      continue;
    }

    log.step(`${cfg.labelKo} 재고 조회 — 대상 ${targets.length}건`);

    for (const t of targets) {
      const result = await checkProduct(brand, t.url, { fresh: opts.fresh });
      out.push(result);

      if (result.error) {
        log.warn(`  ✗ ${t.url.split('/').pop()} — ${result.error}`);
      } else {
        const inStock = result.rows.filter((r) => r.availability === 'in_stock').length;
        const colours = new Set(result.rows.map((r) => r.colour)).size;
        const sizes = new Set(result.rows.map((r) => r.size.label).filter((s) => s !== '-')).size;
        log.ok(
          `  ${result.productName} — ${colours}색 × ${sizes || 1}사이즈 · 재고 ${inStock}/${result.rows.length}`,
        );
      }
    }
  }

  return out;
}
