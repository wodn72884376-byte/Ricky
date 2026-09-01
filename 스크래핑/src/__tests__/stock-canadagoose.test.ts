import { describe, expect, it } from 'vitest';

import { extractProductFromNodes } from '../extract/jsonld.ts';
import { fillOmittedSoldOut } from '../stock/import.ts';
import { fillSoleColour, linkStock } from '../stock/link.ts';
import type { StockRow } from '../stock/types.ts';

/** 캐나다구스 offer 하나. 사이즈는 additionalProperty 에, 색상은 이름 끝 괄호에 있다. */
const offer = (colour: string, size: string) => ({
  '@type': 'Offer',
  additionalProperty: { '@type': 'PropertyValue', name: 'size', value: size },
  availability: 'InStock',
  price: '650.00',
  priceCurrency: 'CAD',
  sku: `${colour}-${size}`,
  name: `Canada Goose Crofton EnduraLuxe Vest (Men, ${colour}, ${size})`,
});

describe('offers 배열을 variant 로 — hasVariant 를 안 쓰는 사이트', () => {
  /*
   * 실측: 캐나다구스는 hasVariant 없이 offers 에 사이즈 수만큼 offer 를 단다.
   * hasVariant 만 보면 14개 offer 가 한 줄로 접혀 사이즈 '-' 하나만 남고,
   * 그 상품 8건이 "재고 못 받음"으로 조용히 빠졌다.
   */
  const node = {
    '@type': 'Product',
    name: 'Crofton EnduraLuxe Vest',
    offers: [offer('Black', 'S'), offer('Black', 'M'), offer('Limestone', 'S'), offer('Limestone', 'M')],
  };

  it('offer 마다 variant 를 세운다', () => {
    const p = extractProductFromNodes([node], 'CAD');
    expect(p!.variants).toHaveLength(4);
    expect(p!.variants.map((v) => v.size)).toEqual(['S', 'M', 'S', 'M']);
  });

  it('색상을 이름 끝 괄호에서 캔다', () => {
    const p = extractProductFromNodes([node], 'CAD');
    expect([...new Set(p!.variants.map((v) => v.color))]).toEqual(['Black', 'Limestone']);
  });

  it('색상 축이 없으면 캔 값을 버린다 — "(Men, XXL)" 의 Men 은 색이 아니다', () => {
    const single = {
      '@type': 'Product',
      name: 'X',
      offers: [
        { ...offer('Men', 'S'), name: 'Canada Goose X (Men, S)' },
        { ...offer('Men', 'M'), name: 'Canada Goose X (Men, M)' },
      ],
    };
    const p = extractProductFromNodes([single], 'CAD');
    expect(p!.variants.every((v) => v.color === null)).toBe(true);
  });
});

const row = (colour: string | null, label: string, availability: StockRow['availability'] = 'in_stock'): StockRow => ({
  brand: 'canadagoose',
  productCode: '2052MT',
  productName: 'Langford Parka',
  productUrl: 'https://www.canadagoose.com/ca/en/pr/langford-parka-tonal-disc-2052MT.html',
  sku: null, gtin: null, styleCode: null,
  colour, colourCode: null,
  size: { declared: label, code: label, width: null, label },
  availability, priceCents: 169500, listPriceCents: null, onSale: false,
  checkedAt: '2026-08-31T00:00:00.000Z', source: 'manual',
});

describe('fillOmittedSoldOut — 품절을 안 싣는 사이트', () => {
  /*
   * 규칙 자체는 남긴다. 다만 **캐나다구스에는 켜지 않는다** —
   * 실측(2026-08-31): Garson Vest 의 Black S · Volcano S 가 공식몰 화면에는
   * 있는데 offer 목록에는 없었다. 빠진 것이 품절이라는 전제가 틀렸다.
   * 이 함수는 "빠진 것 = 품절"이 참인 사이트에서만 쓴다.
   */
  it('다른 색상에서 본 사이즈를 축으로 삼아 빠진 칸을 품절로 채운다', () => {
    const out = fillOmittedSoldOut([row('Black', 'S'), row('Black', 'M'), row('Terra', 'S')]);
    const terra = out.filter((r) => r.colour === 'Terra');
    expect(terra).toHaveLength(2);
    expect(terra.find((r) => r.size.label === 'M')!.availability).toBe('out_of_stock');
  });

  it('없는 것을 있다고 하지 않는다 — 채우는 값은 언제나 품절이다', () => {
    const input = [row('Black', 'S'), row('Terra', 'M')];
    const out = fillOmittedSoldOut(input);
    expect(out.length).toBeGreaterThan(input.length);
    // 채워 넣은 행만 본다. 재고 있음이 하나라도 늘면 없는 재고를 만든 것이다.
    const before = input.filter((r) => r.availability === 'in_stock').length;
    expect(out.filter((r) => r.availability === 'in_stock')).toHaveLength(before);
  });

  it('색상이 하나면 손대지 않는다 — 축을 세울 근거가 없다', () => {
    const one = [row('Black', 'S'), row('Black', 'M')];
    expect(fillOmittedSoldOut(one)).toHaveLength(2);
  });
});

