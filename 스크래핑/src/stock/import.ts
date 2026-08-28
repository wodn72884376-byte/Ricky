/**
 * 북마클릿 수집분 가져오기.
 *
 * 자동 수집(`checkProduct`)과 **같은 추출기·같은 정규화**를 태운다.
 * 경로만 다를 뿐 결과물은 구분되지 않아야 한다 — 그래야 매트릭스도 변화 감지도
 * 자동/수동 수집분을 섞어서 다룰 수 있다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { BRANDS, ALL_BRAND_KEYS } from '../config/brands.ts';
import { log } from '../core/logger.ts';
import type { BrandKey } from '../core/types.ts';
import { extractProductFromNodes } from '../extract/jsonld.ts';
import {
  compareSizes,
  extractColourCode,
  extractStyleCode,
  normalizeColour,
  normalizeSize,
} from './normalize.ts';
import {
  CAPTURE_FILE_PREFIX,
  type BatchItem,
  type DomOption,
  type StockCapture,
} from './bookmarklet.ts';
import type { ProductStock, StockRow } from './types.ts';

/** URL 로 브랜드를 판정한다. 모르는 사이트면 null. */
export function brandFromUrl(url: string): BrandKey | null {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return null;
  }
  for (const key of ALL_BRAND_KEYS) {
    const cfg = BRANDS[key];
    if (origin === cfg.ca.origin || origin === cfg.kr?.origin) return key;
  }
  return null;
}

/**
 * 수집 파일 1건 → ProductStock 여러 건.
 *
 * 목록수집 북마클릿은 파일 하나에 상품 여러 건을 담는다. 이걸 개별 캡처처럼 펼쳐
 * 단건 수집과 완전히 같은 경로를 타게 한다 — 해석은 한 곳에서만 한다.
 */
export function captureToStocks(capture: StockCapture): ProductStock[] {
  if (!capture.batch?.length) return [captureToStock(capture)];

  return capture.batch.map((item: BatchItem) =>
    captureToStock({
      v: capture.v,
      url: item.url,
      title: item.title || capture.title,
      capturedAt: capture.capturedAt,
      jsonld: item.jsonld ?? [],
      ...(item.dom ? { dom: item.dom } : {}),
    }),
  );
}

/** 수집 파일 1건 → ProductStock */
export function captureToStock(capture: StockCapture): ProductStock {
  const brand = brandFromUrl(capture.url);
  const checkedAt = capture.capturedAt;

  const base = {
    brand: brand ?? ('arcteryx' as BrandKey),
    productUrl: capture.url,
    productName: capture.title,
    productCode: null,
    rows: [] as StockRow[],
    checkedAt,
  };

  if (!brand) {
    return { ...base, error: `등록되지 않은 사이트다: ${capture.url}` };
  }

  // 북마클릿이 담아 온 원문을 파싱한다. 깨진 블록 하나가 전체를 막지 않는다.
  const nodes: Array<Record<string, unknown>> = [];
  for (const raw of capture.jsonld) {
    try {
      const parsed: unknown = JSON.parse(raw);
      for (const n of Array.isArray(parsed) ? parsed : [parsed]) {
        if (n && typeof n === 'object') nodes.push(n as Record<string, unknown>);
        const graph = (n as Record<string, unknown>)?.['@graph'];
        if (Array.isArray(graph)) {
          for (const g of graph) if (g && typeof g === 'object') nodes.push(g);
        }
      }
    } catch {
      // 광고 태그 등 상품과 무관한 블록이 섞여 있다
    }
  }

  const product = extractProductFromNodes(nodes, 'CAD');
  if (!product) {
    return { ...base, brand, error: '상품 JSON-LD 가 없다 (상품 상세 페이지에서 눌렀는지 확인)' };
  }

  /*
   * 상품코드는 한 번만 정하고 행·헤더가 같은 값을 쓴다.
   *
   * 따로 계산하면 갈라진다 — 실제로 행에는 URL 폴백을 걸고 헤더에는 안 걸어서
   * 헤더만 '-' 로 나왔고, 그 사이 변화 감지 키까지 흔들려 가짜 이벤트가 났다.
   */
  const productCode =
    product.productCode ?? BRANDS[brand].ca.productCodeFromUrl?.(capture.url) ?? null;

  const rows: StockRow[] = product.variants.map((v) => ({
    brand,
    productCode,
    productName: product.name,
    productUrl: capture.url,
    sku: v.sku,
    gtin: v.gtin,
    styleCode: extractStyleCode(brand, v.sku),
    colour: normalizeColour(v.color),
    colourCode: extractColourCode(brand, v.sku),
    size: normalizeSize(brand, v.size, v.sku),
    availability: v.availability,
    priceCents: v.priceMinor,
    listPriceCents: product.listPriceMinor,
    onSale:
      product.listPriceMinor !== null &&
      v.priceMinor !== null &&
      product.listPriceMinor > v.priceMinor,
    checkedAt,
    // 사람이 직접 연 페이지에서 온 값이다. 리포트에서 자동 수집분과 구분된다.
    source: 'manual',
  }));

  const merged = applyDomTruth(rows, capture, brand, checkedAt, productCode, product.name);

  merged.sort(
    (a, b) =>
      (a.colour ?? '').localeCompare(b.colour ?? '') || compareSizes(a.size.label, b.size.label),
  );

  if (merged.length === 0) {
    return {
      ...base,
      brand,
      productName: product.name,
      productCode: product.productCode,
      error: 'variant 정보가 없다 (사이즈·색상 마크업 변경 의심)',
    };
  }

  return {
    brand,
    productUrl: capture.url,
    productName: product.name,
    productCode,
    rows: merged,
    error: null,
    checkedAt,
  };
}

