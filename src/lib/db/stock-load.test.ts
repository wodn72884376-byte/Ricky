import { describe, expect, it } from 'vitest';
import { mergePayloads, toLoadInput, type StockPayload } from './stock-load';
import { listingRows } from './seed-rows';

const variant = (over: Partial<StockPayload['variants'][number]> = {}) => ({
  slug: 'polo-cable-knit-cotton-cardigan-men',
  brand: 'polo',
  sku: '100066198-CAMEL-MELANGE',
  color: 'Camel Melange',
  supplierUrl: 'https://www.ralphlauren.ca/x/100066198.html',
  observedCadCents: 22800,
  onSale: false,
  sizes: [{ label: 'M', availability: 'in_stock', cadCents: 22800 }],
  checkedAt: '2026-08-29T10:00:00.000Z',
  source: 'manual',
  ...over,
});

const payload = (variants: StockPayload['variants']): StockPayload => ({
  meta: { audience: 'admin', snapshot: 'T', generatedAt: '2026-08-29T10:00:00.000Z' },
  variants,
});

describe('mergePayloads — 회차 합치기', () => {
  it('회차마다 담긴 브랜드가 달라 전부 합쳐야 한다', () => {
    const merged = mergePayloads([
      payload([variant({ slug: 'a', sku: 'A-1' })]),
      payload([variant({ slug: 'b', sku: 'B-1' })]),
    ]);
    expect(merged.map((v) => v.slug).sort()).toEqual(['a', 'b']);
  });

  it('같은 variant 는 가장 최근 관측을 쓴다', () => {
    /* 오래된 값이 최신 값을 덮으면 품절이 되살아난다. */
    const merged = mergePayloads([
      payload([
        variant({
          checkedAt: '2026-08-29T12:00:00.000Z',
          sizes: [{ label: 'M', availability: 'out_of_stock', cadCents: 22800 }],
        }),
      ]),
      payload([
        variant({
          checkedAt: '2026-08-29T08:00:00.000Z',
          sizes: [{ label: 'M', availability: 'in_stock', cadCents: 22800 }],
        }),
      ]),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.sizes[0]!.availability).toBe('out_of_stock');
    expect(merged[0]!.checkedAt).toBe('2026-08-29T12:00:00.000Z');
  });
});

describe('toLoadInput — 적재 입력', () => {
  it('variant 마다 자기 공급처 URL 을 쓴다', () => {
    /*
     * 실측 버그: 브랜드 첫 행의 URL 을 그 브랜드 전체에 붙였다.
     * supplier_listings 의 유니크 키가 (variant_id, product_url) 이라 행이 뭉개지고,
     * 무엇보다 "어디서 본 재고인지"가 통째로 틀린다.
     *
     * 같은 상품(slug) 안에서도 갈린다 — 캐나다구스는 디스크마다 PDP 가 따로다.
     */
    const { linked } = toLoadInput([
      variant({ sku: '2080M-CLASSIC-DISC-BLACK', supplierUrl: 'https://x/2080M.html' }),
      variant({ sku: '2080MB-BLACK-DISC-BLACK', supplierUrl: 'https://x/2080MB.html' }),
    ]);
    expect(linked.map((l) => l.productUrl)).toEqual([
      'https://x/2080M.html',
      'https://x/2080MB.html',
    ]);
  });

  it('공급처 URL 이 없으면 버린다 — 어디서 본 재고인지 모르면 판매를 열 수 없다', () => {
    const { linked } = toLoadInput([variant({ supplierUrl: null })]);
    expect(linked).toHaveLength(0);
  });

  it('세일 여부는 색상 단위라 사이즈 전부에 실린다', () => {
    const { linked } = toLoadInput([
      variant({
        onSale: true,
        sizes: [
          { label: 'S', availability: 'in_stock', cadCents: 18850 },
          { label: 'M', availability: 'in_stock', cadCents: 18850 },
        ],
      }),
    ]);
    expect(linked[0]!.sizes.every((s) => s.onSale)).toBe(true);
  });
});

describe('적재 후보 — listingRows 와 이어 붙였을 때', () => {
  const build = (variants: StockPayload['variants']) => {
    const { linked } = toLoadInput(variants);
    return listingRows(linked);
  };

  it('사이즈 없는 상품(가방)의 표기를 한 축으로 모은다', () => {
    // 카탈로그는 ONE SIZE, 수집기는 `-` 를 쓴다. 안 맞추면 재고가 통째로 버려진다.
    const rows = build([
      variant({ sizes: [{ label: '-', availability: 'in_stock', cadCents: 46000 }] }),
    ]);
    expect(rows[0]!.size).toBe('ONE SIZE');
  });

  it('판정하지 못한 사이즈는 행을 만들지 않는다', () => {
    /*
     * unknown 으로 행을 남기면 뷰가 "확인했다"고 착각한다.
     * 확인한 적 없음은 행의 부재로 둔다 (PROJECT.md §6.5).
     */
    const rows = build([
      variant({
        sizes: [
          { label: 'S', availability: 'unknown', cadCents: 22800 },
          { label: 'M', availability: 'in_stock', cadCents: 22800 },
        ],
      }),
    ]);
    expect(rows.map((r) => r.size)).toEqual(['M']);
  });

  it('신선도 게이트가 볼 last_success_at 을 관측 시각으로 채운다', () => {
    const rows = build([variant({ checkedAt: '2026-08-29T10:00:00.000Z' })]);
    expect(rows[0]!.last_success_at).toBe('2026-08-29T10:00:00.000Z');
  });

  it('품절도 그대로 싣는다 — 판매 여부는 뷰가 정한다', () => {
    const rows = build([
      variant({ sizes: [{ label: 'M', availability: 'out_of_stock', cadCents: 22800 }] }),
    ]);
    expect(rows[0]!.availability).toBe('out_of_stock');
  });
});
