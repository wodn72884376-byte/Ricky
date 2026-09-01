import { describe, expect, it } from 'vitest';
import { brandFromUrl, captureToStock } from '../stock/import.ts';
import {
  arcteryxNameCandidates,
  cachedUrls,
  codeFromSku,
  genderOf,
  matchToCatalog,
  type CatalogTarget,
} from '../stock/catalog.ts';
import type { ProductStock, StockRow } from '../stock/types.ts';
import { linkStock } from '../stock/link.ts';
import { BRANDS } from '../config/brands.ts';
import {
  batchBookmarkletSource,
  bookmarkletSource,
  catalogFingerprint,
  CAPTURE_VERSION,
  nameSlug,
} from '../stock/bookmarklet.ts';
import type { StockCapture } from '../stock/bookmarklet.ts';

const capture = (over: Partial<StockCapture> = {}): StockCapture => ({
  v: CAPTURE_VERSION,
  url: 'https://ca.coach.com/en/products/denim-hooded-zip-jacket/CAF56.html',
  title: 'Denim Hooded Zip Jacket',
  capturedAt: '2026-08-28T00:00:00.000Z',
  jsonld: [
    JSON.stringify({
      '@type': 'ProductGroup',
      name: 'Denim Hooded Zip Jacket',
      productGroupID: 'CAF56',
      hasVariant: [
        {
          '@type': 'Product',
          sku: 'CAF56 KHA  M',
          color: 'Khaki',
          size: 'M',
          offers: {
            '@type': 'Offer',
            priceCurrency: 'CAD',
            price: 167.5,
            availability: 'https://schema.org/OutOfStock',
          },
        },
        {
          '@type': 'Product',
          sku: 'CAF56 KHA  XXL',
          color: 'Khaki',
          size: 'XXL',
          offers: {
            '@type': 'Offer',
            priceCurrency: 'CAD',
            price: 167.5,
            availability: 'https://schema.org/InStock',
          },
        },
      ],
    }),
  ],
  ...over,
});

describe('brandFromUrl', () => {
  it('CA 공식몰 도메인으로 브랜드를 판정한다', () => {
    expect(brandFromUrl('https://ca.coach.com/en/products/x/A1.html')).toBe('coach');
    expect(brandFromUrl('https://arcteryx.com/ca/en/shop/x')).toBe('arcteryx');
    expect(brandFromUrl('https://shop.lululemon.com/en-ca/p/x')).toBe('lululemon');
  });

  it('KR 공식몰도 판정한다', () => {
    expect(brandFromUrl('https://korea.coach.com/products/x/A1.html')).toBe('coach');
  });

  it('등록되지 않은 사이트는 null', () => {
    expect(brandFromUrl('https://example.com/p/1')).toBeNull();
  });

  it('URL 이 아니면 null', () => {
    expect(brandFromUrl('그냥 문자열')).toBeNull();
  });
});

describe('captureToStock', () => {
  it('북마클릿 수집분이 자동 수집분과 같은 구조로 들어온다', () => {
    const s = captureToStock(capture());
    expect(s.error).toBeNull();
    expect(s.brand).toBe('coach');
    expect(s.productCode).toBe('CAF56');
    expect(s.rows).toHaveLength(2);

    const m = s.rows.find((r) => r.size.label === 'M');
    expect(m?.colour).toBe('Khaki');
    expect(m?.availability).toBe('out_of_stock');
    expect(m?.priceCents).toBe(16750);
    expect(m?.styleCode).toBe('CAF56');
    expect(m?.colourCode).toBe('KHA');
  });

  it('사람이 직접 수집한 값임을 source 로 남긴다', () => {
    // 자동 폴링과 신선도 성격이 다르므로 구분이 남아야 한다
    expect(captureToStock(capture()).rows[0]?.source).toBe('manual');
  });

  it('신발은 SKU 에서 치수와 폭을 되찾는다', () => {
    const shoe = capture({
      url: 'https://ca.coach.com/en/products/reagan-penny-loafer/CAP31.html',
      jsonld: [
        JSON.stringify({
          '@type': 'ProductGroup',
          name: 'Reagan Penny Loafer',
          productGroupID: 'CAP31',
          hasVariant: [
            {
              '@type': 'Product',
              sku: 'CCN27 CBD  9.5 D',
              color: 'Dark Stone',
              size: 'extra wide',
              offers: {
                '@type': 'Offer',
                priceCurrency: 'CAD',
                price: 140,
                availability: 'https://schema.org/InStock',
              },
            },
          ],
        }),
      ],
    });
    const row = captureToStock(shoe).rows[0];
    expect(row?.size.label).toBe('9.5 D');
    expect(row?.size.width).toBe('D');
  });

  it('@graph 로 감싼 JSON-LD 도 읽는다', () => {
    const c = capture({
      jsonld: [
        JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', name: 'Coach' },
            {
              '@type': 'Product',
              name: 'Wrapped',
              sku: 'AAA BBB  M',
              size: 'M',
              color: 'Black',
              offers: {
                '@type': 'Offer',
                priceCurrency: 'CAD',
                price: 100,
                availability: 'https://schema.org/InStock',
              },
            },
          ],
        }),
      ],
    });
    const s = captureToStock(c);
    expect(s.error).toBeNull();
    expect(s.productName).toBe('Wrapped');
  });

  it('깨진 블록이 섞여 있어도 나머지를 읽는다', () => {
    const c = capture({ jsonld: ['{ 이건 JSON 이 아니다', ...capture().jsonld] });
    expect(captureToStock(c).error).toBeNull();
  });

  it('상품 페이지가 아니면 사유를 남긴다', () => {
    const c = capture({ jsonld: [JSON.stringify({ '@type': 'WebSite', name: 'Coach' })] });
    const s = captureToStock(c);
    expect(s.rows).toHaveLength(0);
    expect(s.error).toContain('상품 JSON-LD');
  });

  it('등록되지 않은 사이트는 거절한다', () => {
    const s = captureToStock(capture({ url: 'https://example.com/p/1' }));
    expect(s.error).toContain('등록되지 않은 사이트');
  });
});

