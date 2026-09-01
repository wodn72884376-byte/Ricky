import { describe, expect, it } from 'vitest';
import { toSupabaseCsv, toSupabasePayload } from '../stock/supabase.ts';
import type { StockRow } from '../stock/types.ts';

const row = (over: Partial<StockRow> = {}): StockRow => ({
  brand: 'polo',
  productCode: '638616',
  productName: 'Cable-Knit Cotton Crewneck Sweater',
  productUrl: 'https://www.ralphlauren.ca/x/638616.html',
  sku: null,
  gtin: null,
  styleCode: null,
  colour: 'Collection Camel Melange',
  colourCode: null,
  size: { declared: 'M', code: 'M', width: null, label: 'M' },
  availability: 'in_stock',
  priceCents: 21800,
  listPriceCents: null,
  onSale: false,
  checkedAt: '2026-08-29T00:00:00.000Z',
  source: 'manual',
  ...over,
});

/** 실제 카탈로그에 매달리지 않게 최소 카탈로그를 주입한다. */
const catalogOf = (colours: Array<[string, number]>) => [
  {
    slug: 'polo-cable-knit-cotton-crewneck-sweater-women',
    name: 'Cable-Knit Cotton Crewneck Sweater',
    brandSlug: 'polo',
    variants: colours.map(([color, cadCents]) => ({
      color,
      cadCents,
      sku: `638616-${color.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
    })),
  },
];

const DEFAULT_CATALOG = catalogOf([['Collection Camel Melange', 21800]]);

const build = (rows: StockRow[], catalog = DEFAULT_CATALOG) =>
  toSupabasePayload(rows, {
    snapshot: 'T',
    generatedAt: '2026-08-29T00:00:00.000Z',
    catalog,
  });

describe('toSupabasePayload — Supabase 적재용 산출물', () => {
  it('원가가 들어 있으므로 관리자 전용이라고 못 박는다', () => {
    /*
     * CLAUDE.md 규칙 1 — 원가(CAD)·마진율·환율은 관리자 전용이며 고객용 API 응답에
     * 절대 포함하지 않는다. 받는 쪽이 이걸 그대로 고객 응답에 실으면 규칙 위반이라는
     * 걸 알 수 있어야 한다.
     */
    expect(build([row()]).meta.audience).toBe('admin');
  });

  it('신선도를 판정하지 않고 확인 시각만 싣는다', () => {
    /*
     * ageHours 나 stale 을 계산해 넣으면 파일이 만들어진 순간의 값이 굳고,
     * 받는 쪽이 그 굳은 값을 믿는다. 게이트는 요청 시점에 계산해야 한다 (PROJECT.md §6).
     */
    const p = build([row()]);
    const json = JSON.stringify(p.variants);
    expect(json).toContain('checkedAt');
    expect(json).not.toContain('ageHours');
    expect(json).not.toContain('stale');
  });

  it('사이즈가 달라도 색상 단위로 가격을 낸다', () => {
    // 실측 380행에서 같은 색상 안 사이즈별 가격 차이는 0건이었다 — 색상이 가격의 단위다
    const p = build([
      row({ size: { declared: 'S', code: 'S', width: null, label: 'S' } }),
      row({ size: { declared: 'M', code: 'M', width: null, label: 'M' } }),
    ]);
    const v = p.variants.find((x) => x.color === 'Collection Camel Melange');
    expect(v?.observedCadCents).toBe(21800);
    expect(v?.sizes.map((s) => s.label).sort()).toEqual(['M', 'S']);
  });

  it('사이즈별로 가격이 갈리면 최저가가 아니라 가장 흔한 값을 쓴다', () => {
    // 최저가를 쓰면 못 사는 사이즈의 가격으로 판매가를 매기게 된다
    const p = build([
      row({ size: { declared: 'S', code: 'S', width: null, label: 'S' }, priceCents: 14999 }),
      row({ size: { declared: 'M', code: 'M', width: null, label: 'M' }, priceCents: 21800 }),
      row({ size: { declared: 'L', code: 'L', width: null, label: 'L' }, priceCents: 21800 }),
    ]);
    expect(p.variants[0]?.observedCadCents).toBe(21800);
  });

  it('카탈로그 원가와 달라지면 표시한다 — 판매가를 다시 계산해야 한다', () => {
    const same = build([row()]).variants[0];
    expect(same?.catalogCadCents).toBe(21800);
    expect(same?.priceChanged).toBe(false);

    const moved = build([row({ priceCents: 18850 })]).variants[0];
    expect(moved?.observedCadCents).toBe(18850);
    expect(moved?.priceChanged).toBe(true);
  });

  it('공급처 URL 을 실어 사람이 되짚을 수 있게 한다', () => {
    expect(build([row()]).variants[0]?.supplierUrl).toBe('https://www.ralphlauren.ca/x/638616.html');
  });
});

describe('priceAlerts — 세일이라고 말하지 않은 마크다운', () => {
  /*
   * 실측(랄프로렌 638616): RL 2000 Red 만 CA$149.99, 나머지는 CA$218.00 인데
   * JSON-LD 에 세일 표기가 없다. 149.99 를 원가로 넣으면 마크다운이 끝났을 때
   * 원화 판매가가 조용히 어긋난다.
   */
  const colours = (spec: Array<[string, number]>) =>
    spec.map(([colour, priceCents]) => row({ colour, priceCents }));

  const THREE = catalogOf([
    ['Collection Camel Melange', 21800],
    ['Cream', 21800],
    ['RL 2000 Red', 21800],
  ]);

  it('한 색만 싼 경우를 알린다 — 세일이라고 단정하지는 않는다', () => {
    const p = build(
      colours([
        ['Collection Camel Melange', 21800],
        ['Cream', 21800],
        ['RL 2000 Red', 14999],
      ]),
      THREE,
    );
    // 세일을 지어내지 않는다
    expect(p.variants.every((v) => !v.onSale)).toBe(true);

    const alert = p.priceAlerts[0];
    expect(alert?.typicalCadCents).toBe(21800);
    expect(alert?.odd).toEqual([{ color: 'RL 2000 Red', cadCents: 14999 }]);
  });

  it('전 색상 가격이 같으면 알리지 않는다', () => {
    const p = build(
      colours([
        ['Collection Camel Melange', 21800],
        ['Cream', 21800],
      ]),
      THREE,
    );
    expect(p.priceAlerts).toEqual([]);
  });

  it('페이지가 다르면 값이 달라도 알리지 않는다 — 정가몰과 아울렛은 원래 다르다', () => {
    /*
     * 아크테릭스 Beta AR 은 정가몰(CA$840)과 아울렛(CA$588) 색상을 한 상품으로 판다.
     * 상품 단위로 비교하면 이 상품은 **매 회차 영원히** 경고를 낸다. 늘 켜져 있는
     * 경고는 곧 아무도 안 보는 경고가 되어, 진짜 마크다운이 그 안에 묻힌다.
     */
    const p = build(
      [
        row({ colour: 'Black', priceCents: 84000, productUrl: 'https://arcteryx.com/x/beta-ar-jacket-1062' }),
        row({ colour: 'Mantis Tatsu', priceCents: 58800, productUrl: 'https://outlet.arcteryx.com/x/beta-ar-jacket-9906' }),
      ],
      catalogOf([
        ['Black', 84000],
        ['Mantis Tatsu', 58800],
      ]),
    );
    expect(p.priceAlerts).toEqual([]);
  });

  it('같은 페이지 안에서 갈리면 알린다 — 그건 표기 없는 마크다운이다', () => {
    const url = 'https://outlet.arcteryx.com/x/beta-ar-jacket-9906';
    const p = build(
      [
        row({ colour: 'Mantis Tatsu', priceCents: 58800, productUrl: url }),
        row({ colour: 'Fluidity Vitality', priceCents: 58800, productUrl: url }),
        row({ colour: 'Olive Moss Euphoria', priceCents: 42000, productUrl: url }),
      ],
      catalogOf([
        ['Mantis Tatsu', 58800],
        ['Fluidity Vitality', 58800],
        ['Olive Moss Euphoria', 58800],
      ]),
    );
    expect(p.priceAlerts).toHaveLength(1);
    expect(p.priceAlerts[0]?.typicalCadCents).toBe(58800);
    expect(p.priceAlerts[0]?.odd).toEqual([{ color: 'Olive Moss Euphoria', cadCents: 42000 }]);
  });

  it('카탈로그에 등록되지 않은 색상은 알림에 넣지 않는다', () => {
    /*
     * 실측(638616): RL 2000 Red 가 CA$149.99 로 유별나지만 카탈로그에 없는 색이다.
     * 우리가 팔지 않는 색의 가격은 판매가에 영향이 없다 — 알려 봐야 소음이다.
     */
    const p = build(
      colours([
        ['Collection Camel Melange', 21800],
        ['RL 2000 Red', 14999],
      ]),
      DEFAULT_CATALOG,
    );
    expect(p.variants).toHaveLength(1);
    expect(p.priceAlerts).toEqual([]);
  });
});

describe('toSupabaseCsv', () => {
  it('사이즈 한 줄씩 펴서 낸다', () => {
    const csv = toSupabaseCsv(build([row()]));
    expect(csv).toContain('slug,브랜드,SKU,색상,사이즈,재고');
    expect(csv).toContain('Collection Camel Melange,M,in_stock,218.00');
  });

  it('엑셀이 한글을 깨지 않도록 BOM 을 붙인다', () => {
    expect(toSupabaseCsv(build([row()])).charCodeAt(0)).toBe(0xfeff);
  });
});
