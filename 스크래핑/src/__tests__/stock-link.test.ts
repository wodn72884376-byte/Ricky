import { describe, expect, it } from 'vitest';
import { CATALOG } from '@app/lib/catalog.generated.ts';
import { linkStock } from '../stock/link.ts';
import type { StockRow } from '../stock/types.ts';

/**
 * 재고 → 카탈로그 연결.
 *
 * 브랜드마다 조인 키가 다르다는 것이 이 모듈의 전부다. 하나의 규칙으로 뭉개면
 * 코치가 통째로 빠지므로(실측 30개 중 28개), 브랜드별로 한 케이스씩 고정해 둔다.
 */

const row = (over: Partial<StockRow> = {}): StockRow => ({
  brand: 'arcteryx',
  productCode: 'X000010932',
  productName: 'Alpha Jacket',
  productUrl: 'https://arcteryx.com/ca/en/shop/mens/alpha-jacket',
  sku: null,
  gtin: null,
  styleCode: null,
  colour: 'Graphite Black',
  colourCode: null,
  size: { declared: 'M', code: 'M', width: null, label: 'M' },
  availability: 'in_stock',
  priceCents: 95000,
  listPriceCents: null,
  onSale: false,
  checkedAt: '2026-08-28T20:00:00.000Z',
  source: 'browser',
  ...over,
});

/** 카탈로그에 실제로 있는 SKU라야 연결을 검증할 수 있다. */
const skuExists = (sku: string) => CATALOG.some((p) => p.variants.some((v) => v.sku === sku));

describe('linkStock — 브랜드별 조인 키', () => {
  it('아크테릭스는 productCode가 카탈로그 SKU 앞자리와 같다', () => {
    expect(skuExists('X000010932-GRAPHITE-BLACK')).toBe(true);
    const { linked } = linkStock([row()], CATALOG);
    const hit = linked.find((l) => l.sku === 'X000010932-GRAPHITE-BLACK');
    expect(hit?.sizes).toEqual([
      { label: 'M', availability: 'in_stock', priceCents: 95000, onSale: false },
    ]);
  });

  it('코치는 productCode가 아니라 styleCode로 붙는다', () => {
    // 페이지 그룹 코드(CDZ42)는 카탈로그 SKU 앞자리(CU068)와 다르다.
    expect(skuExists('CU068-NATURAL-GRAIN-LEATHER-BRASS-BLACK')).toBe(true);
    const coach = row({
      brand: 'coach',
      productCode: 'CDZ42',
      styleCode: 'CU068',
      colour: 'Brass/Black',
      size: { declared: null, code: null, width: null, label: '-' },
    });
    const { linked } = linkStock([coach], CATALOG);
    expect(linked.map((l) => l.sku)).toContain('CU068-NATURAL-GRAIN-LEATHER-BRASS-BLACK');
  });

  it('코치는 카탈로그 색상이 더 길어도(소재 토큰) 꼬리가 맞으면 붙는다', () => {
    const coach = row({
      brand: 'coach',
      productCode: 'CDZ42',
      styleCode: 'CU068',
      colour: 'Brass/Maple',
      size: { declared: null, code: null, width: null, label: '-' },
    });
    const { linked } = linkStock([coach], CATALOG);
    // `natural grain leather,Brass,Maple` → 꼬리 BRASSMAPLE
    expect(linked.map((l) => l.sku)).toContain('CU068-NATURAL-GRAIN-LEATHER-BRASS-MAPLE');
  });

  it('색상이 다르면 같은 styleCode라도 붙지 않는다', () => {
    const coach = row({
      brand: 'coach',
      productCode: 'CDZ42',
      styleCode: 'CU068',
      colour: 'Brass/Nonexistent',
      size: { declared: null, code: null, width: null, label: '-' },
    });
    const { linked } = linkStock([coach], CATALOG);
    expect(linked.filter((l) => l.sku.startsWith('CU068'))).toHaveLength(0);
  });

  it('붙지 않은 카탈로그 variant는 unlinked로 남는다 — 품절로 단정하지 않는다', () => {
    const { linked, unlinked } = linkStock([row()], CATALOG);
    expect(linked).toHaveLength(1);
    // 카탈로그 전체에서 나머지는 전부 "모르는 것"이다
    expect(unlinked.length).toBeGreaterThan(100);
    expect(unlinked.every((u) => 'sku' in u)).toBe(true);
  });

  it('같은 조합이 여러 번 관측되면 최신 것을 쓴다', () => {
    const old = row({ availability: 'out_of_stock', checkedAt: '2026-08-27T00:00:00.000Z' });
    const fresh = row({ availability: 'in_stock', checkedAt: '2026-08-28T00:00:00.000Z' });
    // 순서를 뒤집어 넣어도 최신이 이겨야 한다
    const { linked } = linkStock([fresh, old], CATALOG);
    expect(linked[0]!.sizes[0]!.availability).toBe('in_stock');
    expect(linked[0]!.checkedAt).toBe('2026-08-28T00:00:00.000Z');
  });

  it('카탈로그에 없는 색상은 orphan으로 세고 버린다', () => {
    const { orphanRows } = linkStock([row({ colour: 'Colour That Does Not Exist' })], CATALOG);
    expect(orphanRows).toBe(1);
  });

  it('사이즈는 정렬해서 담는다 — 표에서 순서가 흔들리면 안 된다', () => {
    const sizes = ['L', 'XS', 'M', 'S'].map((s) =>
      row({ size: { declared: s, code: s, width: null, label: s } }),
    );
    const { linked } = linkStock(sizes, CATALOG);
    expect(linked[0]!.sizes.map((s) => s.label)).toEqual(['XS', 'S', 'M', 'L']);
  });
});
