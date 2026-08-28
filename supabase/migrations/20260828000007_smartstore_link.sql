-- =============================================================================
-- 결제를 스마트스토어로 넘긴다
--
-- 자체 결제(Stripe)를 붙이지 않고, 상품마다 네이버 스마트스토어 상품 URL을 두고
-- PDP의 구매 버튼이 그 페이지로 보낸다 (2026-08-28 운영자 결정).
--
-- 결제·정산·개인통관고유부호 수집·주문 관리가 전부 스마트스토어 안에서 일어나므로
-- 이 데이터베이스의 orders / order_items는 당분간 쓰이지 않는다. 지우지는 않는다 —
-- 자체 결제로 돌아올 때 스키마를 다시 만들 이유가 없다.
--
-- **합포장이 없다.** 한 번에 한 상품만 주문할 수 있으므로 장바구니 개념 자체가 없다.
-- =============================================================================

alter table products
  add column smartstore_url text
    check (smartstore_url is null or smartstore_url ~ '^https://(smartstore|brand)\.naver\.com/');

comment on column products.smartstore_url is
  '네이버 스마트스토어 상품 상세 URL. 이 값이 없으면 살 수 있는 경로가 없으므로 게시할 수 없다.';

-- 판매 개시 게이트에 구매 경로를 더한다.
-- 고시 항목과 같은 이유다 — 살 수 없는 상품을 판매 중으로 두지 않는다.
alter table products
  drop constraint products_disclosure_complete;

alter table products
  add constraint products_disclosure_complete check (
    status <> 'active'
    or (
      origin_country  is not null
      and material     is not null
      and care         is not null
      and manufacturer is not null
      and as_contact   is not null
      and smartstore_url is not null
    )
  );

drop view if exists store_variants;

create or replace view store_variants
with (security_invoker = off) as
select
  v.id                as variant_id,
  v.product_id,
  v.sku,
  v.size,
  v.color,
  v.price_krw,
  p.kr_retail_krw,
  p.shipping_krw,
  p.smartstore_url,
  v.stock_type,
  p.gender,
  p.category,
  p.featured_rank,
  case
    when v.stock_type = 'preheld' then coalesce(i.available, 0) > 0
    else exists (
      select 1 from supplier_listings sl
      where sl.variant_id = v.id
        and sl.active
        and sl.availability in ('in_stock', 'low_stock')
        and sl.last_success_at > now() - (
          coalesce((select (value->>'hours')::int from settings where key = 'stock_freshness'), 6) || ' hours'
        )::interval
    )
  end as purchasable,
  case
    when v.stock_type = 'preheld' then null
    else (select max(sl.last_success_at) from supplier_listings sl where sl.variant_id = v.id and sl.active)
  end as supplier_checked_at
from product_variants v
join products p on p.id = v.product_id
left join inventory i on i.variant_id = v.id
where v.active;

grant select on store_variants to anon, authenticated;
