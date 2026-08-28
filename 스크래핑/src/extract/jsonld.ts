/**
 * JSON-LD 상품 추출기.
 *
 * 7개 브랜드는 서로 다른 커머스 플랫폼 위에 있지만(SFCC, 자체 Next.js, Cafe24 등),
 * SEO 때문에 대부분 schema.org Product / ProductGroup 을 심어 둔다.
 * 브랜드별 CSS 셀렉터를 7벌 유지하는 대신 이 한 경로를 1순위로 쓰고,
 * 실패한 브랜드만 어댑터에서 개별 처리한다. → 마크업 변경에 대한 내성이 가장 높다.
 *
 * (검증: arcteryx.com/ca/en PDP 는 ProductGroup + hasVariant 로
 *  sku / gtin14 / color / size / CAD 가격 / availability 를 전부 노출한다.)
 */
import type { Availability, Variant } from '../core/types.ts';
import { parseAvailability, parseCadCents, parseKrw } from './price.ts';

type Json = Record<string, unknown>;

const SCRIPT_RX = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** HTML 안의 모든 ld+json 블록을 파싱한다. 깨진 블록 하나가 전체를 막지 않는다. */
export function parseJsonLdBlocks(html: string): Json[] {
  const out: Json[] = [];
  for (const m of html.matchAll(SCRIPT_RX)) {
    const raw = m[1];
    if (!raw) continue;
    try {
      // 일부 사이트는 <!-- --> 로 감싸거나 후행 세미콜론을 붙인다.
      const cleaned = raw
        .replace(/^\s*<!--/, '')
        .replace(/-->\s*$/, '')
        .trim()
        .replace(/;\s*$/, '');
      const parsed: unknown = JSON.parse(cleaned);
      for (const node of flatten(parsed)) out.push(node);
    } catch {
      // 파싱 실패는 흔하다(광고 태그 등). 조용히 건너뛴다.
    }
  }
  return out;
}

/** @graph, 배열, 중첩을 평탄화한다. */
function flatten(value: unknown, depth = 0): Json[] {
  if (depth > 4 || value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((v) => flatten(v, depth + 1));

  const obj = value as Json;
  const out: Json[] = [obj];
  const graph = obj['@graph'];
  if (graph) out.push(...flatten(graph, depth + 1));
  return out;
}

const typeOf = (node: Json): string[] => {
  const t = node['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string');
  return [];
};

const isProductish = (node: Json) =>
  typeOf(node).some((t) => t === 'Product' || t === 'ProductGroup' || t === 'ProductModel');

const str = (v: unknown): string | null => {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  if (v && typeof v === 'object') {
    const o = v as Json;
    const inner = o.name ?? o['@id'] ?? o.value;
    if (typeof inner === 'string') return inner.trim() || null;
  }
  return null;
};

/** offers 는 Offer | AggregateOffer | Offer[] 중 무엇이든 올 수 있다. */
type OfferInfo = {
  currency: string | null;
  priceMinorCad: number | null;
  priceKrw: number | null;
  availability: Availability;
};

function readOffer(offers: unknown): OfferInfo {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  let currency: string | null = null;
  let availability: Availability = 'unknown';
  let rawPrice: unknown = null;

  for (const o of list) {
    if (!o || typeof o !== 'object') continue;
    const off = o as Json;

    // AggregateOffer 는 lowPrice 를 쓴다. 안쪽 offers 도 살펴본다.
    const nested = off.offers;
    if (nested && !off.price && !off.lowPrice) {
      const inner = readOffer(nested);
      if (inner.currency) return inner;
    }

    currency ??= str(off.priceCurrency);
    const p = off.price ?? off.lowPrice ?? (off.priceSpecification as Json | undefined)?.price;
    if (p !== undefined && p !== null && rawPrice === null) rawPrice = p;

    const av = parseAvailability(str(off.availability));
    // 여러 offer 중 하나라도 재고가 있으면 그 상품은 구매 가능하다.
    if (av === 'in_stock' || availability === 'unknown') availability = av;
  }

  const priceStr = typeof rawPrice === 'number' ? rawPrice : str(rawPrice);
  return {
    currency,
    priceMinorCad: currency === 'CAD' ? parseCadCents(priceStr) : null,
    priceKrw: currency === 'KRW' ? parseKrw(priceStr) : null,
    availability,
  };
}

export type JsonLdProduct = {
  name: string;
  productCode: string | null;
  category: string | null;
  currency: string | null;
  /** 요청한 지역 통화 기준 minor unit (CAD=cent, KRW=원) */
  priceMinor: number | null;
  listPriceMinor: number | null;
  availability: Availability;
  releaseDate: string | null;
  originCountryHint: string | null;
  imageUrl: string | null;
  variants: Variant[];
};

const firstImage = (v: unknown): string | null => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return firstImage(v[0]);
  if (v && typeof v === 'object') return str((v as Json).url ?? (v as Json).contentUrl);
  return null;
};

/**
 * 원산지 힌트. 실물 라벨이 아니므로 CKFTA 판정에 그대로 쓰면 안 된다 (CLAUDE.md 규칙 5).
 * 리포트에는 "확인 필요" 표시와 함께 참고값으로만 싣는다.
 */
