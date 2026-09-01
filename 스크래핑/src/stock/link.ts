/**
 * 수집한 재고를 RICKY 카탈로그의 variant에 붙인다.
 *
 * `catalog.ts`가 카탈로그 → 조회 대상(URL)의 **가는 길**이라면, 여기는 돌아오는 길이다.
 * 수집 결과(StockRow)를 (상품 slug, 색상, 사이즈)로 되돌려 스토어가 쓸 수 있게 한다.
 *
 * **브랜드마다 조인 키가 다르다.** 하나의 규칙으로 뭉개면 코치가 통째로 빠진다 —
 * 실측(2026-08-29, 997행)에서 단일 규칙은 132개 중 73개만 붙었다.
 *
 *   arcteryx   카탈로그 SKU 앞자리 = 재고 productCode      X000010932 = X000010932
 *   polo       같음                                        100066198  = 100066198
 *   coach      카탈로그 SKU 앞자리 = 재고 **styleCode**     CU068 ≠ productCode CDZ42
 *              색상도 카탈로그가 더 길다 —
 *              `natural grain leather,Brass,Black` vs `Brass/Black`
 *   lululemon  카탈로그에 상품코드가 없다(`LULULEMON-…`). 이름으로만 대조한다.
 *
 * 붙지 않은 variant는 **없는 것이 아니라 모르는 것**이다. 여기서는 판단하지 않고
 * 비워서 넘긴다 — 판매 가능 여부는 신선도까지 보고 스토어가 정한다 (PROJECT.md §6.5).
 *
 * 카탈로그는 **인자로 받는다.** `@app/…`을 여기서 import하면 이 모듈이 상위 프로젝트의
 * tsconfig 별칭에 묶여, 앱 쪽 스크립트에서 같은 매처를 쓸 수 없다 — 규칙을 두 벌로
 * 두게 되는 지름길이다.
 */
import type { BrandKey } from '../core/types.ts';
import { BRANDS, toBrandKey } from '../config/brands.ts';
import { jaccard, tokenize } from '../match/normalize.ts';
import { compareSizes } from './normalize.ts';
import type { StockRow } from './types.ts';

/** 대조용 정규화. 표기 차이(공백·하이픈·슬래시·대소문자)만 걷어낸다. */
const key = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * 모음을 걷어낸 뼈대. 표기 축약을 흡수한다.
 *
 * 캐나다구스는 같은 색을 페이지마다 다르게 쓴다 — 카탈로그 `Atlantic Navy`,
 * 사이트 `Atlantic Nvy`. `key()` 로는 안 붙고, 실측으로 4개 색상이 통째로 빠졌다.
 * 모음을 빼면 둘 다 `TLNTCNVY` 가 된다.
 *
 * 짧은 값은 우연히 겹치므로(`BLUE`→`BL`) 4자 이상일 때만 쓴다.
 */
const skeleton = (s: unknown) => key(s).replace(/[AEIOU]/g, '');

/**
 * 사이트가 두 언어를 한 칸에 넣는 경우가 있다 — `Granite Grey/ Gris granit`.
 * 슬래시 앞만 본다. 카탈로그 쪽 색상은 이미 SKU 꼬리라 슬래시가 없다.
 */
const firstLocale = (s: string | null) => (s ?? '').split('/')[0]!.trim();

/** 캐나다구스 색상 대조. 정확히 맞지 않으면 뼈대로 한 번 더 본다. */
function canadaGooseColourMatches(catalogTail: string, rowColour: string | null): boolean {
  const site = firstLocale(rowColour);
  if (!site) return false;
  if (key(catalogTail).endsWith(key(site))) return true;
  const sk = skeleton(site);
  return sk.length >= 4 && skeleton(catalogTail).endsWith(sk);
}

/** 이름 대조 임계. 이보다 낮으면 다른 상품으로 본다. */
const NAME_THRESHOLD = 0.6;

