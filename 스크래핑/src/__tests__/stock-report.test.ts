import { describe, expect, it } from 'vitest';
import { renderStockReport, toStockCsv } from '../stock/report.ts';
import { renderStockHtml } from '../stock/html.ts';
import type { ProductStock, StockRow } from '../stock/types.ts';

const row = (over: Partial<StockRow> = {}): StockRow => ({
  brand: 'coach',
  productCode: 'CAP31',
  productName: 'Reagan Penny Loafer',
  productUrl: 'https://ca.coach.com/en/products/reagan-penny-loafer/CAP31.html',
  sku: 'CCN27 BLK  7   D',
  gtin: null,
  styleCode: 'CCN27',
  colour: 'Black',
  colourCode: 'BLK',
  size: { declared: 'extra wide', code: '7', width: 'D', label: '7 D' },
  availability: 'in_stock',
  priceCents: 25000,
  listPriceCents: null,
  onSale: false,
  checkedAt: '2026-08-28T00:00:00.000Z',
  source: 'http',
  ...over,
});

const product = (rows: StockRow[]): ProductStock => ({
  brand: 'coach',
  productUrl: rows[0]!.productUrl,
  productName: rows[0]!.productName,
  productCode: rows[0]!.productCode,
  rows,
  error: null,
  checkedAt: '2026-08-28T00:00:00.000Z',
});

const META = { startedAt: '2026-08-28T00:00:00.000Z', durationMs: 1000, comparedWith: null };

describe('renderStockReport — 색상 × 사이즈 매트릭스', () => {
  it('사이즈 축을 열로, 색상을 행으로 그린다', () => {
    const rows = [
      row({ colour: 'Black', size: { declared: null, code: 'S', width: null, label: 'S' } }),
      row({ colour: 'Black', size: { declared: null, code: 'M', width: null, label: 'M' }, availability: 'out_of_stock' }),
      row({ colour: 'Tan', size: { declared: null, code: 'S', width: null, label: 'S' } }),
      row({ colour: 'Tan', size: { declared: null, code: 'M', width: null, label: 'M' } }),
    ];
    const md = renderStockReport([product(rows)], [], META);
    expect(md).toContain('| 색상 \\ 사이즈 | S | M |');
    expect(md).toContain('| Black | ● | ○ |');
    expect(md).toContain('| Tan | ● | ● |');
  });

  it('편성되지 않은 조합과 품절을 구분한다', () => {
    // Black 은 M 이 아예 없고, Tan 은 M 이 품절이다. 둘을 같게 그리면 안 된다.
    const rows = [
      row({ colour: 'Black', size: { declared: null, code: 'S', width: null, label: 'S' } }),
      row({ colour: 'Tan', size: { declared: null, code: 'S', width: null, label: 'S' } }),
      row({ colour: 'Tan', size: { declared: null, code: 'M', width: null, label: 'M' }, availability: 'out_of_stock' }),
    ];
    const md = renderStockReport([product(rows)], [], META);
    expect(md).toContain('| Black | ● | · |');
    expect(md).toContain('| Tan | ● | ○ |');
  });

  it('같은 색상·사이즈가 스타일별로 겹치면 매트릭스를 갈라 그린다', () => {
    /*
     * 실측(Coach Reagan Penny Loafer): 한 페이지에 스타일 두 개가 묶여 있어
     * "Black / 7 D" 가 재고 상태가 다른 채로 두 줄 존재한다.
     * 하나로 뭉개면 한 쪽이 조용히 사라진다.
     */
    const rows = [
      row({ styleCode: 'CCN27', sku: 'CCN27 BLK  7   D', availability: 'in_stock' }),
      row({ styleCode: 'CAP31', sku: 'CAP31 BLK  7   D', availability: 'out_of_stock', priceCents: 29000 }),
    ];
    const md = renderStockReport([product(rows)], [], META);
    expect(md).toContain('스타일 `CCN27`');
    expect(md).toContain('스타일 `CAP31`');
    // 두 상태가 모두 남아 있어야 한다
    expect(md).toContain('| Black | ● |');
    expect(md).toContain('| Black | ○ |');
  });

  it('사이즈가 없는 상품은 variant 를 SKU 단위로 편다', () => {
    // 색상으로 접으면 같은 색상명의 다른 스타일이 사라진다
    const rows = [
      row({ sku: 'CW640 B4/BK', styleCode: 'CW640', colour: 'Brass/Black', size: { declared: 'medium', code: null, width: null, label: '-' }, priceCents: 46000 }),
      row({ sku: 'CDZ65 B4/BK', styleCode: 'CDZ65', colour: 'Brass/Black', size: { declared: 'medium', code: null, width: null, label: '-' }, priceCents: 58000 }),
    ];
    const md = renderStockReport([product(rows)], [], META);
    expect(md).toContain('CW640 B4/BK');
    expect(md).toContain('CDZ65 B4/BK');
  });

  it('variant 가격이 다르면 범위로 적는다 — 하나만 고르면 거짓말이 된다', () => {
    const rows = [
      row({ sku: 'A B  S', priceCents: 33000, size: { declared: null, code: 'S', width: null, label: 'S' } }),
      row({ sku: 'A B  M', priceCents: 58000, size: { declared: null, code: 'M', width: null, label: 'M' } }),
    ];
    const md = renderStockReport([product(rows)], [], META);
    expect(md).toContain('CA$330.00 ~ CA$580.00');
    expect(md).not.toContain('세일');
  });

  it('수집 실패를 품절과 분리해 보고한다', () => {
    const failed: ProductStock = {
      brand: 'arcteryx',
      productUrl: 'https://arcteryx.com/ca/en/shop/x',
      productName: '',
      productCode: null,
      rows: [],
      error: '상품 데이터를 얻지 못했다 (차단 또는 마크업 변경)',
      checkedAt: '2026-08-28T00:00:00.000Z',
    };
    const md = renderStockReport([failed], [], META);
    expect(md).toContain('수집 실패');
    expect(md).toContain('**실패는 품절이 아니다.**');
  });
});