function originHint(node: Json): string | null {
  const direct = str(node.countryOfOrigin) ?? str(node.countryOfAssembly);
  if (direct) return direct;

  const desc = `${str(node.description) ?? ''} ${str(node.material) ?? ''}`;
  const m = desc.match(/\b(?:made|assembled|manufactured)\s+in\s+([A-Z][a-zA-Z ]{2,24})/i);
  return m?.[1]?.trim() ?? null;
}

function readVariants(node: Json, expected: 'CAD' | 'KRW'): Variant[] {
  const raw = node.hasVariant;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const out: Variant[] = [];

  for (const v of list) {
    if (!v || typeof v !== 'object') continue;
    const vn = v as Json;
    const offer = readOffer(vn.offers);
    if (offer.currency && offer.currency !== expected) continue; // 통화 불일치분은 버린다

    out.push({
      sku: str(vn.sku) ?? str(vn.mpn),
      gtin: str(vn.gtin14) ?? str(vn.gtin13) ?? str(vn.gtin) ?? null,
      color: str(vn.color),
      size: str(vn.size),
      priceMinor: expected === 'CAD' ? offer.priceMinorCad : offer.priceKrw,
      listPriceMinor: null,
      availability: offer.availability,
      imageUrl: firstImage(vn.image),
    });
  }
  return out;
}

/**
 * HTML 에서 상품 1건을 뽑는다. 없으면 null.
 * @param expected 이 페이지에서 나와야 하는 통화. 다르면 수집분을 무효 처리한다.
 */
export function extractProduct(html: string, expected: 'CAD' | 'KRW'): JsonLdProduct | null {
  const nodes = parseJsonLdBlocks(html).filter(isProductish);
  if (nodes.length === 0) return null;

  // ProductGroup 이 variant 정보를 갖고 있으므로 우선한다.
  const node =
    nodes.find((n) => typeOf(n).includes('ProductGroup') && n.hasVariant) ??
    nodes.find((n) => typeOf(n).includes('ProductGroup')) ??
    nodes[0];
  if (!node) return null;

  const variants = readVariants(node, expected);
  const groupOffer = readOffer(node.offers);

  // 대표가 = 실제로 살 수 있는 최저 variant 가. variant 가 없으면 그룹 offer 를 쓴다.
  const variantPrices = variants
    .map((v) => v.priceMinor)
    .filter((p): p is number => typeof p === 'number' && p > 0);

  const groupPrice = expected === 'CAD' ? groupOffer.priceMinorCad : groupOffer.priceKrw;

  const priceMinor = variantPrices.length > 0 ? Math.min(...variantPrices) : groupPrice;

  /*
   * 정가 판별 — 그룹 offer 만 근거로 삼는다.
   *
   * Coach 는 ProductGroup.offers 에 정가(CA$360)를 두고 개별 variant 에 세일가(CA$180)를 싣는다.
   * 최저가만 보면 "48% 싸다"가 특정 컬러웨이 세일이라는 걸 놓치므로 정가를 함께 남긴다.
   *
   * 반대로 variant 최고가를 정가로 삼으면 안 된다. Coach 의 일부 페이지는
   * 스타일코드가 서로 다른 관련 상품 11종을 한 ProductGroup 으로 묶어 두고
   * (그룹 offer 자체가 없다) 가격이 330~580 으로 제각각인데,
   * 이걸 최고가 기준으로 보면 없는 세일을 지어내게 된다.
   */
  const listPriceMinor =
    groupPrice !== null && priceMinor !== null && groupPrice > priceMinor ? groupPrice : null;

  const currency = groupOffer.currency ?? (variants.length > 0 ? expected : null);

  const availability: Availability = variants.some((v) => v.availability === 'in_stock')
    ? 'in_stock'
    : variants.length > 0 && variants.every((v) => v.availability === 'out_of_stock')
      ? 'out_of_stock'
      : groupOffer.availability;

  const name = str(node.name);
  if (!name) return null;

  return {
    name,
    productCode: str(node.productGroupID) ?? str(node.sku) ?? str(node.mpn) ?? str(node.productID),
    category: str(node.category),
    currency,
    priceMinor,
    listPriceMinor,
    availability,
    releaseDate: str(node.releaseDate),
    originCountryHint: originHint(node),
    imageUrl: firstImage(node.image),
    variants,
  };
}

/**
 * JSON-LD 가 없는 페이지용 최후 수단 — OpenGraph product 메타.
 * 정확도가 낮으므로 어댑터가 명시적으로 요청할 때만 쓴다.
 */
export function extractOpenGraph(
  html: string,
  expected: 'CAD' | 'KRW',
): { name: string; priceMinor: number | null; currency: string | null } | null {
  const meta = (prop: string): string | null => {
    const rx = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      'i',
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      'i',
    );
    return html.match(rx)?.[1] ?? html.match(alt)?.[1] ?? null;
  };

  const name = meta('og:title');
  if (!name) return null;
  const currency = meta('product:price:currency') ?? meta('og:price:currency');
  const amount = meta('product:price:amount') ?? meta('og:price:amount');

  return {
    name: name.trim(),
    currency,
    priceMinor:
      currency === expected
        ? expected === 'CAD'
          ? parseCadCents(amount)
          : parseKrw(amount)
        : null,
  };
}
