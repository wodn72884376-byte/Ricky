-- =============================================================================
-- 20260830000013 — 구매 경로를 색상 단위로 내린다
-- =============================================================================
--
-- 지금은 상품 하나에 스마트스토어 주소 하나다. 그래서 고객이 우리 PDP 에서 색상과
-- 사이즈를 고르고 넘어가면 **스마트스토어에서 색을 다시 골라야 한다.**
-- 우리가 아는 값을 URL 로 넘길 방법이 없어서 생기는 마찰이다 — 스마트스토어 상품 URL 은
-- 옵션을 실어 나를 파라미터가 없고, 주문서로 바로 보내는 공개 링크도 없다.
--
-- 신고·심사 없이 이걸 줄이는 방법은 하나뿐이다: **스토어에 색상마다 상품을 따로 등록하고,
-- 색상별 주소를 여기 둔다.** 그러면 고객이 다시 고를 것은 사이즈 하나로 줄어든다.
--
-- 20260830000010(product_variants.official_url)과 같은 모양이다. 한쪽은 "원본이 어디 있나",
-- 이쪽은 "어디서 사나"일 뿐 구조가 같다.
-- =============================================================================

alter table product_variants
  add column smartstore_url text
    check (smartstore_url is null or smartstore_url ~ '^https://(smartstore|brand)\.naver\.com/');

comment on column product_variants.smartstore_url is
  '이 색상만의 스마트스토어 상품 URL. null 이면 products.smartstore_url 로 떨어진다.';

-- ---------------------------------------------------------------------------
-- 뷰: 옵션 주소가 있으면 그것이 이긴다.
--
-- **게시 게이트는 그대로 상품 단위에 남는다** (products_disclosure_complete).
-- 상품 주소가 반드시 있으므로 폴백이 비는 경우가 없다 — 즉 게시된 상품의 모든 옵션에는
-- 언제나 살 수 있는 경로가 있다.
--
-- 다만 색상별로 등록해 놓고 일부 색만 채우면, 안 채운 색은 상품 주소(= 어느 한 색의 페이지)로
-- 떨어진다. 그건 "다른 색 페이지로 보내는" 것이라 조용히 두면 안 된다 —
-- /admin 의 `구매 경로` 열이 옵션/상품 중 어느 쪽인지 밝히고, PDP 는 그때 문구를 바꾼다.
-- ---------------------------------------------------------------------------
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
  coalesce(v.smartstore_url, p.smartstore_url) as smartstore_url,
  -- 스토어가 "이 색 전용 주소인가"를 알아야 안내 문구를 정할 수 있다
  (v.smartstore_url is not null)               as smartstore_url_is_variant,
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
  and p.status = 'active';   -- 게시 게이트 (20260830000012)

grant select on store_variants to anon, authenticated;

comment on view store_variants is
  '스토어 노출용. 원가·마진·환율 제외, 게시(active)된 상품만. 스토어는 이 뷰로만 읽는다 (PROJECT.md §3.1).';
