import { describe, expect, it } from 'vitest';

/**
 * 상품 상세가 재고를 읽는 규칙.
 *
 * 이 판단이 틀리면 두 방향으로 잘못된다 —
 *   품절을 안 보여주면 못 파는 것을 팔고,
 *   모르는 것을 품절로 그리면 게시 전 상품이 전부 '재입고 대기'가 된다.
 */
type Cell = { color: string; size: string; purchasable: boolean };

function sellableSizes(stock: Cell[] | null, color: string): Set<string> | null {
  const mine = stock?.filter((c) => c.color === color) ?? [];
  if (stock === null || stock.length === 0) return null;
  return new Set(mine.filter((c) => c.purchasable).map((c) => c.size));
}

const cell = (size: string, purchasable: boolean): Cell => ({ color: 'Black', size, purchasable });

describe('재고를 모를 때와 품절일 때', () => {
  it('아직 안 받았으면 모르는 것이다', () => {
    expect(sellableSizes(null, 'Black')).toBeNull();
  });

  it('이 상품 기록이 하나도 없으면 모르는 것이다 — 게시 전이지 품절이 아니다', () => {
    expect(sellableSizes([], 'Black')).toBeNull();
  });

  /*
   * 수집이 돌았다는 뜻이므로, 거기 없는 칸은 품절로 본다.
   * 확인되지 않은 것을 팔 수 있다고 그리는 쪽이 더 나쁘다 (PROJECT.md §6).
   */
  it('다른 색상 기록이라도 있으면 수집은 돈 것이다 — 이 색상은 미표기 = 품절', () => {
    const s = sellableSizes([{ color: 'Sea Salt', size: 'M', purchasable: true }], 'Black');
    expect(s).not.toBeNull();
    expect(s!.size).toBe(0);
  });

  it('그래도 기록이 하나도 없으면 모르는 것이다 — 게시 전 상품을 품절로 그리지 않는다', () => {
    expect(sellableSizes([], 'Black')).toBeNull();
  });

  it('기록이 있으면 살 수 있는 사이즈만 남긴다', () => {
    const s = sellableSizes([cell('S', true), cell('M', false), cell('L', true)], 'Black');
    expect([...s!].sort()).toEqual(['L', 'S']);
  });

  it('기록이 있는데 전부 못 사면 품절이다 — 모르는 것이 아니다', () => {
    const s = sellableSizes([cell('S', false), cell('M', false)], 'Black');
    expect(s).not.toBeNull();
    expect(s!.size).toBe(0);
  });
});

describe('전 상품 공통 고시', () => {
  /*
   * 게시 게이트(products_disclosure_complete)가 as_contact 를 요구한다.
   * 비면 아무것도 게시할 수 없고, 게시가 안 되면 store_variants 가 비어
   * 재고 연동이 화면까지 오지 못한다.
   */
  it('A/S 안내가 구매대행이라는 사실을 밝힌다', async () => {
    const { AS_CONTACT } = await import('../disclosure');
    expect(AS_CONTACT).toContain('구매 대행');
    expect(AS_CONTACT).toContain('무상 A/S는 지원되지 않습니다');
  });

  it('여러 줄이다 — 화면에서 줄바꿈을 살려야 한다', async () => {
    const { AS_CONTACT } = await import('../disclosure');
    expect(AS_CONTACT.split('\n')).toHaveLength(4);
  });

  it('시드가 as_contact 를 채운다 — 비면 게시가 막힌다', async () => {
    const { productRow } = await import('../db/seed-rows');
    const { AS_CONTACT } = await import('../disclosure');
    const { CATALOG } = await import('../catalog.generated');
    for (const p of CATALOG) expect(productRow(p).as_contact).toBe(AS_CONTACT);
  });

  it('고시 표가 두 항목을 모두 렌더한다', async () => {
    const { readFile } = await import('node:fs/promises');
    const src = await readFile('src/components/store/product-disclosure-table.tsx', 'utf8');
    expect(src).toContain('PURCHASE_ROUTE');
    expect(src).toContain('AS_CONTACT');
    // 줄바꿈을 살리지 않으면 네 문장이 한 덩어리가 된다
    expect(src).toContain('whitespace-pre-line');
  });
});
