-- =============================================================================
-- 20260830000012 — store_variants 가 미게시 상품을 내보내던 문제
-- =============================================================================
--
-- init.sql 은 "스토어 공개 읽기: 판매 중인 상품만"이라고 적고 `products_public_read`
-- 정책에 `status = 'active'` 를 걸었다. 그런데 스토어가 실제로 읽는 것은 정책이 아니라
-- `store_variants` 뷰이고, 이 뷰는 `security_invoker = off` 라 그 RLS를 **우회한다.**
-- 뷰의 where 절은 `v.active` 하나뿐이라 draft 상품의 옵션이 그대로 나갔다.
--
-- 확인 시점(2026-08-30)의 실제 상태: 상품 56개가 전부 draft 인데
-- 익명 요청이 store_variants 에서 756행을 읽을 수 있었다.
--
-- draft 는 "아직 팔 수 없는 것"이다 — 고시 항목과 스마트스토어 링크가 채워져야만
-- active 로 갈 수 있게 제약을 걸어 뒀는데(20260828000005 · 20260828000007),
-- 뷰가 그 게이트를 통째로 우회하고 있었다.
--
-- 뷰 정의는 20260828000007 과 같고 where 절에 한 줄만 더한다.
-- paused·archived 도 함께 빠진다 — 셋 다 "지금 파는 것이 아니다".
--
-- 브랜드 활성 여부(`brands.active`)는 여기서 보지 않는다. 상품 게시 게이트와 다른 축이고,
-- 지금 비활성 브랜드에는 상품이 없다. 필요해지면 별도 마이그레이션으로 다룬다.
-- =============================================================================

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
where v.active
  and p.status = 'active';   -- ← 게시 게이트. draft·paused·archived 는 스토어에 없다

grant select on store_variants to anon, authenticated;

comment on view store_variants is
  '스토어 노출용. 원가·마진·환율 제외, 게시(active)된 상품만. 스토어는 이 뷰로만 읽는다 (PROJECT.md §3.1).';