/**
 * 화면에서 읽은 사이즈를 JSON-LD 에 **합친다**.
 *
 * 두 소스가 서로 다른 방식으로 불완전하다.
 *   랄프로렌  JSON-LD 에 사이즈를 일부만 싣고 재고를 전부 InStock 으로 적는다
 *             → 화면이 정답이다
 *   코치      화면에는 살 수 있는 사이즈 버튼만 나온다(품절 사이즈는 안 그린다)
 *             → JSON-LD 에만 있는 품절 사이즈를 화면 기준으로 지우면 안 된다
 *
 * 그래서 덮어쓰기가 아니라 합집합이다.
 *   - 화면에 있는 사이즈  → 화면의 재고 상태가 이긴다 (실제로 보이는 것이므로)
 *   - JSON-LD 에만 있는 사이즈 → 그대로 둔다 (화면에 없다고 없는 게 아니다)
 *
 * 선택되지 않은 색상은 건드리지 않는다 — 화면에 안 떠 있으니 알 수 없다.
 * 그 색상까지 채우려면 색상을 바꿔 한 번 더 캡처하면 되고, import 가 합쳐 준다.
 */
function applyDomTruth(
  rows: StockRow[],
  capture: StockCapture,
  brand: BrandKey,
  checkedAt: string,
  productCode: string | null,
  productName: string,
): StockRow[] {
  const dom = capture.dom;
  if (!dom) return rows;

  /*
   * 색상을 눌러 가며 읽은 결과가 있으면 그것도 함께 합친다.
   * 랄프로렌은 색상이 6개 이상이면 JSON-LD 에서 사이즈를 빼기 때문에,
   * 그 상품들은 이 경로가 유일한 사이즈 출처다.
   */
  const passes: Array<{ colour: string | null; sizes: DomOption[] }> = [
    ...(dom.byColour ?? []),
    { colour: dom.selectedColour, sizes: dom.sizes ?? [] },
  ];

  const ctx: MergeContext = { brand, checkedAt, productCode, productName, url: capture.url };

  let out = rows;
  for (const pass of passes) {
    if (pass.sizes?.length) out = mergeColourSizes(out, pass.colour, pass.sizes, ctx);
  }
  return out;
}

/**
 * 사이즈처럼 생긴 라벨만 받는다.
 *
 * 북마클릿에도 같은 규칙이 있지만, 사용자가 재설치하기 전에 만든 캡처가 계속 들어온다.
 * 실측 사고(랄프로렌 638616): 수량 선택 드롭다운의 "1" 이 사이즈 축에 열로 섞여
 * 존재하지 않는 사이즈가 리포트에 생겼다. 마지막 관문을 서버 쪽에도 둔다.
 */
const SIZE_TOKEN =
  /^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|(XXS|XS|S|M|L|XL|XXL)\/(XS|S|M|L|XL|XXL)|([5-9]|1[0-5])(\.5)?)$/i;

export function looksLikeSize(label: string): boolean {
  return SIZE_TOKEN.test(label.trim());
}

type MergeContext = {
  brand: BrandKey;
  checkedAt: string;
  productCode: string | null;
  productName: string;
  url: string;
};

