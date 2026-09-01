import { describe, expect, it } from 'vitest';
import {
  csvField,
  exportFileName,
  productCsvRow,
  productsCsv,
  variantCsvRow,
  variantsCsv,
  type AdminVariantRow,
} from './product-export';
import type { AdminProductRow } from '@/components/admin/product-table';

/**
 * CSV 생성.
 *
 * 여기서 지켜야 하는 것은 셋이다 — 엑셀이 한글을 읽을 것(BOM), 수식으로 실행하지
 * 않을 것, 그리고 화면의 표와 같은 값을 낼 것.
 */

const row = (over: Partial<AdminProductRow> = {}): AdminProductRow => ({
  id: 'x',
  name: '베타 LT 자켓',
  slug: 'beta-lt-jacket',
  category: 'outerwear',
  gender: 'men',
  status: 'active',
  featured_rank: null,
  shipping_krw: 9500,
  smartstore_url: 'https://smartstore.naver.com/ricky/products/1',
  official_url: 'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868',
  origin_country: 'ID',
  material: '나일론 100%',
  care: '단독 세탁',
  manufacturer: "Arc'teryx Equipment",
  as_contact: 'RICKY 고객센터',
  brands: { name: "Arc'teryx", official_site_url: 'https://arcteryx.com' },
  product_variants: [
    { price_krw: 712000, active: true, smartstore_url: null },
    { price_krw: 712000, active: false, smartstore_url: null },
  ],
  ...over,
});

describe('csvField', () => {
  it('쉼표·따옴표·개행이 있으면 감싸고 따옴표를 두 배로 만든다', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('그는 "말했다"')).toBe('"그는 ""말했다"""');
    expect(csvField('두\n줄')).toBe('"두\n줄"');
  });

  it('숫자는 감싸지 않는다 — 감싸면 엑셀이 글자로 읽어 합계가 안 된다', () => {
    expect(csvField(712000)).toBe('712000');
    expect(csvField(0)).toBe('0');
  });

  it('null과 undefined는 빈 칸이다', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });

  /*
   * 상품명은 수집기와 운영자가 넣는 값이라 우리가 통제하지 못한다.
   * `=`로 시작하는 이름이 들어오면 엑셀이 그걸 수식으로 실행한다.
   */
  it('수식으로 해석될 값 앞에 작은따옴표를 붙인다', () => {
    expect(csvField('=1+1')).toBe("'=1+1");
    expect(csvField('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvField('-Beta')).toBe("'-Beta");
    expect(csvField('+82')).toBe("'+82");
  });

  it('평범한 값은 그대로 둔다', () => {
    expect(csvField('베타 LT 자켓')).toBe('베타 LT 자켓');
  });
});

describe('productCsvRow', () => {
  it('활성 옵션만 세고 첫 옵션의 가격을 쓴다 — 화면의 표와 같은 규칙', () => {
    const cells = productCsvRow(row()).split(',');
    expect(cells[7]).toBe('1');
    expect(cells[8]).toBe('712000');
  });

  it('상품 페이지 주소를 싣는다 — 브랜드 홈이 아니라', () => {
    const cells = productCsvRow(row()).split(',');
    expect(cells[3]).toBe('https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868');
    expect(cells[4]).toBe('상품');
  });

  /*
   * 캐나다구스는 아직 상품 URL 을 해석하지 않았다. 브랜드 홈으로 떨어지되
   * **떨어졌다는 사실을 적는다** — 안 적으면 상품 페이지인 줄 알고 연다.
   */
  it('상품 주소가 없으면 브랜드 홈으로 떨어지고 그 사실을 밝힌다', () => {
    const r = row({
      official_url: null,
      brands: { name: '캐나다구스', official_site_url: 'https://www.canadagoose.com/ca/en' },
    });
    const cells = productCsvRow(r).split(',');
    expect(cells[3]).toBe('https://www.canadagoose.com/ca/en');
    expect(cells[4]).toBe('브랜드 홈');
  });

  it('Supabase가 브랜드를 배열로 줘도 읽는다', () => {
    const r = row({ official_url: null, brands: [{ name: '코치', official_site_url: 'https://coach.com' }] });
    expect(productCsvRow(r)).toContain('https://coach.com');
  });

  it('게시를 막는 항목을 그대로 적는다', () => {
    const r = row({ material: null, as_contact: null });
    expect(productCsvRow(r)).toContain('소재 · A/S 없음');
  });

  it('배송비는 숫자다 — 빈칸은 무게 기준, 0은 무료', () => {
    expect(productCsvRow(row({ shipping_krw: null })).split(',')[9]).toBe('');
    expect(productCsvRow(row({ shipping_krw: 0 })).split(',')[9]).toBe('0');
  });
});