/** 카탈로그 variant 하나에 붙은 재고. 사이즈별로 나뉜다. */
export type LinkedVariant = {
  slug: string;
  brand: BrandKey;
  /** 카탈로그 variant SKU — (상품, 색상)을 가리킨다 */
  sku: string;
  color: string;
  /** 사이즈별 재고. 가방처럼 사이즈가 없으면 label이 `-`인 한 줄 */
  sizes: {
    label: string;
    availability: StockRow['availability'];
    priceCents: number | null;
    onSale: boolean;
  }[];
  /**
   * 이 재고를 본 공급처 페이지.
   *
   * 상품이 아니라 **variant마다** 들고 있어야 한다. 캐나다구스는 디스크마다 PDP가
   * 따로라 한 카탈로그 상품의 색상들이 서로 다른 페이지에서 온다.
   * slug로 되찾으려 하면 한 URL이 나머지 색상에까지 붙는다.
   */
  productUrl: string;
  /** 이 variant에서 가장 최근 확인 시각. 신선도 게이트가 쓴다 */
  checkedAt: string;
  /** 어떤 경로로 얻었는지 — 사람이 본 값과 자동 폴링은 신선도가 다르다 */
  source: StockRow['source'];
};

export type LinkReport = {
  linked: LinkedVariant[];
  /** 붙지 않은 카탈로그 variant. 스토어에서 `재고를 확인하고 있어요`가 된다 */
  unlinked: { slug: string; brand: string; sku: string; color: string }[];
  /** 카탈로그에 없는 수집분. 공급처에만 있는 색상이라 버린다 */
  orphanRows: number;
};

/** 카탈로그 SKU를 (상품코드, 색상 꼬리)로 가른다. */
function splitSku(sku: string): { head: string; tail: string } {
  const head = sku.split('-')[0] ?? '';
  return { head, tail: sku.slice(head.length + 1) };
}

/**
 * 재고 행이 이 카탈로그 variant의 것인가.
 *
 * 브랜드별 규칙을 한 함수에 모아 둔다 — 흩어 두면 한쪽만 고치게 된다.
 */
function matches(brand: BrandKey, sku: string, productName: string, row: StockRow): boolean {
  const { head, tail } = splitSku(sku);

  if (brand === 'coach') {
    // 앞자리는 styleCode다. productCode(페이지 그룹 코드)와 다르다.
    if (key(row.styleCode) !== key(head)) return false;
    // 카탈로그 색상은 `소재,하드웨어,색상`이라 재고 색상(`하드웨어/색상`)보다 길다.
    // 꼬리가 재고 색상으로 끝나면 같은 것으로 본다.
    return key(tail).endsWith(key(row.colour));
  }

  if (brand === 'lululemon') {
    // 상품코드가 없다. 이름이 충분히 겹치고 색상이 같아야 한다.
    if (key(tail) !== key(row.colour)) return false;
    return jaccard(tokenize(productName), tokenize(row.productName)) >= NAME_THRESHOLD;
  }

  if (brand === 'canadagoose') {
    /*
     * 스타일 코드가 **디스크(로고 배지 마감)마다 다르다** — MacMillan Parka는
     * 2080M(Classic)과 2080MB(Black)가 별도 PDP다. 카탈로그는 이걸 한 상품의
     * 색상으로 접어 두므로 SKU가 `2080M-CLASSIC-DISC-ATLANTIC-NAVY` 꼴이 된다.
     *
     * 그래서 색상은 **디스크를 떼고** 뒤쪽만 맞춘다. 사이트가 말하는 색상은
     * `Atlantic Navy`이지 `Classic Disc / Atlantic Navy`가 아니다.
     */
    if (key(row.productCode) !== key(head) && key(row.styleCode) !== key(head)) return false;
    return canadaGooseColourMatches(tail, row.colour);
  }

  // arcteryx · polo — 앞자리가 그대로 브랜드 상품코드다.
  if (key(row.productCode) !== key(head)) return false;
  return key(tail) === key(row.colour);
}

/**
 * 수집 결과를 카탈로그에 붙인다.
 *
 * 같은 (상품, 색상, 사이즈)가 여러 번 관측되면 **가장 최근 것**을 쓴다.
 * 오래된 값으로 최신 값을 덮으면 품절이 되살아난다.
 */
