import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/lib/catalog.generated';
import { NO_SIZE, listingRows, productRow, variantRows, type LinkedStock } from './seed-rows';

/**
 * 카탈로그·재고 → DB 행 변환.
 *
 * 여기서 지켜야 하는 것은 둘이다 — variant를 (사이즈 × 색상)으로 펼치는 것과,
 * **모르는 재고를 행으로 만들지 않는 것**. 후자를 어기면 뷰가 신선하다고 착각해
 * 확인된 적 없는 상품에 결제를 연다 (PROJECT.md §6.5).
 */

const product = (over: Partial<(typeof CATALOG)[number]> = {}) =>
  ({
    slug: 'test-jacket',
    brand: "Arc'teryx",
    brandSlug: 'arcteryx',
    name: '테스트 자켓',
    gender: 'men',
    category: 'outerwear',
    originCountry: null,
    material: null,
    care: null,
    manufacturer: null,
    cadCents: 45000,
    costKrw: 500000,
    priceKrw: 640000,
    krRetailKrw: null,
    shippingKrw: null,
    smartstoreUrl: null,
    sizes: ['S', 'M'],
    variants: [
      { color: 'Black', colorKo: '블랙', sku: 'X1-BLACK', cardImage: '', detailImages: [], officialUrl: null, smartstoreUrl: null },
      { color: 'Sea Salt', colorKo: '씨솔트', sku: 'X1-SEA-SALT', cardImage: '', detailImages: [], officialUrl: null, smartstoreUrl: null },
    ],
    ...over,
  }) as (typeof CATALOG)[number];

const linked = (over: Partial<LinkedStock> = {}): LinkedStock => ({
  slug: 'test-jacket',
  brand: 'arcteryx',
  sku: 'X1-BLACK',
  color: 'Black',
  productUrl: 'https://arcteryx.com/ca/en/shop/mens/test',
  sizes: [{ label: 'M', availability: 'in_stock', priceCents: 45000, onSale: false }],
  checkedAt: '2026-08-29T12:00:00.000Z',
  source: 'browser',
  ...over,
});

describe('variantRows — (사이즈 × 색상)으로 펼친다', () => {
  it('색상 2 × 사이즈 2 = 4행', () => {
    const rows = variantRows(product());
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.sku)).toEqual([
      'X1-BLACK-S', 'X1-BLACK-M', 'X1-SEA-SALT-S', 'X1-SEA-SALT-M',
    ]);
  });

  it('사이즈가 없는 상품은 SKU를 늘리지 않는다', () => {
    const rows = variantRows(product({ sizes: [] }));
    expect(rows).toHaveLength(2);
    expect(rows[0]!.sku).toBe('X1-BLACK');
    expect(rows[0]!.size).toBe(NO_SIZE);
  });

  it('색상별 가격이 있으면 그것이 우선한다 — 코치는 소재가 다르면 가격이 다르다', () => {
    const p = product({
      variants: [
        { color: 'Black', colorKo: '블랙', sku: 'C1-BLACK', cardImage: '', detailImages: [], officialUrl: null, smartstoreUrl: null, cadCents: 99000, priceKrw: 1200000 },
      ],
      sizes: [],
    });
    expect(variantRows(p)[0]).toMatchObject({ cost_cad_cents: 99000, price_krw: 1200000 });
  });

  it('DB의 unique (product_id, size, color)를 깨지 않는다', () => {
    const rows = variantRows(product());
    const keys = rows.map((r) => `${r.size}|${r.color}`);
    expect(new Set(keys).size).toBe(rows.length);
  });
});

describe('variantRows — 색상별 구매 경로', () => {
  /*
   * 스마트스토어에 색상마다 상품을 따로 등록했을 때. 이 값이 옵션 행마다 실려야
   * PDP 가 고른 색 그대로 보낼 수 있다 — 상품 단위로만 두면 고객이 색을 다시 고른다.
   */
  it('색상별 주소를 그 색의 모든 사이즈 행에 싣는다', () => {
    const p = product({
      sizes: ['S', 'M'],
      variants: [
        { color: 'Black', colorKo: '블랙', sku: 'CG-BLACK', cardImage: '', detailImages: [], officialUrl: null, smartstoreUrl: 'https://smartstore.naver.com/ricky/products/1' },
        { color: 'Limestone', colorKo: '라임스톤', sku: 'CG-LIME', cardImage: '', detailImages: [], officialUrl: null, smartstoreUrl: null },
      ],
    });
    const rows = variantRows(p);
    // 색상 2 × 사이즈 2 = 4행. 앞 두 행이 블랙이다.
    expect(rows.map((r) => r.smartstore_url)).toEqual([
      'https://smartstore.naver.com/ricky/products/1',
      'https://smartstore.naver.com/ricky/products/1',
      null,
      null,
    ]);
  });
});

