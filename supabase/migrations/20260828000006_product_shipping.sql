-- =============================================================================
-- 상품별 배송비
--
-- 지금까지 배송비는 `quoteShipping()`이 무게·치수로 계산했다. 실제 운영은 그렇지 않다 —
-- 운영자가 상품마다 값을 정해 넣는다(2026-08-28). 그래서 저장할 자리를 만든다.
--
-- **비워 두면 계산값을 쓴다.** null은 "아직 안 정함"이지 "0원"이 아니므로
-- 0과 구분해야 한다 — 0원은 무료배송이라는 뜻이고, 그건 입력해서 정하는 값이다.
--
-- 원가·마진과 달리 고객에게 보여주는 값이므로 store_variants에 태운다 (PROJECT.md §3.1 위반 아님).
-- =============================================================================

alter table products
  add column shipping_krw integer check (shipping_krw >= 0);

comment on column products.shipping_krw is
  '이 상품 한 점을 보낼 때의 국제 배송비(원). null이면 무게·부피 기반 계산값을 쓴다. 0은 무료배송.';

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