describe('bookmarkletSource', () => {
  it('javascript: URL 한 줄이다 — 북마크에 붙여넣을 수 있어야 한다', () => {
    const src = bookmarkletSource();
    expect(src.startsWith('javascript:')).toBe(true);
    expect(src).not.toContain('\n');
  });

  it('JSON-LD 를 걷어 파일로 내려받는다', () => {
    const src = bookmarkletSource();
    expect(src).toContain('application/ld+json');
    expect(src).toContain('ricky-stock-');
  });

  it('해석하지 않고 원문을 그대로 담는다 — 해석은 한 곳에서만 한다', () => {
    // textContent 를 그대로 싣고, 파싱·정규화는 import 쪽 추출기가 맡는다
    expect(bookmarkletSource()).toContain('textContent');
  });
});

describe('captureToStock — 상품코드', () => {
  it('JSON-LD 에 코드가 없으면 URL 에서 뽑고, 행과 헤더가 같은 값을 쓴다', () => {
    /*
     * 실측 사고(랄프로렌): ProductGroup 에 productGroupID/sku 가 없어
     * 행에는 URL 폴백이 걸렸는데 헤더에는 안 걸려 '-' 로 나왔다.
     * 그 사이 변화 감지 키까지 흔들려 가짜 이벤트 132건이 났다.
     */
    const c = capture({
      url: 'https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-cotton-sweater/515061.html#start=1',
      jsonld: [
        JSON.stringify({
          '@type': 'ProductGroup',
          name: 'Cable-Knit Cotton Sweater',
          hasVariant: [
            {
              '@type': 'Product',
              color: 'Hunter Navy',
              size: 'XS',
              offers: {
                '@type': 'Offer',
                priceCurrency: 'CAD',
                price: 198,
                availability: 'https://schema.org/InStock',
              },
            },
          ],
        }),
      ],
    });
    const s = captureToStock(c);
    expect(s.productCode).toBe('515061');
    expect(s.rows[0]?.productCode).toBe('515061');
    expect(s.rows[0]?.size.label).toBe('XS');
    expect(s.rows[0]?.colour).toBe('Hunter Navy');
  });
});

describe('captureToStock — 화면에서 읽은 사이즈', () => {
  /*
   * 실측(랄프로렌 Cable-Knit Cotton Polo Sweater):
   * JSON-LD 에 Garden Trail Heather 가 S·M 두 개만 실려 있는데
   * 실제 페이지에는 XS~XXL 이 전부 있고 일부만 품절이었다.
   * JSON-LD 는 재고도 전부 InStock 으로 적는다 → 화면이 정답이다.
   */
  const withDom = (sizes: Array<[string, boolean]>, colour = 'Garden Trail Heather') =>
    capture({
      url: 'https://www.ralphlauren.ca/men-clothing-sweaters/x/650001.html',
      jsonld: [
        JSON.stringify({
          '@type': 'ProductGroup',
          name: 'Cable-Knit Cotton Polo Sweater',
          hasVariant: [
            { '@type': 'Product', color: colour, size: 'S',
              offers: { '@type': 'Offer', priceCurrency: 'CAD', price: 198,
                availability: 'https://schema.org/InStock' } },
            { '@type': 'Product', color: colour, size: 'M',
              offers: { '@type': 'Offer', priceCurrency: 'CAD', price: 198,
                availability: 'https://schema.org/InStock' } },
            { '@type': 'Product', color: 'Polo Black', size: 'XS',
              offers: { '@type': 'Offer', priceCurrency: 'CAD', price: 198,
                availability: 'https://schema.org/InStock' } },
          ],
        }),
      ],
      dom: {
        selectedColour: colour,
        sizes: sizes.map(([label, available]) => ({ label, available, selected: false })),
      },
    });

  it('JSON-LD 에 없던 사이즈를 화면에서 채운다', () => {
    const s = captureToStock(
      withDom([['XS', true], ['S', true], ['M', true], ['L', true], ['XL', true], ['XXL', true]]),
    );
    const gt = s.rows.filter((r) => r.colour === 'Garden Trail Heather');
    expect(gt.map((r) => r.size.label).sort()).toEqual(['L', 'M', 'S', 'XL', 'XS', 'XXL']);
  });

  it('수량 드롭다운의 "1" 을 사이즈로 받지 않는다', () => {
    /*
     * 실측 사고(랄프로렌 638616): 수량 선택의 "1" 이 사이즈 축에 열로 섞여
     * 존재하지 않는 사이즈가 리포트에 생겼다. 북마클릿에도 같은 규칙이 있지만
     * 고치기 전에 만든 캡처가 계속 들어오므로 여기서도 막는다.
     */
    const s = captureToStock(withDom([['1', true], ['S', true], ['M', true]]));
    const gt = s.rows.filter((r) => r.colour === 'Garden Trail Heather');
    expect(gt.map((r) => r.size.label).sort()).toEqual(['M', 'S']);
  });

  it('화면의 품절 상태가 JSON-LD 의 InStock 을 이긴다', () => {
    const s = captureToStock(withDom([['S', true], ['M', false]]));
    const m = s.rows.find((r) => r.colour === 'Garden Trail Heather' && r.size.label === 'M');
    expect(m?.availability).toBe('out_of_stock');
  });

  it('화면에 없는 사이즈를 지우지 않는다 — 코치는 살 수 있는 버튼만 그린다', () => {
    /*
     * 실측(코치 Denim Hooded Zip Jacket): JSON-LD 에 6사이즈(5품절+XXL재고)가 있는데
     * 화면에는 XXL 버튼 하나만 그려진다. 화면 기준으로 덮으면 품절 5개가 통째로 사라진다.
     * 화면에 없다고 사이즈가 없는 게 아니다.
     */
    const c = capture({
      dom: { selectedColour: 'Khaki', sizes: [{ label: 'XXL', available: true, selected: false }] },
    });
    const s = captureToStock(c);
    const labels = s.rows.map((r) => r.size.label).sort();
    expect(labels).toEqual(['M', 'XXL']); // JSON-LD 의 M(품절) 이 남아 있어야 한다
    expect(s.rows.find((r) => r.size.label === 'M')?.availability).toBe('out_of_stock');
    expect(s.rows.find((r) => r.size.label === 'XXL')?.availability).toBe('in_stock');
  });

  it('화면에 안 뜬 다른 색상은 건드리지 않는다', () => {
    // 선택되지 않은 색상은 알 수 없다. 지우거나 덮으면 없는 정보를 지어내는 것이다.
    const s = captureToStock(withDom([['S', true]]));
    const black = s.rows.filter((r) => r.colour === 'Polo Black');
    expect(black).toHaveLength(1);
    expect(black[0]?.size.label).toBe('XS');
  });

  it('가격은 기존 variant 값을 이어받는다', () => {
    const s = captureToStock(withDom([['XL', true]]));
    const xl = s.rows.find((r) => r.size.label === 'XL');
    expect(xl?.priceCents).toBe(19800);
  });

  it('선택 색상을 모르면 화면 값을 쓰지 않는다', () => {
    // 어느 줄에 덮을지 모르는 상태에서 덮으면 엉뚱한 색상이 오염된다
    const c = withDom([['XL', true]]);
    const s = captureToStock({ ...c, dom: { selectedColour: null, sizes: c.dom!.sizes } });
    expect(s.rows.map((r) => r.size.label).sort()).toEqual(['M', 'S', 'XS']);
  });
});

