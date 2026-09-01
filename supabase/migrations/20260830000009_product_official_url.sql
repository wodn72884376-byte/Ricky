-- =============================================================================
-- 상품별 공식몰 URL
--
-- `brands.official_site_url` 은 브랜드 홈페이지라 목록에서 같은 주소가 반복된다.
-- 운영자가 원가나 재고를 대조할 때 필요한 건 **그 상품의 페이지**다
-- (`https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868`).
--
-- `supplier_listings.product_url` 에도 같은 성격의 값이 있지만 그건 variant 단위이고
-- 재고 수집기가 채운다. 수집 전에도, 감시 대상이 아닌 상품에도 주소는 있어야 하므로
-- 상품 단위로 따로 둔다.
--
-- **없으면 null 이다.** 캐나다구스는 아직 공식몰 URL 을 해석하지 않았다.
-- 브랜드 홈 주소로 대신 채워 넣지 않는다 — 그러면 "이 상품 페이지"와 "그냥 브랜드 홈"이
-- 구분되지 않는다. 화면에서 갈라 보여준다.
-- =============================================================================

alter table products
  add column official_url text
    check (official_url is null or official_url ~ '^https://');

comment on column products.official_url is
  '이 상품의 브랜드 공식몰 페이지. 없으면 null — 브랜드 홈 주소로 대신 채우지 않는다.';
