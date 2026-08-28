import { describe, expect, it } from 'vitest';
import { diffStock, sortEvents, variantKey } from '../stock/diff.ts';
import type { StockRow } from '../stock/types.ts';

const row = (over: Partial<StockRow> = {}): StockRow => ({
  brand: 'coach',
  productCode: 'CAF56',
  productName: 'Denim Hooded Zip Jacket',
  productUrl: 'https://ca.coach.com/en/products/denim-hooded-zip-jacket/CAF56.html',
  sku: 'CAF56 KHA  M',
  gtin: null,
  styleCode: 'CAF56',
  colour: 'Khaki',
  colourCode: 'KHA',
  size: { declared: 'M', code: 'M', width: null, label: 'M' },
  availability: 'in_stock',
  priceCents: 16750,
  listPriceCents: null,
  onSale: false,
  checkedAt: '2026-08-26T00:00:00.000Z',
  source: 'http',
  ...over,
});

const NOW = '2026-08-27T00:00:00.000Z';

describe('variantKey', () => {
  it('SKU 가 있으면 SKU 가 키다', () => {
    expect(variantKey(row())).toBe('sku:CAF56 KHA M');
  });

  it('SKU 의 들쭉날쭉한 공백을 정규화한다', () => {
    // 실측 SKU 는 정렬용 공백이 1~3개로 섞여 있다. 그대로 두면 같은 variant 가 다른 키가 된다.
    expect(variantKey(row({ sku: 'CAF56 KHA  M' }))).toBe(
      variantKey(row({ sku: 'CAF56  KHA   M' })),
    );
  });

  it('SKU 가 없으면 상품코드+색상+사이즈로 식별한다', () => {
    const k = variantKey(row({ sku: null }));
    expect(k).toBe('cs:CAF56|Khaki|M');
  });

  it('색상이나 사이즈가 다르면 다른 키다', () => {
    const a = variantKey(row({ sku: null, colour: 'Khaki' }));
    const b = variantKey(row({ sku: null, colour: 'Black' }));
    const c = variantKey(row({ sku: null, size: { declared: 'L', code: 'L', width: null, label: 'L' } }));
    expect(new Set([a, b, c]).size).toBe(3);
  });
});