describe('북마클릿 소스 — 문법', () => {
  /*
   * 북마클릿은 여러 줄 JS 를 한 줄로 눌러 만든다. 이때 `//` 주석이 남아 있으면
   * 줄바꿈이 사라지면서 뒤따르는 코드를 통째로 삼킨다.
   * 실제로 목록수집이 이걸로 깨졌고(SyntaxError), 브라우저에 넣기 전에는 안 보였다.
   */
  it.each([
    ['단건', bookmarkletSource()],
    ['목록', batchBookmarkletSource()],
  ])('%s 수집 북마클릿은 실행 가능한 JS 다', (_name, src) => {
    const body = src.replace(/^javascript:/, '');
    expect(() => new Function(body)).not.toThrow();
  });

  it.each([
    ['단건', bookmarkletSource()],
    ['목록', batchBookmarkletSource()],
  ])('%s 은 한 줄이며 javascript: 로 시작한다', (_name, src) => {
    expect(src.startsWith('javascript:')).toBe(true);
    expect(src).not.toContain('\n');
  });

  it('한 줄로 눌러도 주석이 코드를 삼키지 않는다', () => {
    // 주석 뒤에 있던 fetch 폴백이 살아 있어야 한다
    expect(batchBookmarkletSource()).toContain('credentials');
  });

  it('목록수집은 상품 링크를 모아 iframe 으로 읽는다', () => {
    const src = batchBookmarkletSource();
    expect(src).toContain('iframe');
    expect(src).toContain('isProduct');
    expect(src).toContain('batch:');
  });
});

describe('matchToCatalog — 코드 체계가 있는 브랜드', () => {
  const target = (over: Partial<CatalogTarget> = {}): CatalogTarget => ({
    slug: 'polo-cable-knit-cotton-polo-sweater-men',
    brand: 'polo',
    name: 'Cable-Knit Cotton Polo Sweater',
    gender: 'men',
    codes: ['650001'],
    urls: [],
    url: null,
    officialUrls: [],
    ...over,
  });

  const stock = (code: string, name: string): ProductStock => ({
    brand: 'polo',
    productUrl: `https://www.ralphlauren.ca/x/${code}.html`,
    productName: name,
    productCode: code,
    rows: [],
    error: null,
    checkedAt: '2026-08-28T00:00:00.000Z',
  });

  it('코드가 맞으면 붙인다', () => {
    expect(matchToCatalog(stock('650001', 'Cable-Knit Cotton Polo Sweater'), [target()])?.slug).toBe(
      target().slug,
    );
  });

  it('코드가 다르면 이름이 비슷해도 붙이지 않는다', () => {
    /*
     * 실측 사고: 폴로는 상품명이 전부 "Cable-Knit Cotton …" 이라
     * 이름 유사도로 물러나자 650001 이 515061 페이지에 잘못 붙었다.
     * 코드가 안 맞으면 다른 상품이다.
     */
    const wrong = stock('515061', 'Cable-Knit Cotton Sweater');
    expect(matchToCatalog(wrong, [target()])).toBeNull();
  });

  it('코드가 없는 브랜드는 이름으로 붙인다', () => {
    // 룰루레몬은 SKU 접두어가 브랜드명이라 코드가 없다
    const lulu: CatalogTarget = {
      slug: 'lululemon-extra-large-claw-hair-clip-women',
      brand: 'lululemon',
      name: 'Extra Large Claw Hair Clip',
      gender: 'women',
      codes: [],
      urls: [],
      url: null,
      officialUrls: [],
    };
    const s: ProductStock = {
      brand: 'lululemon',
      productUrl: 'https://shop.lululemon.com/en-ca/p/x/prod1',
      productName: 'Extra Large Claw Hair Clip',
      productCode: null,
      rows: [],
      error: null,
      checkedAt: '2026-08-28T00:00:00.000Z',
    };
    expect(matchToCatalog(s, [lulu])?.slug).toBe(lulu.slug);
  });

  it('URL 이 이미 확정돼 있으면 그것을 쓴다', () => {
    const t = target({ url: 'https://www.ralphlauren.ca/x/650001.html' });
    const s = stock('650001', '이름이 달라도 상관없다');
    expect(matchToCatalog(s, [t])?.slug).toBe(t.slug);
  });
});