describe('productsCsv', () => {
  it('BOM으로 시작한다 — 없으면 엑셀이 한글을 CP949로 읽어 깨진다', () => {
    expect(productsCsv([row()]).charCodeAt(0)).toBe(0xfeff);
  });

  it('헤더 한 줄 + 상품 수만큼의 줄', () => {
    const lines = productsCsv([row(), row()]).trimEnd().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('공식몰');
  });

  it('상품이 없어도 헤더는 나온다', () => {
    expect(productsCsv([]).trimEnd().split('\r\n')).toHaveLength(1);
  });
});

describe('exportFileName', () => {
  it('한국 날짜로 이름을 짓는다 — UTC로 두면 아침에 어제 날짜가 찍힌다', () => {
    // 2026-08-30 00:30 KST = 2026-08-29 15:30 UTC
    const at = new Date('2026-08-29T15:30:00Z');
    expect(exportFileName('상품', at)).toBe('RICKY-상품-20260830.csv');
    expect(exportFileName('옵션', at)).toBe('RICKY-옵션-20260830.csv');
  });
});

describe('productCsvRow — 구매 경로 범위', () => {
  /* 섞인 상태가 제일 위험하다. 안 채운 색은 다른 색 페이지로 떨어진다. */
  it('색상별로 일부만 채우면 몇 분의 몇인지 적는다', () => {
    const cells = productCsvRow(
      row({
        product_variants: [
          { price_krw: 1, active: true, smartstore_url: 'https://smartstore.naver.com/a/products/1' },
          { price_krw: 1, active: true, smartstore_url: null },
        ],
      }),
    ).split(',');
    expect(cells.at(-1)).toBe('색상별 1/2');
  });

  it('전부 채우면 개수만 적는다', () => {
    const cells = productCsvRow(
      row({
        product_variants: [
          { price_krw: 1, active: true, smartstore_url: 'https://smartstore.naver.com/a/products/1' },
          { price_krw: 1, active: true, smartstore_url: 'https://smartstore.naver.com/a/products/2' },
        ],
      }),
    ).split(',');
    expect(cells.at(-1)).toBe('색상별 2');
  });

  it('색상별이 하나도 없으면 상품 주소를 쓴다는 뜻으로 `상품`', () => {
    expect(productCsvRow(row()).split(',').at(-1)).toBe('상품');
  });

  it('상품 주소마저 없으면 빈 칸 — 살 수 없다', () => {
    expect(productCsvRow(row({ smartstore_url: null })).split(',').at(-1)).toBe('');
  });

  /* 판매하지 않는 색은 세지 않는다 — 안 파는 색에 주소가 없다고 경고할 이유가 없다 */
  it('비활성 옵션은 분모에서 뺀다', () => {
    const cells = productCsvRow(
      row({
        product_variants: [
          { price_krw: 1, active: true, smartstore_url: 'https://smartstore.naver.com/a/products/1' },
          { price_krw: 1, active: false, smartstore_url: null },
        ],
      }),
    ).split(',');
    expect(cells.at(-1)).toBe('색상별 1');
  });
});