describe('diffStock', () => {
  it('재고 → 품절을 잡는다', () => {
    const e = diffStock([row()], [row({ availability: 'out_of_stock' })], NOW);
    expect(e).toHaveLength(1);
    expect(e[0]?.type).toBe('oos');
    expect(e[0]?.size).toBe('M');
    expect(e[0]?.colour).toBe('Khaki');
  });

  it('품절 → 재고를 잡는다', () => {
    const e = diffStock([row({ availability: 'out_of_stock' })], [row()], NOW);
    expect(e[0]?.type).toBe('restock');
  });

  it('가격 인상을 방향과 폭까지 남긴다', () => {
    const e = diffStock([row()], [row({ priceCents: 19900 })], NOW);
    expect(e[0]?.type).toBe('price_up');
    expect(e[0]?.deltaCents).toBe(3150);
  });

  it('가격 인하도 잡는다', () => {
    const e = diffStock([row()], [row({ priceCents: 12000 })], NOW);
    expect(e[0]?.type).toBe('price_down');
    expect(e[0]?.deltaCents).toBe(-4750);
  });

  it('변화가 없으면 이벤트도 없다', () => {
    expect(diffStock([row()], [row()], NOW)).toEqual([]);
  });

  it('새 variant 는 added', () => {
    const added = row({ sku: 'CAF56 KHA  XL', size: { declared: 'XL', code: 'XL', width: null, label: 'XL' } });
    const e = diffStock([row()], [row(), added], NOW);
    expect(e).toHaveLength(1);
    expect(e[0]?.type).toBe('added');
    expect(e[0]?.size).toBe('XL');
  });

  it('조회한 상품에서 빠진 variant 는 removed', () => {
    // 같은 상품을 다시 조회했는데 S 가 없어졌다 → 편성 제외/단종 의심
    const s = row({ sku: 'CAF56 KHA  S', size: { declared: 'S', code: 'S', width: null, label: 'S' } });
    const e = diffStock([row(), s], [row()], NOW);
    expect(e).toHaveLength(1);
    expect(e[0]?.type).toBe('removed');
    expect(e[0]?.size).toBe('S');
  });

  it('아무것도 조회하지 않은 실행은 이벤트를 내지 않는다', () => {
    // current 가 비었다는 건 "전부 사라졌다"가 아니라 "아무것도 안 봤다"는 뜻이다.
    // 수집이 통째로 실패한 날 단종 이벤트가 쏟아지면 안 된다.
    expect(diffStock([row()], [], NOW)).toEqual([]);
  });

  it('재고 상태와 가격이 함께 바뀌면 이벤트 두 개가 난다', () => {
    const e = diffStock([row()], [row({ availability: 'out_of_stock', priceCents: 19900 })], NOW);
    expect(e.map((x) => x.type).sort()).toEqual(['oos', 'price_up']);
  });

  it('색상별로 독립적으로 판정한다', () => {
    const khaki = row();
    const black = row({ sku: 'CAF56 BLK  M', colour: 'Black', colourCode: 'BLK' });
    const e = diffStock([khaki, black], [khaki, black_({ availability: 'out_of_stock' })], NOW);
    expect(e).toHaveLength(1);
    expect(e[0]?.colour).toBe('Black');

    function black_(over: Partial<StockRow>) {
      return { ...black, ...over };
    }
  });

  it('신발은 치수까지 구분해 판정한다', () => {
    const s95 = row({
      brand: 'coach',
      sku: 'CCN27 CBD  9.5 D',
      size: { declared: 'extra wide', code: '9.5', width: 'D', label: '9.5 D' },
    });
    const s10 = row({
      brand: 'coach',
      sku: 'CCN27 CBD  10  D',
      size: { declared: 'extra wide', code: '10', width: 'D', label: '10 D' },
    });
    // 9.5 만 품절
    const e = diffStock([s95, s10], [{ ...s95, availability: 'out_of_stock' }, s10], NOW);
    expect(e).toHaveLength(1);
    expect(e[0]?.size).toBe('9.5 D');
  });
});

describe('sortEvents', () => {
  it('판매 가능 여부를 바꾸는 이벤트를 위로 올린다', () => {
    const events = diffStock(
      [row(), row({ sku: 'A B  S', size: { declared: 'S', code: 'S', width: null, label: 'S' } })],
      [
        row({ priceCents: 12000 }), // price_down
        { ...row({ sku: 'A B  S', size: { declared: 'S', code: 'S', width: null, label: 'S' } }), availability: 'out_of_stock' },
      ],
      NOW,
    );
    expect(sortEvents(events)[0]?.type).toBe('oos');
  });
});

describe('diffStock — 조회 범위', () => {
  const other = (): StockRow => ({
    ...row(),
    productUrl: 'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868',
    productName: "Beta Jacket Men's",
    brand: 'arcteryx',
    sku: 'X000010868008',
    styleCode: null,
  });

  it('이번에 조회하지 않은 상품은 사라진 것으로 보지 않는다', () => {
    /*
     * 실측 사고: 북마클릿으로 폴로 70개를 수집했는데 직전 스냅샷이
     * 아크테릭스·코치 99개라, 안 본 상품이 전부 '사라짐'으로 잡혀
     * 가짜 이벤트 169건이 났다. 안 본 상품은 사라진 게 아니다.
     */
    const events = diffStock([other()], [row()], NOW);
    expect(events.filter((e) => e.type === 'removed')).toHaveLength(0);
  });

  it('조회한 상품 안에서 사라진 variant 는 여전히 잡는다', () => {
    const s = row({ sku: 'CAF56 KHA  S', size: { declared: 'S', code: 'S', width: null, label: 'S' } });
    const events = diffStock([row(), s, other()], [row()], NOW);
    const removed = events.filter((e) => e.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0]?.size).toBe('S');
  });

  it('다른 상품이 섞여 있어도 진짜 변화는 정확히 잡는다', () => {
    const events = diffStock(
      [row(), other()],
      [row({ availability: 'out_of_stock' })],
      NOW,
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('oos');
  });
});
