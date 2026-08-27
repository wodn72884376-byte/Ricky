-- =============================================================================
-- 내비게이션 개편에 필요한 두 축 (BEST · Men's · Women's)
--
--   1. 성별       products.gender — men / women / unisex
--   2. BEST 큐레이션 products.featured_rank — 수동 순서. 주문이 쌓이면 판매량 기준으로 전환한다
--
-- 유니섹스를 별도 값으로 둔 이유: 백팩·비니·장갑처럼 성별이 없는 품목이 아크테릭스에
-- 꽤 된다. 등록할 때 한쪽을 억지로 고르게 하면 고객은 반대쪽 탭에서 그 상품을 못 찾는다.
-- =============================================================================

create type product_gender as enum ('men', 'women', 'unisex');

alter table products
  add column gender product_gender not null default 'unisex';

comment on column products.gender is
  'unisex는 Men''s·Women''s 양쪽 목록에 모두 노출된다. 등록 시 실물 라벨 기준으로 고른다.';

-- BEST 큐레이션. null이면 BEST가 아니고, 값이 작을수록 앞에 온다.
-- 주문 데이터가 쌓이기 전까지 운영자가 직접 정한다 (docs/IA.md).
alter table products
  add column featured_rank integer check (featured_rank > 0);

create index products_featured_idx on products(featured_rank)
  where featured_rank is not null and status = 'active';

create index products_gender_category_idx on products(gender, category)
  where status = 'active';

-- 카테고리는 자유 문자열이었다. 내비게이션이 이 값으로 라우팅되므로 오타가 곧 404다.
-- 허용 집합을 제약으로 고정한다. 값을 늘리려면 이 제약과 내비게이션을 함께 고친다.
alter table products
  add constraint products_category_valid
  check (category in ('outerwear', 'top', 'bottom', 'bag', 'wallet', 'shoes', 'accessory'));

-- 스토어 노출 뷰에 성별·BEST를 태운다. 원가·마진은 여전히 새지 않는다 (PROJECT.md §3.1).
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
