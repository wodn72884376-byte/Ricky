import { describe, expect, it } from 'vitest';
import { extractOpenGraph, extractProduct, parseJsonLdBlocks } from '../extract/jsonld.ts';

/**
 * 실제 arcteryx.com/ca/en PDP 구조를 축약한 픽스처.
 * (2026-08-26 실측: ProductGroup + hasVariant, sku/gtin14/color/size/CAD price/availability)
 */
const ARC_PDP = `<!doctype html><html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>
<script type="application/ld+json">{
  "@context":"https://schema.org","@type":"ProductGroup",
  "name":"Alpha SL 30 Backpack","productGroupID":"X000009660",
  "category":"Climbing Gear","releaseDate":"2025-01-01",
  "brand":{"@type":"Brand","name":"Arc'teryx"},
  "material":"Body: 200d weave, Graflyte VA - 100% Polyethylene",
  "variesBy":["https://schema.org/color","https://schema.org/size"],
  "hasVariant":[
    {"@type":"Product","name":"Alpha SL 30 Backpack, White Light, Size NA",
     "sku":"X000009660001","mpn":"X000009660001","gtin14":"00623555662723",
     "color":"White Light","size":"NA",
     "image":"https://images.arcteryx.com/a.jpg",
     "offers":{"@type":"Offer","priceCurrency":"CAD","price":520,
       "availability":"https://schema.org/InStock"}},
    {"@type":"Product","name":"Alpha SL 30 Backpack, Black, Size NA",
     "sku":"X000009660002","color":"Black","size":"NA",
     "offers":{"@type":"Offer","priceCurrency":"CAD","price":480,
       "availability":"https://schema.org/OutOfStock"}}
  ]}</script>
</head><body></body></html>`;

describe('parseJsonLdBlocks', () => {
  it('여러 블록을 모두 읽는다', () => {
    expect(parseJsonLdBlocks(ARC_PDP)).toHaveLength(2);
  });

  it('@graph 를 평탄화한다', () => {
    const html = `<script type="application/ld+json">
      {"@context":"x","@graph":[{"@type":"Product","name":"A"},{"@type":"Organization","name":"B"}]}
    </script>`;
    const names = parseJsonLdBlocks(html).map((n) => n.name);
    expect(names).toContain('A');
    expect(names).toContain('B');
  });

  it('깨진 블록 하나가 나머지를 막지 않는다', () => {
    const html = `
      <script type="application/ld+json">{ not json }</script>
      <script type="application/ld+json">{"@type":"Product","name":"OK"}</script>`;
    expect(parseJsonLdBlocks(html)).toHaveLength(1);
  });

  it('HTML 주석으로 감싼 블록도 읽는다', () => {
    const html = `<script type="application/ld+json"><!--{"@type":"Product","name":"C"}--></script>`;
    expect(parseJsonLdBlocks(html)[0]?.name).toBe('C');
  });
});

