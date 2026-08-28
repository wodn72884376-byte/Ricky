import { describe, expect, it } from 'vitest';
import { brandFromUrl, captureToStock } from '../stock/import.ts';
import {
  arcteryxNameCandidates,
  codeFromSku,
  genderOf,
  matchToCatalog,
  type CatalogTarget,
} from '../stock/catalog.ts';
import type { ProductStock } from '../stock/types.ts';
import {
  batchBookmarkletSource,
  bookmarkletSource,
  CAPTURE_VERSION,
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
    url: null,
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
      url: null,
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

  it('코드가 없는 브랜드는 거르지 않는다 — 빈 목록은 전체 수집을 뜻한다', () => {
    // 룰루레몬처럼 상품코드가 없는 브랜드에 필터를 걸면 전부 걸러져 0건이 된다
    const src = batchBookmarkletSource(BY_HOST);
    expect(src).toContain('if(WANT.length)');
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
    url: null,
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