const CATALOG = [
  {
    slug: 'canada-goose-langford-parka-men',
    brandSlug: 'canada-goose',
    name: 'Langford Parka',
    variants: [
      { sku: '2052M-CLASSIC-DISC-ATLANTIC-NAVY', color: 'Classic Disc / Atlantic Navy' },
      { sku: '2052MT-TONAL-DISC-VIREO-GREEN', color: 'Tonal Disc / Vireo Green' },
      { sku: '2052MB-BLACK-DISC-BLACK', color: 'Black Disc / Black' },
      { sku: '2052MB-BLACK-DISC-LIMESTONE', color: 'Black Disc / Limestone' },
    ],
  },
];

describe('색상 이름이 사이트마다 다르다', () => {
  it('축약을 흡수한다 — Atlantic Nvy = Atlantic Navy', () => {
    const r = { ...row('Atlantic Nvy', 'M'), productCode: '2052M' };
    const rep = linkStock([r], CATALOG as never);
    expect(rep.linked.map((l) => l.sku)).toContain('2052M-CLASSIC-DISC-ATLANTIC-NAVY');
  });

  it('두 언어가 한 칸에 오면 앞쪽만 본다 — "Granite Grey/ Gris granit"', () => {
    const cat = [{ ...CATALOG[0]!, variants: [{ sku: '2080M-CLASSIC-DISC-GRANITE-GREY', color: 'x' }] }];
    const r = { ...row('Granite Grey/ Gris granit', 'M'), productCode: '2080M' };
    expect(linkStock([r], cat as never).linked).toHaveLength(1);
  });

  it('다른 색까지 붙이지는 않는다', () => {
    const r = { ...row('Vireo Green', 'M'), productCode: '2052MT' };
    const rep = linkStock([r], CATALOG as never);
    expect(rep.linked.map((l) => l.sku)).toEqual(['2052MT-TONAL-DISC-VIREO-GREEN']);
  });
});

describe('fillSoleColour — 색상이 하나뿐인 페이지', () => {
  it('상품코드가 색상 하나만 가리키면 채운다', () => {
    const filled = fillSoleColour([row(null, 'M')], CATALOG as never);
    expect(filled[0]!.colour).toBe('TONAL DISC VIREO GREEN');
  });

  it('둘 이상이면 비워 둔다 — 틀린 색에 붙이는 것보다 낫다', () => {
    const filled = fillSoleColour([{ ...row(null, 'M'), productCode: '2052MB' }], CATALOG as never);
    expect(filled[0]!.colour).toBeNull();
  });
});

describe('색상이 offer 에 없을 때', () => {
  /*
   * 예전엔 "페이지를 읽었는데 이 색만 없으면 품절" 로 봤다. 그 전제가 틀렸다 —
   * 실측(2026-08-31): Garson Vest 의 Black S · Volcano S 가 화면에는 있는데
   * offer 목록에는 없었다. 사이트가 빠뜨린 것이지 품절이 아니다.
   * 그래서 지금은 **모르는 것으로 둔다** — 미연결이면 스토어가 팔지 않는다.
   */
  const catalog = [
    {
      slug: 'canada-goose-wyndham-parka-men',
      brandSlug: 'canada-goose',
      name: 'Wyndham Parka',
      variants: [
        { sku: '2048MB-BLACK-DISC-BLACK', color: 'Black Disc / Black' },
        { sku: '2048MB-BLACK-DISC-DUSK-BLUE', color: 'Black Disc / Dusk Blue' },
      ],
    },
  ];
  const seen = (label: string) => ({ ...row('Black', label), productCode: '2048MB' });

  it('없는 색상을 품절이라고 적지 않는다 — 파는 물건이 안 팔린다', () => {
    const rep = linkStock([seen('S'), seen('M')], catalog as never);
    expect(rep.linked.find((l) => l.sku === '2048MB-BLACK-DISC-DUSK-BLUE')).toBeUndefined();
    expect(rep.unlinked.map((u) => u.sku)).toContain('2048MB-BLACK-DISC-DUSK-BLUE');
  });

  it('본 색상은 그대로 붙는다', () => {
    const rep = linkStock([seen('S'), seen('M')], catalog as never);
    expect(rep.linked.map((l) => l.sku)).toContain('2048MB-BLACK-DISC-BLACK');
  });
});

describe('빠진 것을 품절이라고 하지 않는다', () => {
  /*
   * 실측 반례: 공식몰 화면에 XS·S 가 멀쩡히 있는데 JSON-LD offer 에는 S 가 없었다.
   * 그걸 품절로 적으면 파는 물건이 안 팔린다 — 모르는 것은 모르는 채로 둔다.
   */
  it('캐나다구스는 offer 누락을 품절로 채우지 않는다', async () => {
    const { BRANDS } = await import('../config/brands.ts');
    expect(BRANDS.canadagoose.ca.omitsSoldOut).toBeUndefined();
  });
});