describe('codeFromSku', () => {
  it('SKU 접두어에서 브랜드 상품코드를 뽑는다', () => {
    expect(codeFromSku('X000010932-GRAPHITE-BLACK')).toBe('X000010932');
    expect(codeFromSku('100066198-CAMEL-MELANGE')).toBe('100066198');
    expect(codeFromSku('CDZ42-BRASS-MAPLE')).toBe('CDZ42');
  });

  it('코드 체계가 없어 브랜드명이 들어간 경우는 코드로 보지 않는다', () => {
    expect(codeFromSku('LULULEMON-FLAMINGO-FUN')).toBeNull();
  });
});

describe('목록수집 — 카탈로그 필터', () => {
  const SLUGS = {
    'shop.lululemon.com': [
      'mens-fast-and-free-trail-running-vest',
      'womens-fast-and-free-trail-running-vest',
      'jumbo-claw-clip',
    ],
  };
  const BY_HOST = {
    'coach.com': ['CDZ42', 'CU068'],
    'arcteryx.com': ['X000010932'],
    // 룰루레몬은 카탈로그에 상품이 있지만 SKU 에 코드가 없다
    'shop.lululemon.com': [],
  };

  it('코드를 심어도 실행 가능한 JS 다', () => {
    const body = batchBookmarkletSource(BY_HOST).replace(/^javascript:/, '');
    expect(() => new Function(body)).not.toThrow();
  });

  it('심은 코드가 북마클릿에 들어간다', () => {
    const src = batchBookmarkletSource(BY_HOST);
    expect(src).toContain('CDZ42');
    expect(src).toContain('X000010932');
  });

  it('사이트별로 코드 목록을 나눠 담는다', () => {
    /*
     * 하나로 합치면 안 된다. 코치 페이지에서 아크테릭스 코드로도 걸러지고,
     * 무엇보다 코드가 없는 브랜드가 다른 브랜드 코드에 막혀 0건이 된다.
     */
    const src = batchBookmarkletSource(BY_HOST);
    expect(src).toContain('BY_HOST');
    expect(src).toContain('location.hostname.indexOf');
  });

  it('코드가 없는 브랜드는 상품명 슬러그로 거른다', () => {
    /*
     * 실측: 룰루레몬은 상품코드가 없어 필터가 통째로 꺼졌고, 목록 전체 81건을
     * 8분에 걸쳐 받아 놓고 정작 카탈로그 상품은 4건이었다.
     */
    const src = batchBookmarkletSource(BY_HOST, {}, SLUGS);
    expect(src).toContain('WANT_SLUGS');
    expect(src).toContain('mens-fast-and-free-trail-running-vest');
  });

  it('맵이 비면 전부 수집하는 동작으로 남는다', () => {
    expect(batchBookmarkletSource()).toContain('var BY_HOST={}');
  });

  it('브랜드별 URL 규칙을 모두 담는다', () => {
    const src = batchBookmarkletSource(BY_HOST);
    // 코치·랄프로렌은 /코드.html, 아크테릭스는 뒤 4자리
    expect(src).toContain("'/'+C+'.HTML'");
    expect(src).toContain('C.slice(-4)');
  });
});

describe('matchToCatalog — 이름만으로 붙일 때', () => {
  const vest = (gender: 'men' | 'women'): CatalogTarget => ({
    slug: `lululemon-fast-and-free-trail-running-vest-${gender}`,
    brand: 'lululemon',
    name: 'Fast and Free Trail Running Vest',
    gender,
    codes: [],
    urls: [],
    url: null,
    officialUrls: [],
  });

  const stock = (name: string, url = 'https://shop.lululemon.com/en-ca/p/x/prod1'): ProductStock => ({
    brand: 'lululemon',
    productUrl: url,
    productName: name,
    productCode: null,
    rows: [],
    error: null,
    checkedAt: '2026-08-28T00:00:00.000Z',
  });

  it('이름이 비슷할 뿐인 다른 상품은 붙이지 않는다', () => {
    /*
     * 실측 사고: "Fast and Free Running Belt" 가 "Fast and Free Trail Running Vest" 에
     * 0.71 로 붙어 리포트에 엉뚱한 상품이 올라왔다. 벨트와 조끼는 다른 상품이다.
     */
    expect(matchToCatalog(stock('Fast and Free Running Belt'), [vest('men')])).toBeNull();
  });

  it('이름이 같으면 붙인다', () => {
    const s = stock("Men's Fast and Free Trail Running Vest");
    expect(matchToCatalog(s, [vest('men')])?.gender).toBe('men');
  });

  it('남성·여성 동명 상품을 성별로 가른다', () => {
    // 이름이 완전히 같아 성별을 안 보면 동점이 된다
    const both = [vest('men'), vest('women')];
    expect(matchToCatalog(stock("Men's Fast and Free Trail Running Vest"), both)?.gender).toBe('men');
    expect(matchToCatalog(stock("Women's Fast and Free Trail Running Vest"), both)?.gender).toBe(
      'women',
    );
  });

  it('URL 에만 성별이 있어도 가른다', () => {
    const s = stock(
      'Fast and Free Trail Running Vest',
      'https://shop.lululemon.com/en-ca/p/equipment/Womens-Fast-and-Free-Trail-Running-Vest/_/prod1',
    );
    expect(matchToCatalog(s, [vest('men'), vest('women')])?.gender).toBe('women');
  });

  it('성별을 알 수 없고 동점이면 붙이지 않는다', () => {
    // 무엇을 고르든 근거가 없다. 미수집으로 남기고 사람이 판단하게 한다.
    expect(matchToCatalog(stock('Fast and Free Trail Running Vest'), [vest('men'), vest('women')]))
      .toBeNull();
  });
});