describe('extractProduct', () => {
  it('ProductGroup 에서 variant 단위 정보를 뽑는다', () => {
    const p = extractProduct(ARC_PDP, 'CAD');
    expect(p).not.toBeNull();
    expect(p?.name).toBe('Alpha SL 30 Backpack');
    expect(p?.productCode).toBe('X000009660');
    expect(p?.releaseDate).toBe('2025-01-01');
    expect(p?.variants).toHaveLength(2);
    expect(p?.variants[0]?.gtin).toBe('00623555662723');
    expect(p?.variants[0]?.color).toBe('White Light');
  });

  it('대표가는 variant 최저가이며 cent 정수다', () => {
    const p = extractProduct(ARC_PDP, 'CAD');
    expect(p?.priceMinor).toBe(48000); // CA$480.00
    expect(Number.isInteger(p?.priceMinor)).toBe(true);
  });

  it('variant 중 하나라도 재고가 있으면 in_stock 이다', () => {
    expect(extractProduct(ARC_PDP, 'CAD')?.availability).toBe('in_stock');
  });

  it('모든 variant 가 품절이면 out_of_stock 이다', () => {
    const oos = ARC_PDP.replace(/InStock/g, 'OutOfStock');
    expect(extractProduct(oos, 'CAD')?.availability).toBe('out_of_stock');
  });

  it('지역 통화가 아닌 variant 는 버린다', () => {
    const usd = ARC_PDP.replace(/"CAD"/g, '"USD"');
    const p = extractProduct(usd, 'CAD');
    expect(p?.variants).toHaveLength(0);
    expect(p?.priceMinor).toBeNull();
  });

  it('material 설명에서 원산지 힌트를 읽는다', () => {
    const html = ARC_PDP.replace(
      '"material":"Body: 200d weave, Graflyte VA - 100% Polyethylene"',
      '"material":"Made in Canada, 100% Down"',
    );
    expect(extractProduct(html, 'CAD')?.originCountryHint).toMatch(/Canada/i);
  });

  it('AggregateOffer 의 lowPrice 를 읽는다', () => {
    const html = `<script type="application/ld+json">{"@type":"Product","name":"X",
      "offers":{"@type":"AggregateOffer","priceCurrency":"CAD","lowPrice":"1,299.00",
      "availability":"https://schema.org/InStock"}}</script>`;
    expect(extractProduct(html, 'CAD')?.priceMinor).toBe(129900);
  });

  it('그룹 정가와 variant 세일가를 구분한다', () => {
    // Coach 실측 구조: ProductGroup.offers 에 정가 360, variant 에 세일가 180
    const html = `<script type="application/ld+json">{
      "@type":"ProductGroup","name":"Jet Shoulder Bag","productGroupID":"CAM16",
      "offers":{"@type":"Offer","priceCurrency":"CAD","price":360,
        "availability":"https://schema.org/InStock"},
      "hasVariant":[
        {"@type":"Product","name":"Jet Shoulder Bag Black","sku":"CAM16 LHBLK","color":"Black",
         "offers":{"@type":"Offer","priceCurrency":"CAD","price":180,
           "availability":"https://schema.org/InStock"}}
      ]}</script>`;
    const p = extractProduct(html, 'CAD');
    expect(p?.priceMinor).toBe(18000); // 실제 매입 가능한 최저가
    expect(p?.listPriceMinor).toBe(36000); // 정가 — 세일 판정의 근거
  });

  it('세일이 아니면 정가를 비워 둔다', () => {
    // 전 variant 가 같은 값이면 할인 정보가 없는 것이다
    const p = extractProduct(ARC_PDP.replace('"price":480', '"price":520'), 'CAD');
    expect(p?.priceMinor).toBe(52000);
    expect(p?.listPriceMinor).toBeNull();
  });

  it('그룹 offer 가 없으면 variant 가격차를 세일로 지어내지 않는다', () => {
    /*
     * 실측(Coach Juliet Shoulder Bag 25): 스타일코드가 다른 관련 상품 11종을
     * 한 ProductGroup 으로 묶어 두고 그룹 offer 는 아예 없다. 가격은 330~580.
     * variant 최고가를 정가로 삼으면 없는 43% 세일이 만들어진다.
     */
    const html = `<script type="application/ld+json">{
      "@type":"ProductGroup","name":"Juliet Shoulder Bag 25","productGroupID":"CAD75",
      "hasVariant":[
        {"@type":"Product","sku":"CDZ67 B4YMW","color":"Brass/Dark Indigo","size":"medium",
         "offers":{"@type":"Offer","priceCurrency":"CAD","price":330,
           "availability":"https://schema.org/OutOfStock"}},
        {"@type":"Product","sku":"CEM90 B4/HA","color":"Brass/Chalk","size":"medium",
         "offers":{"@type":"Offer","priceCurrency":"CAD","price":580,
           "availability":"https://schema.org/InStock"}}
      ]}</script>`;
    const p = extractProduct(html, 'CAD');
    expect(p?.priceMinor).toBe(33000);
    expect(p?.listPriceMinor).toBeNull();
  });

  it('hasVariant 가 없는 단일 상품도 variant 1개로 세운다', () => {
    /*
     * 색상·사이즈가 하나뿐인 상품은 variant 배열 없이 노드 자신에 offer 를 단다.
     * "variant 없음 = 수집 실패"로 처리하면 멀쩡한 상품이 통째로 버려진다.
     */
    const html = `<script type="application/ld+json">{
      "@type":"Product","name":"Cherry Bag Charm","sku":"CX123 BLK","color":"Black",
      "offers":{"@type":"Offer","priceCurrency":"CAD","price":20,
        "availability":"https://schema.org/InStock"}}</script>`;
    const p = extractProduct(html, 'CAD');
    expect(p?.variants).toHaveLength(1);
    expect(p?.variants[0]?.color).toBe('Black');
    expect(p?.variants[0]?.priceMinor).toBe(2000);
    expect(p?.variants[0]?.availability).toBe('in_stock');
  });

  it('가격이 없으면 variant 를 지어내지 않는다', () => {
    const html = `<script type="application/ld+json">{"@type":"Product","name":"X"}</script>`;
    expect(extractProduct(html, 'CAD')?.variants).toHaveLength(0);
  });

  it('색상·사이즈가 없는 대표 항목은 variant 에서 뺀다', () => {
    /*
     * 실측(랄프로렌): hasVariant 첫 자리에 상품 자신이 들어간다(sku 만 있고 color/size 없음).
     * 남겨 두면 매트릭스에 빈 행이 생기고 variant 수도 하나 많게 센다.
     */
    const html = `<script type="application/ld+json">{
      "@type":"ProductGroup","name":"Cable-Knit Cotton Polo Sweater",
      "hasVariant":[
        {"@type":"Product","sku":"650001",
         "offers":{"@type":"Offer","priceCurrency":"CAD","price":198,
           "availability":"https://schema.org/InStock"}},
        {"@type":"Product","color":"Hunter Navy","size":"XS",
         "offers":{"@type":"Offer","priceCurrency":"CAD","price":198,
           "availability":"https://schema.org/InStock"}}
      ]}</script>`;
    const p = extractProduct(html, 'CAD');
    expect(p?.variants).toHaveLength(1);
    expect(p?.variants[0]?.color).toBe('Hunter Navy');
  });

  it('색상·사이즈 개념이 없는 상품은 그대로 둔다', () => {
    // 가방·지갑은 전 variant 가 color/size 없이 온다. 이걸 걸러내면 상품이 통째로 사라진다.
    const html = `<script type="application/ld+json">{
      "@type":"Product","name":"Cherry Bag Charm","sku":"CX123",
      "offers":{"@type":"Offer","priceCurrency":"CAD","price":20,
        "availability":"https://schema.org/InStock"}}</script>`;
    expect(extractProduct(html, 'CAD')?.variants).toHaveLength(1);
  });

  it('상품 마크업이 없으면 null', () => {
    expect(extractProduct('<html><body>없음</body></html>', 'CAD')).toBeNull();
  });

  it('이름이 없는 노드는 상품으로 인정하지 않는다', () => {
    const html = `<script type="application/ld+json">{"@type":"Product","sku":"A1"}</script>`;
    expect(extractProduct(html, 'CAD')).toBeNull();
  });
});

describe('extractOpenGraph', () => {
  it('JSON-LD 가 없을 때 최소 정보를 건진다', () => {
    const html = `<meta property="og:title" content="Beta LT Jacket">
      <meta property="product:price:amount" content="650.00">
      <meta property="product:price:currency" content="CAD">`;
    const og = extractOpenGraph(html, 'CAD');
    expect(og?.name).toBe('Beta LT Jacket');
    expect(og?.priceMinor).toBe(65000);
  });

  it('속성 순서가 뒤바뀐 meta 도 읽는다', () => {
    const html = `<meta content="Alpha SV" property="og:title">`;
    expect(extractOpenGraph(html, 'CAD')?.name).toBe('Alpha SV');
  });

  it('통화가 다르면 가격을 채우지 않는다', () => {
    const html = `<meta property="og:title" content="X">
      <meta property="product:price:amount" content="650.00">
      <meta property="product:price:currency" content="USD">`;
    expect(extractOpenGraph(html, 'CAD')?.priceMinor).toBeNull();
  });
});