export type CatalogLike = readonly {
  slug: string;
  name: string;
  brandSlug: string;
  officialUrl?: string | null;
  variants: readonly { sku: string; color: string; officialUrl?: string | null }[];
}[];

/** 쿼리·해시를 뗀 주소. 색상 선택이 붙어도 같은 페이지로 본다. */
function urlKey(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`.toLowerCase().replace(/\/$/, '');
  } catch {
    return null;
  }
}

/**
 * 색상이 비어 온 행에 색상을 채운다.
 *
 * 색상이 하나뿐인 페이지에서는 추출기가 색상을 비운다 — 사이즈가 겹치지 않아
 * "색상 축이 있다"고 단정할 근거가 없기 때문이다(jsonld.ts `confirmColourAxis`).
 * 그러면 여기서 붙을 수가 없어 그 디스크 재고가 통째로 빠진다 —
 * 실측: Langford Tonal Disc, Freestyle Black Disc 가 그랬다.
 *
 * **상품코드가 카탈로그의 색상 딱 하나만 가리킬 때만** 채운다. 둘 이상이면
 * 무엇인지 모르는 것이므로 비워 둔 채 넘긴다 — 틀린 색에 붙이는 것보다 낫다.
 */
/**
 * 주소로 상품이 확정된 뒤, 색상만 맞춰 본다.
 *
 * 상품이 확정됐으므로 상품코드는 더 볼 것이 없다. 색상 규칙은 브랜드마다 다르니
 * 기존 것을 그대로 쓴다 — 여기서 새 규칙을 만들면 두 벌이 된다.
 */
function matchesByColour(brand: BrandKey, sku: string, row: StockRow): boolean {
  const [head, ...rest] = sku.split('-');
  const tail = rest.join('-');
  if (!head || !tail) return false;
  if (brand === 'canadagoose') return canadaGooseColourMatches(tail, row.colour);
  return key(tail) === key(row.colour) || key(tail).endsWith(key(firstLocale(row.colour)));
}

export function fillSoleColour(rows: StockRow[], catalog: CatalogLike): StockRow[] {
  const byCode = new Map<string, string[]>();
  for (const product of catalog) {
    if (toBrandKey(product.brandSlug) !== 'canadagoose') continue;
    for (const variant of product.variants) {
      const [head, ...rest] = variant.sku.split('-');
      if (!head || rest.length === 0) continue;
      const list = byCode.get(key(head)) ?? [];
      list.push(rest.join('-'));
      byCode.set(key(head), list);
    }
  }

  return rows.map((r) => {
    if (r.brand !== 'canadagoose' || firstLocale(r.colour)) return r;
    const tails = byCode.get(key(r.productCode));
    if (!tails || tails.length !== 1) return r;
    return { ...r, colour: tails[0]!.replace(/-/g, ' ') };
  });
}

/**
 * 색상 전체가 품절이라 사이트에서 사라진 경우를 되살린다.
 *
 * 같은 상품코드로 읽어 온 행이 있어야 한다 — 그래야 "페이지는 읽었는데 이 색만 없다"
 * 고 말할 수 있다. 사이즈 축과 확인 시각은 그 행들에서 가져온다.
 * 만들어 내는 값은 **전부 품절**이다. 없는 재고를 만들지 않는다.
 */
function soldOutColour(
  rows: StockRow[],
  sku: string,
): Omit<LinkedVariant, 'slug' | 'brand' | 'sku' | 'color'> | null {
  const head = key(sku.split('-')[0]);
  const same = rows.filter((r) => key(r.productCode) === head);
  if (same.length === 0) return null;

  const labels = [...new Set(same.map((r) => r.size.label))].sort(compareSizes);
  const newest = same.reduce((a, b) => (a.checkedAt >= b.checkedAt ? a : b));

  return {
    productUrl: newest.productUrl,
    sizes: labels.map((label) => ({
      label,
      availability: 'out_of_stock' as const,
      priceCents: newest.priceCents,
      onSale: false,
    })),
    checkedAt: newest.checkedAt,
    source: newest.source,
  };
}

export function linkStock(input: StockRow[], catalog: CatalogLike): LinkReport {
  const rows = fillSoleColour(input, catalog);
  const linked: LinkedVariant[] = [];
  const unlinked: LinkReport['unlinked'] = [];
  const used = new Set<StockRow>();

  for (const product of catalog) {
    /*
     * 카탈로그 slug 와 수집기 키가 갈린 브랜드가 있다 (`canada-goose` ↔ `canadagoose`).
     * 그냥 캐스팅하면 캐나다구스 재고가 하나도 안 붙는데, 오류 없이 조용히 그렇게 된다.
     */
    const brand = toBrandKey(product.brandSlug);
    if (!brand) continue;

    /*
     * 카탈로그가 아는 이 상품의 공식몰 주소들.
     *
     * 상품코드는 사람이 폴더명·details.txt 에 적은 값이라 틀릴 수 있다 — 실측:
     * Beta Jacket 이 카탈로그 X000010878, 사이트 X000010868 로 한 자리 어긋나
     * 수집은 멀쩡한데 3색이 통째로 미연결이었다. **주소는 우리가 실제로 연 페이지라
     * 코드보다 확실한 증거다.** 코드로 못 붙을 때만 쓴다.
     */
    const ownUrls = new Set(
      [product.officialUrl, ...product.variants.map((v) => v.officialUrl)]
        .map(urlKey)
        .filter((u): u is string => !!u),
    );

    for (const variant of product.variants) {
      const mine = rows.filter(
        (r) =>
          r.brand === brand &&
          (matches(brand, variant.sku, product.name, r) ||
            (ownUrls.has(urlKey(r.productUrl) ?? '') &&
              matchesByColour(brand, variant.sku, r))),
      );

      if (mine.length === 0) {
        /*
         * 품절을 안 싣는 사이트에서는, **그 색상 전체가 품절이면 색상이 통째로 사라진다.**
         * 페이지는 멀쩡히 읽었는데 그 색만 없는 것이므로 '모름'이 아니라 '품절'이다.
         * 실측: Wyndham Dusk Blue·Garson Taupe Grey 가 그랬다 — 미연결로 떨어져
         * 사람이 매번 "왜 안 붙지" 를 확인하게 됐다.
         *
         * 같은 상품코드의 다른 색상을 실제로 읽었을 때만 그렇게 판단한다.
         * 아무것도 못 읽었으면 그냥 모르는 것이다.
         */
        const soldOut = BRANDS[brand].ca.omitsSoldOut ? soldOutColour(rows, variant.sku) : null;
        if (soldOut) {
          linked.push({ ...soldOut, slug: product.slug, brand, sku: variant.sku, color: variant.color });
          continue;
        }
        unlinked.push({ slug: product.slug, brand, sku: variant.sku, color: variant.color });
        continue;
      }
      mine.forEach((r) => used.add(r));

      // 사이즈별로 최신 관측 하나만 남긴다.
      const latest = new Map<string, StockRow>();
      for (const r of mine) {
        const prev = latest.get(r.size.label);
        if (!prev || r.checkedAt > prev.checkedAt) latest.set(r.size.label, r);
      }

      const sizes = [...latest.values()]
        .sort((a, b) => compareSizes(a.size.label, b.size.label))
        .map((r) => ({
          label: r.size.label,
          availability: r.availability,
          priceCents: r.priceCents,
          onSale: r.onSale,
        }));

      // variant의 신선도는 **가장 오래된 사이즈** 기준이 아니라 가장 최근 확인 시각이다 —
      // 한 번의 수집으로 전 사이즈를 함께 읽으므로 회차 단위로 판단한다.
      const observed = [...latest.values()];
      const checkedAt = observed.reduce((max, r) => (r.checkedAt > max ? r.checkedAt : max), '');
      const newest = observed.reduce((a, b) => (a.checkedAt >= b.checkedAt ? a : b));
      const source = newest.source;

      linked.push({
        slug: product.slug,
        brand,
        sku: variant.sku,
        color: variant.color,
        productUrl: newest.productUrl,
        sizes,
        checkedAt,
        source,
      });
    }
  }

  return { linked, unlinked, orphanRows: rows.filter((r) => !used.has(r)).length };
}