describe('genderOf', () => {
  it('women 이 men 보다 먼저 판정된다 — women 안에 men 이 들어 있다', () => {
    expect(genderOf("Women's Trail Vest")).toBe('women');
    expect(genderOf('Womens-Fast-and-Free')).toBe('women');
  });

  it('남성 표기를 읽는다', () => {
    expect(genderOf("Men's Trail Vest")).toBe('men');
    expect(genderOf('Mens-Fast-and-Free')).toBe('men');
  });

  it('없으면 null', () => {
    expect(genderOf('Cable-Knit Cotton Sweater')).toBeNull();
  });
});

describe('captureToStock — 색상별로 눌러 읽은 결과', () => {
  /*
   * 실측(랄프로렌): 색상이 6개 이상이면 JSON-LD 에서 사이즈를 통째로 뺀다.
   *   색상 ≤ 5  → 모든 색상에 사이즈 있음 (100066198: 3색)
   *   색상 ≥ 6  → 사이즈 0 (625239: 11색)
   * 그때는 화면에서 색상을 하나씩 눌러 읽는 수밖에 없다.
   */
  const manyColours = (byColour: Array<{ colour: string; sizes: Array<[string, boolean]> }>) =>
    capture({
      url: 'https://www.ralphlauren.ca/x/625239.html',
      jsonld: [
        JSON.stringify({
          '@type': 'ProductGroup',
          name: 'Cable-Knit Wool-Cashmere Sweater',
          hasVariant: [
            // 색상만 있고 사이즈가 없는 형태 — 색상 6개 이상일 때 랄프로렌이 주는 모양
            { '@type': 'Product', color: 'Polo Black',
              offers: { '@type': 'Offer', priceCurrency: 'CAD', price: 228,
                availability: 'https://schema.org/InStock' } },
            { '@type': 'Product', color: 'Hunter Navy',
              offers: { '@type': 'Offer', priceCurrency: 'CAD', price: 228,
                availability: 'https://schema.org/InStock' } },
          ],
        }),
      ],
      dom: {
        selectedColour: null,
        sizes: [],
        byColour: byColour.map((c) => ({
          colour: c.colour,
          sizes: c.sizes.map(([label, available]) => ({ label, available, selected: false })),
        })),
      },
    });

  it('색상마다 읽은 사이즈를 각각 제자리에 합친다', () => {
    const s = captureToStock(
      manyColours([
        { colour: 'Polo Black', sizes: [['S', true], ['M', false]] },
        { colour: 'Hunter Navy', sizes: [['S', false], ['M', true]] },
      ]),
    );
    const at = (c: string, sz: string) =>
      s.rows.find((r) => r.colour === c && r.size.label === sz)?.availability;

    expect(at('Polo Black', 'S')).toBe('in_stock');
    expect(at('Polo Black', 'M')).toBe('out_of_stock');
    expect(at('Hunter Navy', 'S')).toBe('out_of_stock');
    expect(at('Hunter Navy', 'M')).toBe('in_stock');
  });

  it('읽지 못한 색상은 사이즈 없는 채로 남는다 — 재고 없음이 아니다', () => {
    const s = captureToStock(manyColours([{ colour: 'Polo Black', sizes: [['S', true]] }]));
    const navy = s.rows.filter((r) => r.colour === 'Hunter Navy');
    expect(navy).toHaveLength(1);
    expect(navy[0]?.size.label).toBe('-');
  });

  it('가격은 기존 색상 행에서 이어받는다', () => {
    const s = captureToStock(manyColours([{ colour: 'Polo Black', sizes: [['S', true]] }]));
    expect(s.rows.find((r) => r.size.label === 'S')?.priceCents).toBe(22800);
  });
});