/** 색상 하나의 화면 사이즈를 기존 행에 합친다. */
function mergeColourSizes(
  current: StockRow[],
  rawColour: string | null,
  sizes: DomOption[],
  ctx: MergeContext,
): StockRow[] {
  // 어느 색상인지 모르면 어느 줄에 합칠지 알 수 없다.
  const colour = normalizeColour(rawColour);
  if (!colour) return current;

  const others = current.filter((r) => r.colour !== colour);
  const mine = current.filter((r) => r.colour === colour);
  const template = mine[0] ?? current[0];

  const byLabel = new Map(mine.map((r) => [r.size.label, r]));

  for (const opt of sizes) {
    if (!looksLikeSize(opt.label)) continue;
    const size = normalizeSize(ctx.brand, opt.label, byLabel.get(opt.label)?.sku ?? null);
    const existing = byLabel.get(size.label);

    byLabel.set(size.label, {
      brand: ctx.brand,
      productCode: ctx.productCode,
      productName: ctx.productName,
      productUrl: ctx.url,
      sku: existing?.sku ?? null,
      gtin: existing?.gtin ?? null,
      styleCode: existing?.styleCode ?? null,
      colour,
      colourCode: existing?.colourCode ?? null,
      size,
      // 화면에 보이는 상태가 이긴다
      availability: opt.available ? 'in_stock' : 'out_of_stock',
      priceCents: existing?.priceCents ?? template?.priceCents ?? null,
      listPriceCents: existing?.listPriceCents ?? template?.listPriceCents ?? null,
      onSale: existing?.onSale ?? template?.onSale ?? false,
      checkedAt: ctx.checkedAt,
      source: 'manual',
    });
  }

  return [...others, ...byLabel.values()];
}

/**
 * 같은 상품의 여러 캡처를 하나로 합친다.
 *
 * 사이트는 **선택된 색상의 사이즈만** 화면에 보여 준다. 그래서 전체 매트릭스를 채우려면
 * 색상을 바꿔 가며 여러 번 캡처해야 하고, 그 결과를 덮어쓰면 마지막 색상만 남는다.
 * variant 키(SKU 또는 색상+사이즈)로 합치되, 나중에 잡힌 값이 이긴다.
 */
export function mergeProductStock(parts: ProductStock[]): ProductStock {
  const base = parts.reduce((a, b) => (a.checkedAt >= b.checkedAt ? a : b));
  const byKey = new Map<string, StockRow>();

  for (const p of [...parts].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))) {
    for (const r of p.rows) {
      byKey.set(r.sku ?? `${r.colour ?? ''}|${r.size.label}`, r);
    }
  }

  const rows = [...byKey.values()].sort(
    (a, b) =>
      (a.colour ?? '').localeCompare(b.colour ?? '') || compareSizes(a.size.label, b.size.label),
  );

  return { ...base, rows, error: rows.length === 0 ? base.error : null };
}

/**
 * 디렉터리에서 수집 파일을 읽는다.
 * 같은 URL 이 여러 번 잡혔으면 합친다(색상별로 나눠 캡처하는 경우).
 */
export async function importCaptures(dir: string): Promise<ProductStock[]> {
  let files: string[];
  try {
    files = (await readdir(dir)).filter(
      (f) => f.startsWith(CAPTURE_FILE_PREFIX) && f.endsWith('.json'),
    );
  } catch {
    throw new Error(`디렉터리를 읽지 못했다: ${dir}`);
  }

  if (files.length === 0) {
    throw new Error(
      `${dir} 에 수집 파일이 없다.\n` +
        `북마클릿으로 상품 페이지에서 저장한 ${CAPTURE_FILE_PREFIX}*.json 을 찾는다.\n` +
        `설치 방법: npm run bookmarklet`,
    );
  }

  // URL 을 정규화해 묶는다 — 색상 선택이 해시·쿼리로 붙어 같은 상품이 갈라지지 않게.
  const byProduct = new Map<string, ProductStock[]>();
  let skipped = 0;
  let batchFiles = 0;

  for (const f of files.sort()) {
    try {
      const capture = JSON.parse(await readFile(join(dir, f), 'utf8')) as StockCapture;
      if (!capture?.url || (!Array.isArray(capture.jsonld) && !capture.batch)) {
        skipped += 1;
        continue;
      }
      if (capture.batch?.length) batchFiles += 1;

      for (const stock of captureToStocks(capture)) {
        const key = canonicalUrl(stock.productUrl);
        const list = byProduct.get(key) ?? [];
        list.push(stock);
        byProduct.set(key, list);
      }
    } catch {
      skipped += 1;
    }
  }

  const multi = [...byProduct.values()].filter((v) => v.length > 1).length;
  log.info(
    `수집 파일 ${files.length}건${batchFiles ? ` (목록수집 ${batchFiles}건)` : ''} → 상품 ${byProduct.size}건` +
      (multi ? ` · ${multi}건은 여러 캡처를 병합` : '') +
      (skipped ? ` · 형식 불일치 ${skipped}건 무시` : ''),
  );

  return [...byProduct.values()].map((parts) =>
    parts.length === 1 ? parts[0]! : mergeProductStock(parts),
  );
}

/** 색상 선택 등으로 붙는 쿼리·해시를 떼어 같은 상품을 하나로 본다. */
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}