describe('toStockCsv', () => {
  it('사이즈를 라벨·치수·폭·원문으로 나눠 싣는다', () => {
    const csv = toStockCsv([row()]);
    expect(csv).toContain('사이즈,사이즈_치수,사이즈_폭,사이즈_원문');
    expect(csv).toContain('7 D,7,D,extra wide');
  });

  it('엑셀이 한글을 깨지 않도록 BOM 을 붙인다', () => {
    expect(toStockCsv([row()]).charCodeAt(0)).toBe(0xfeff);
  });

  it('쉼표가 든 색상명을 따옴표로 감싼다', () => {
    const csv = toStockCsv([row({ colour: 'Brass, Poppy' })]);
    expect(csv).toContain('"Brass, Poppy"');
  });
});

describe('renderStockHtml — 미확인 색상', () => {
  /*
   * 실측 사고(랄프로렌 625239): 11색 중 Polo Black 만 사이즈가 실려 있고
   * 나머지 10색은 색상 정보만 왔는데, 리포트가 이를 미편성(·)으로 그려
   * 재고가 멀쩡한 색상이 "살 수 없음"으로 보였다.
   */
  const sized = (colour: string, label: string, availability: StockRow['availability'] = 'in_stock') =>
    row({
      colour,
      availability,
      size: { declared: label, code: label, width: null, label },
    });

  const colourOnly = (colour: string) =>
    row({ colour, size: { declared: null, code: null, width: null, label: '-' } });

  it('사이즈를 못 받은 색상은 미편성이 아니라 미확인으로 그린다', () => {
    const rows = [sized('Polo Black', 'M'), sized('Polo Black', 'L'), colourOnly('Hunter Navy')];
    const md = renderStockHtml([product(rows)], [], META);
    expect(md).toContain('확인되지 않았다');
    // 미확인 색상 줄은 ? 로 채운다
    expect(md).toMatch(/Hunter Navy<\/td>(<td class="m unk"[^>]*>\?<\/td>)+/);
  });

  it('사이즈를 받은 색상은 실제 상태 그대로 그린다', () => {
    const rows = [
      sized('Polo Black', 'M'),
      sized('Polo Black', 'L', 'out_of_stock'),
      colourOnly('Hunter Navy'),
    ];
    const html = renderStockHtml([product(rows)], [], META);

    // Polo Black 줄은 재고(●)와 품절(○)이 그대로 남아야 한다
    const rowHtml = html.match(/Polo Black<\/td>(.*?)<\/tr>/s)?.[1] ?? '';
    expect(rowHtml).toContain('>●<');
    expect(rowHtml).toContain('>○<');
    expect(rowHtml).not.toContain('>?<');
  });

  it('미확인 색상 수를 상품 헤더에 알린다', () => {
    const rows = [sized('Polo Black', 'M'), colourOnly('A'), colourOnly('B')];
    const md = renderStockHtml([product(rows)], [], META);
    expect(md).toContain('사이즈 미확인 2색');
  });

  it('사이즈를 못 받은 색상을 재고로 세지 않는다', () => {
    /*
     * 실측 사고(638616): 16색 중 1색만 사이즈가 실려 왔는데, 랄프로렌이 나머지 15색의
     * 색상 전용 행에도 InStock 을 적어 보내 헤더가 "재고 24/24" 로 찍혔다.
     * 확인한 적 없는 것을 재고로 세면 안 된다 — 없는 재고를 파는 길이다.
     */
    const rows = [
      sized('Preppy Green', 'M'),
      sized('Preppy Green', 'L'),
      ...['Cream', 'White', 'Hunter Navy'].map(colourOnly),
    ];
    const html = renderStockHtml([product(rows)], [], META);
    expect(html).toContain('재고 2/2');
    expect(html).not.toContain('재고 5/5');
    expect(html).toContain('미확인 3색');
  });

  it('사이즈 축이 없는 상품(가방)은 미확인으로 보지 않는다', () => {
    // 전 색상이 사이즈 없이 오는 게 정상인 품목이다
    const rows = [colourOnly('Brass/Black'), colourOnly('Brass/Maple')];
    const md = renderStockHtml([product(rows)], [], META);
    expect(md).not.toContain('사이즈 미확인');
  });
});