describe('arcteryxNameCandidates — 시즌마다 바뀌는 상품코드', () => {
  /*
   * 실측: 원본 폴더 `아크테릭스/남성/Beta Jacket Men's` 안에
   *   F26-X000010878-Beta-Jacket-...  (가을)
   *   S26-X000010511-Beta-Jacket-...  (봄)
   * 두 시즌 이미지가 함께 있다. 카탈로그는 F26 코드를 물고 있는데 사이트맵에는
   * -0878 이 없어서 끝 4자리 대조가 빗나가고 상품이 조용히 빠졌다.
   */
  const SITEMAP = [
    'https://arcteryx.com/ca/en/shop/mens/beta-ar-jacket-1062',
    'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0511',
    'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868',
    'https://arcteryx.com/ca/en/shop/mens/beta-sl-jacket-0854',
    'https://arcteryx.com/ca/en/shop/womens/beta-jacket-0867',
  ];

  it('이름과 성별이 같은 URL 만 후보로 든다', () => {
    expect(arcteryxNameCandidates('Beta Jacket', 'men', SITEMAP)).toEqual([
      'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0511',
      'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868',
    ]);
  });

  it('여성 URL 을 남성 상품에 붙이지 않는다', () => {
    expect(arcteryxNameCandidates('Beta Jacket', 'women', SITEMAP)).toEqual([
      'https://arcteryx.com/ca/en/shop/womens/beta-jacket-0867',
    ]);
  });

  it('Beta Jacket 이 Beta AR/SL Jacket 을 끌어오지 않는다', () => {
    const got = arcteryxNameCandidates('Beta Jacket', 'men', SITEMAP);
    expect(got.every((u) => !/beta-(ar|sl)-jacket/.test(u))).toBe(true);
  });

  it("아포스트로피가 든 이름도 슬러그로 맞춘다", () => {
    expect(
      arcteryxNameCandidates('Atom Hoody', 'men', [
        'https://arcteryx.com/ca/en/shop/mens/atom-hoody-9556',
      ]),
    ).toHaveLength(1);
  });
});