describe('variantRows — 색상별 공식몰 주소', () => {
  it('색상마다 다른 주소를 그 옵션에 싣는다 — 캐나다구스는 색상마다 PDP 가 따로다', () => {
    const p = product({
      sizes: ['M'],
      variants: [
        { color: 'Black', colorKo: '블랙', sku: 'CG-BLACK', cardImage: '', detailImages: [], officialUrl: 'https://www.canadagoose.com/ca/en/a', smartstoreUrl: null },
        { color: 'Limestone', colorKo: '라임스톤', sku: 'CG-LIME', cardImage: '', detailImages: [], officialUrl: 'https://www.canadagoose.com/ca/en/b', smartstoreUrl: null },
      ],
    });
    expect(variantRows(p).map((r) => r.official_url)).toEqual([
      'https://www.canadagoose.com/ca/en/a',
      'https://www.canadagoose.com/ca/en/b',
    ]);
  });

  it('없으면 null 이다 — 상품 주소로 떨어뜨리는 판단은 읽는 쪽이 한다', () => {
    expect(variantRows(product())[0]!.official_url).toBeNull();
  });
});

describe('variantRows — 무게', () => {
  it('공식몰 표기 무게를 그대로 싣는다', () => {
    const rows = variantRows(product({ weightG: 375 }));
    expect(rows.every((r) => r.weight_g === 375)).toBe(true);
  });

  it('모르면 null이다 — 카테고리 추정값을 사실로 저장하지 않는다', () => {
    const rows = variantRows(product({ weightG: null }));
    expect(rows.every((r) => r.weight_g === null)).toBe(true);
  });
});

describe('productRow', () => {
  it('카탈로그에서 온 상품은 항상 draft다 — 게시는 운영자가 판단한다', () => {
    expect(productRow(product()).status).toBe('draft');
  });

  it('고시 항목이 비어 있으면 비운 채로 넘긴다 — 지어내지 않는다', () => {
    const r = productRow(product());
    expect(r.origin_country).toBeNull();
    expect(r.material).toBeNull();
  });
});

describe('listingRows — 모르는 재고는 행을 만들지 않는다', () => {
  it('판정된 재고만 행이 된다', () => {
    const rows = listingRows([linked()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ availability: 'in_stock', size: 'M', color: 'Black' });
  });

  it('unknown은 버린다 — 행으로 남기면 뷰가 신선하다고 착각한다', () => {
    const rows = listingRows([linked({ sizes: [{ label: 'M', availability: 'unknown', priceCents: null, onSale: false }] })]);
    expect(rows).toHaveLength(0);
  });

  it('품절은 남긴다 — 품절은 확인된 사실이다', () => {
    const rows = listingRows([linked({ sizes: [{ label: 'M', availability: 'out_of_stock', priceCents: null, onSale: false }] })]);
    expect(rows[0]!.availability).toBe('out_of_stock');
  });

  it('공급처 URL을 모르면 행을 만들지 않는다', () => {
    // 어디서 본 재고인지 모르면 판매 근거가 되지 못한다.
    expect(listingRows([linked({ productUrl: '' })])).toHaveLength(0);
  });

  it('last_success_at은 수집 시각 그대로다 — 신선도 게이트가 이 값만 본다', () => {
    const rows = listingRows([linked()]);
    expect(rows[0]!.last_success_at).toBe('2026-08-29T12:00:00.000Z');
  });
});

describe('실제 카탈로그 48개', () => {
  it('전 상품이 행으로 변환되고 SKU가 전역 유일하다', () => {
    const all = CATALOG.flatMap((p) => variantRows(p));
    expect(all.length).toBeGreaterThan(CATALOG.length);
    expect(new Set(all.map((r) => r.sku)).size).toBe(all.length);
  });

  it('모든 variant에 판매가가 있다 — null이면 스토어가 가격을 못 그린다', () => {
    const missing = CATALOG.flatMap((p) => variantRows(p)).filter((r) => r.price_krw === null);
    expect(missing).toEqual([]);
  });
});