describe('variantCsvRow — 옵션 단위', () => {
  const variant = (over: Partial<AdminVariantRow> = {}): AdminVariantRow => ({
    sku: 'CG-LANGFORD-BLACK-M',
    size: 'M',
    color: 'Classic Disc / Black',
    price_krw: 1_890_000,
    weight_g: null,
    official_url: 'https://www.canadagoose.com/ca/en/langford-parka-black',
    smartstore_url: null,
    active: true,
    products: {
      name: '랭포드 파카',
      slug: 'canada-goose-langford-parka-men',
      official_url: null,
      smartstore_url: null,
      brands: { name: '캐나다구스' },
    },
    ...over,
  });

  it('옵션 주소가 있으면 그것을 쓰고 범위를 `옵션`으로 적는다', () => {
    const cells = variantCsvRow(variant()).split(',');
    expect(cells[8]).toBe('https://www.canadagoose.com/ca/en/langford-parka-black');
    expect(cells[9]).toBe('옵션');
  });

  /*
   * 자동화가 색상별 주소인 줄 알고 도는 것을 막는다. 떨어졌으면 떨어졌다고 적는다.
   */
  it('옵션 주소가 없으면 상품 주소로 떨어지고 범위를 `상품`으로 적는다', () => {
    const r = variant({
      official_url: null,
      products: {
        name: '베타 자켓',
        slug: 'arcteryx-beta-jacket-men',
        official_url: 'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868',
        smartstore_url: null,
        brands: { name: "Arc'teryx" },
      },
    });
    const cells = variantCsvRow(r).split(',');
    expect(cells[8]).toBe('https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868');
    expect(cells[9]).toBe('상품');
  });

  /*
   * 구매 경로. 공식몰과 같은 규칙이지만 틀렸을 때의 값이 다르다 —
   * 공식몰이 어긋나면 운영자가 헛걸음하고, 구매 경로가 어긋나면 **고객이 다른 색을 산다.**
   */
  it('색상 전용 구매 경로가 있으면 범위를 `옵션`으로 적는다', () => {
    const cells = variantCsvRow(
      variant({ smartstore_url: 'https://smartstore.naver.com/ricky/products/7' }),
    ).split(',');
    expect(cells[10]).toBe('https://smartstore.naver.com/ricky/products/7');
    expect(cells[11]).toBe('옵션');
  });

  it('색상 전용이 없으면 상품 주소로 떨어지고 범위를 `상품`으로 적는다', () => {
    const cells = variantCsvRow(
      variant({
        products: {
          name: '랭포드 파카',
          slug: 'canada-goose-langford-parka-men',
          official_url: null,
          smartstore_url: 'https://smartstore.naver.com/ricky/products/1',
          brands: { name: '캐나다구스' },
        },
      }),
    ).split(',');
    expect(cells[10]).toBe('https://smartstore.naver.com/ricky/products/1');
    expect(cells[11]).toBe('상품');
  });

  it('구매 경로가 아예 없으면 빈 칸이다 — 살 수 없는 옵션이다', () => {
    const cells = variantCsvRow(variant()).split(',');
    expect(cells[10]).toBe('');
    expect(cells[11]).toBe('');
  });

  it('둘 다 없으면 주소도 범위도 빈 칸이다', () => {
    const cells = variantCsvRow(variant({ official_url: null })).split(',');
    expect(cells[8]).toBe('');
    expect(cells[9]).toBe('');
  });

  it('비활성 옵션도 담되 판매 여부를 밝힌다 — 지운 게 아니라 내린 것이다', () => {
    expect(variantCsvRow(variant({ active: false })).endsWith(',N')).toBe(true);
    expect(variantCsvRow(variant()).endsWith(',Y')).toBe(true);
  });

  it('헤더와 열 수가 맞는다', () => {
    const csv = variantsCsv([variant()]).trimEnd().split('\r\n');
    expect(csv[0]!.split(',')).toHaveLength(csv[1]!.split(',').length);
  });
});