describe('nameSlug · slugInUrl — 코드 없는 브랜드의 이름 대조', () => {
  it('아포스트로피를 URL 표기에 맞춰 지운다', () => {
    expect(nameSlug("Men's Fast and Free Trail Running Vest")).toBe(
      'mens-fast-and-free-trail-running-vest',
    );
    expect(nameSlug('Extra Large Claw Hair Clip')).toBe('extra-large-claw-hair-clip');
  });

  /** 북마클릿 안에 심긴 slugInUrl 을 그대로 꺼내 돌린다 */
  const slugInUrl = new Function(
    'u',
    'slug',
    "var N='-'+String(u).toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-';" +
      "return N.indexOf('-'+slug+'-')>=0;",
  ) as (u: string, slug: string) => boolean;

  const WOMENS =
    'https://shop.lululemon.com/en-ca/p/equipment/Womens-Fast-and-Free-Trail-Running-Vest/_/prod11890062';
  const MENS =
    'https://shop.lululemon.com/en-ca/p/equipment/Mens-Fast-and-Free-Trail-Running-Vest/_/prod11890040';

  it('실제 룰루레몬 URL 에서 이름을 찾는다', () => {
    expect(slugInUrl(MENS, nameSlug("Men's Fast and Free Trail Running Vest"))).toBe(true);
    expect(slugInUrl(WOMENS, nameSlug("Women's Fast and Free Trail Running Vest"))).toBe(true);
  });

  it('남성 이름이 여성 URL 에 붙지 않는다', () => {
    /*
     * 'womens-fast-…' 안에 'mens-fast-…' 가 그대로 들어 있다.
     * 경계를 안 보면 남녀 상품이 서로 뒤바뀐다 — 룰루레몬은 둘의 이름이 같다.
     */
    expect(slugInUrl(WOMENS, nameSlug("Men's Fast and Free Trail Running Vest"))).toBe(false);
    expect(slugInUrl(MENS, nameSlug("Women's Fast and Free Trail Running Vest"))).toBe(false);
  });

  it('관계없는 상품은 걸리지 않는다', () => {
    expect(slugInUrl(MENS, nameSlug('Jumbo Claw Clip'))).toBe(false);
  });

  it('같은 슬러그가 둘이어도 첫 건에서 멈추지 않는다', () => {
    /*
     * 실측: 카탈로그는 룰루레몬 남녀 조끼를 둘 다 이름 'Fast and Free Trail Running Vest'
     * 로 들고 있다(성별은 별도 필드). 슬러그가 같으므로 첫 건에서 break 하면
     * 나머지 하나가 수집됐는데도 늘 "못 찾음" 으로 보고된다.
     */
    const src = batchBookmarkletSource(
      { 'shop.lululemon.com': [] },
      {},
      { 'shop.lululemon.com': ['fast-and-free-trail-running-vest'] },
    );
    const loop = src
      .slice(src.indexOf('WANT_SLUGS[g]'), src.indexOf('urls=kept'))
      .replace(/\/\*[\s\S]*?\*\//g, ''); // 주석에 든 'break' 는 코드가 아니다
    expect(loop).not.toContain('break');
    expect(loop).toContain('hitCodes[WANT_NAMES[g]]=1');
  });
});

describe('cachedUrls — 사람이 고른 URL 은 --fresh 로도 지우지 않는다', () => {
  /*
   * 실측: 아크테릭스 Beta Jacket 은 카탈로그 코드(X000010878)가 CA 사이트에 없어
   * 코드로도 이름으로도(후보 2건) 자동 해석이 안 된다. 사람이 확인해
   * supplier-urls.json 에 적어 넣은 beta-jacket-0868 이 유일한 답이다.
   * --fresh 가 이걸 지우면 새로고침 한 번에 그 확인이 날아간다.
   */
  const MANUAL = { url: 'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868', via: 'manual' };
  const AUTO = { url: 'https://arcteryx.com/ca/en/shop/mens/alpha-jacket-0932', via: 'sitemap' };

  it('평소에는 캐시된 URL 을 그대로 쓴다', () => {
    expect(cachedUrls(MANUAL, false)).toEqual([MANUAL.url]);
    expect(cachedUrls(AUTO, false)).toEqual([AUTO.url]);
  });

  it('--fresh 는 자동 해석분만 버린다', () => {
    expect(cachedUrls(AUTO, true)).toEqual([]);
    expect(cachedUrls(MANUAL, true)).toEqual([MANUAL.url]);
  });

  it('북마클릿이 학습한 URL 도 --fresh 로 다시 푼다', () => {
    expect(cachedUrls({ url: 'https://x/y', via: 'bookmarklet' }, true)).toEqual([]);
  });

  it('캐시에 없으면 null', () => {
    expect(cachedUrls(undefined, false)).toEqual([]);
  });
});

describe('캐나다구스 — 한 상품이 페이지 여러 개', () => {
  /*
   * 실측: 로고 디스크 마감마다 스타일 코드가 따로다.
   *   MacMillan Parka  Classic Disc → 2080M   ·  Black Disc → 2080MB
   * 카탈로그는 이걸 한 상품의 색상으로 접어 두므로(SKU `2080M-CLASSIC-DISC-BLACK`),
   * 코드 하나만 URL 로 풀면 나머지 디스크의 재고가 통째로 빠진다.
   */
  const TARGET: CatalogTarget = {
    slug: 'canadagoose-macmillan-parka-men',
    brand: 'canadagoose',
    name: 'MacMillan Parka',
    gender: 'men',
    codes: ['2080MB', '2080M'],
    urls: [
      'https://www.canadagoose.com/ca/en/macmillan-parka-2080MB.html',
      'https://www.canadagoose.com/ca/en/macmillan-parka-2080M.html',
    ],
    url: 'https://www.canadagoose.com/ca/en/macmillan-parka-2080MB.html',
    officialUrls: [],
  };

  const cgStock = (url: string, code: string, colour: string): ProductStock => ({
    brand: 'canadagoose',
    productUrl: url,
    productName: 'MacMillan Parka',
    productCode: code,
    rows: [],
    error: null,
    checkedAt: '2026-08-29T00:00:00.000Z',
  });

  it('디스크가 다른 두 페이지가 모두 같은 카탈로그 상품에 붙는다', () => {
    for (const [url, code] of [
      [TARGET.urls[0]!, '2080MB'],
      [TARGET.urls[1]!, '2080M'],
    ] as const) {
      expect(matchToCatalog(cgStock(url, code, 'Black'), [TARGET])?.slug).toBe(TARGET.slug);
    }
  });

  it('색상은 디스크를 떼고 맞춘다 — 사이트는 "Atlantic Navy"라고만 말한다', () => {
    /*
     * 카탈로그 SKU 는 `2080M-CLASSIC-DISC-ATLANTIC-NAVY` 인데 수집한 색상은
     * `Atlantic Navy` 다. 통째로 비교하면 캐나다구스 재고가 하나도 안 붙는다.
     */
    const row = (colour: string, code: string): StockRow => ({
      brand: 'canadagoose',
      productCode: code,
      productName: 'MacMillan Parka',
      productUrl: `https://www.canadagoose.com/ca/en/macmillan-parka-${code}.html`,
      sku: null,
      gtin: null,
      styleCode: code,
      colour,
      colourCode: null,
      size: { declared: 'M', code: 'M', width: null, label: 'M' },
      availability: 'in_stock',
      priceCents: 145000,
      listPriceCents: null,
      onSale: false,
      checkedAt: '2026-08-29T00:00:00.000Z',
      source: 'manual',
    });

    const catalog = [
      {
        slug: 'canadagoose-macmillan-parka-men',
        name: 'MacMillan Parka',
        brandSlug: 'canadagoose',
        variants: [
          { sku: '2080M-CLASSIC-DISC-ATLANTIC-NAVY', color: 'Classic Disc / Atlantic Navy' },
          { sku: '2080MB-BLACK-DISC-BLACK', color: 'Black Disc / Black' },
        ],
      },
    ];

    const { linked } = linkStock([row('Atlantic Navy', '2080M'), row('Black', '2080MB')], catalog);

    expect(linked.map((l) => l.sku).sort()).toEqual([
      '2080M-CLASSIC-DISC-ATLANTIC-NAVY',
      '2080MB-BLACK-DISC-BLACK',
    ]);
    // variant 마다 자기 디스크의 페이지를 들고 있어야 한다
    expect(linked.find((l) => l.sku.startsWith('2080MB'))?.productUrl).toContain('2080MB');
    expect(linked.find((l) => l.sku.startsWith('2080M-'))?.productUrl).toContain('2080M.html');
  });
});

describe('캐나다구스 URL 코드 대조 — 2080M 은 2080MB 의 접두사다', () => {
  /** 북마클릿에 심긴 codeInUrl 을 그대로 꺼내 돌린다 */
  const src = batchBookmarkletSource();
  const body = src.slice(src.indexOf('function codeInUrl'));
  const codeInUrl = new Function(
    'return ' + body.slice(0, body.indexOf('function slugInUrl')),
  )() as (u: string, code: string) => boolean;

  const BLACK = 'https://www.canadagoose.com/ca/en/macmillan-parka-2080MB.html';
  const CLASSIC = 'https://www.canadagoose.com/ca/en/macmillan-parka-2080M.html';

  it('자기 코드에만 걸린다', () => {
    expect(codeInUrl(BLACK, '2080MB')).toBe(true);
    expect(codeInUrl(CLASSIC, '2080M')).toBe(true);
  });

  it('Classic 코드가 Black 페이지에 걸리지 않는다', () => {
    /*
     * 경계를 안 두면 '2080M' 이 '…-2080MB.html' 안에서 걸려,
     * Classic 디스크의 재고로 Black 디스크 페이지를 읽게 된다 — 없는 재고를 만든다.
     */
    expect(codeInUrl(BLACK, '2080M')).toBe(false);
  });

  it('쿼리스트링이 붙어도 판정이 흔들리지 않는다', () => {
    expect(codeInUrl(`${CLASSIC}?dwvar=9063`, '2080M')).toBe(true);
  });
});

describe('catalogFingerprint — 북마클릿이 낡았는지 알아채기', () => {
  /*
   * 북마클릿은 등록 상품 목록을 **안에 박아** 배포한다. 상품을 추가해도 브라우저의
   * 북마크는 옛 목록 그대로라, 새 상품이 수집에서 조용히 빠진다.
   * 실제로 캐나다구스 8건이 그럴 뻔했다 — 사람이 기억할 일이 아니다.
   */
  const A = { 'ca.coach.com': ['CDZ42', 'CU068'] };
  const B = { 'ca.coach.com': ['CDZ42', 'CU068'], 'canadagoose.com': ['2080M'] };

  it('같은 카탈로그면 같은 지문이다', () => {
    expect(catalogFingerprint(A)).toBe(catalogFingerprint({ 'ca.coach.com': ['CDZ42', 'CU068'] }));
  });

  it('코드 순서가 달라도 같은 지문이다 — 순서는 뜻이 없다', () => {
    expect(catalogFingerprint(A)).toBe(catalogFingerprint({ 'ca.coach.com': ['CU068', 'CDZ42'] }));
  });

  it('브랜드가 늘면 지문이 달라진다', () => {
    expect(catalogFingerprint(B)).not.toBe(catalogFingerprint(A));
  });

  it('코드가 하나만 빠져도 달라진다', () => {
    expect(catalogFingerprint({ 'ca.coach.com': ['CDZ42'] })).not.toBe(catalogFingerprint(A));
  });

  it('이름으로 거르는 브랜드의 슬러그 변화도 잡는다', () => {
    const withSlug = catalogFingerprint(A, { 'shop.lululemon.com': ['jumbo-claw-clip'] });
    expect(withSlug).not.toBe(catalogFingerprint(A));
  });

  it('목록수집 북마클릿이 지문을 싣는다', () => {
    const src = batchBookmarkletSource(A);
    expect(src).toContain(`var CATALOG_FP="${catalogFingerprint(A)}"`);
    expect(src).toContain('catalogFp:CATALOG_FP');
  });
});

describe('자동 수집 가능 여부 표시', () => {
  /*
   * 북마클릿으로 한 번 수집하면 learnUrls 가 URL 을 학습한다. 표시가 없으면
   * 그 뒤로 매 회차 차단된 사이트를 헛되이 두드리고, 리포트가 '수집 실패'로 채워져
   * 진짜 실패가 묻힌다. 실측(2026-08-29) 기준을 코드에 박아 둔다.
   */
  it('앞문까지 막힌 브랜드는 북마클릿 전용으로 표시돼 있다', () => {
    for (const key of ['canadagoose', 'polo', 'lululemon', 'tumi'] as const) {
      expect(BRANDS[key].ca.automation).toBe('bookmarklet');
    }
  });

  it('사이트맵이 열리는 브랜드는 자동이다', () => {
    // 아크테릭스는 Kasada 를 PDP 에만 걸어 사이트맵·robots 를 정적으로 내준다
    for (const key of ['arcteryx', 'coach'] as const) {
      expect(BRANDS[key].ca.automation ?? 'auto').toBe('auto');
    }
  });
});

describe('카탈로그의 공식몰 URL', () => {
  /*
   * 캐나다구스는 사이트맵이 429 라 해석으로는 URL 을 영영 못 얻는다.
   * 사람이 카탈로그에 적어 둔 값이 유일한 답이고, 그래서 해석보다 우선한다.
   */
  it('색상마다 URL 이 있어도 같은 페이지면 한 번만 연다', async () => {
    const { catalogTargets } = await import('../stock/catalog.ts');
    const cg = catalogTargets(['canadagoose']);
    expect(cg.length).toBeGreaterThan(0);

    for (const t of cg) {
      const paths = t.officialUrls.map((u) => new URL(u).origin + new URL(u).pathname);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });

  it('경로가 다르면 전부 남긴다 — 디스크 마감마다 별도 PDP 다', async () => {
    const { catalogTargets } = await import('../stock/catalog.ts');
    const langford = catalogTargets(['canadagoose']).find((t) => t.slug.includes('langford'));
    expect(langford).toBeDefined();
    // 2052M · 2052MT · 2052MB — 하나로 접으면 나머지 디스크 재고가 통째로 빠진다
    expect(langford!.officialUrls.length).toBeGreaterThan(1);
  });

  /*
   * "모든 상품에 URL 이 있다" 를 단언하지 않는다. 상품을 새로 등록하면 URL 이 아직
   * 없는 게 정상이고, 그때마다 테스트가 깨지면 데이터 추가를 막는 셈이다 —
   * 실측: 캐나다구스 KIDS 7건이 들어오자 바로 그렇게 됐다.
   * 중요한 건 **빠진 것이 드러나는가** 다. 그건 재고관리.html 과 extension 이 센다.
   */
  it('URL 이 없는 상품은 빈 배열로 드러난다 — 조용히 사라지지 않는다', async () => {
    const { catalogTargets } = await import('../stock/catalog.ts');
    for (const t of catalogTargets()) expect(Array.isArray(t.officialUrls)).toBe(true);
  });
});
