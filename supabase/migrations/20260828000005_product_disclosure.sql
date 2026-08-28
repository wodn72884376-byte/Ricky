-- =============================================================================
-- 상품 정보 제공 고시 항목과 한국 정발가
--
-- PDP의 고시 표(전자상거래법 시행규칙)에서 네 항목이 계속 `상품 등록 시 입력`으로
-- 비어 있었다. 저장할 자리가 없었기 때문이다. 자리를 만들고,
-- **비어 있으면 판매를 시작할 수 없게** 제약으로 막는다.
--
-- 빈칸을 그럴듯한 문구로 메우는 것은 표시광고법 위반이므로, 지어내기보다
-- 게시를 막는 쪽을 택한다 (PROJECT.md §3.3 · CLAUDE.md 규칙 5).
-- =============================================================================

alter table products
  add column material     text,   -- 소재. 실물 라벨 표기를 그대로 옮긴다
  add column care         text,   -- 취급 시 주의사항
  add column manufacturer text,   -- 제조자 (브랜드 법인명)
  add column as_contact   text;   -- A/S 책임자 및 연락처

comment on column products.material is
  '실물 케어 라벨의 혼용률 표기를 그대로 옮긴다. 브랜드 웹사이트 설명으로 대체하지 않는다.';

-- 한국 정발가. 고객에게 보이는 비교가이며, 우리가 만든 할인이 아니라 실제 가격 차이다.
-- 원가·마진과 달리 고객 노출 대상이므로 store_variants에 태운다 (PROJECT.md §3.1 위반 아님).
alter table products
  add column kr_retail_krw integer check (kr_retail_krw > 0);

comment on column products.kr_retail_krw is
  '한국 공식 정발가(원). 확인된 경우에만 입력한다. 추정치를 넣지 않는다.';

-- 판매 개시 게이트: active 상태에는 고시 항목과 원산지가 모두 있어야 한다.
-- draft로는 얼마든지 저장할 수 있다 — 등록 도중에 막지 않는다.
alter table products
  add constraint products_disclosure_complete check (
    status <> 'active'
    or (
      origin_country is not null
      and material     is not null
      and care         is not null
      and manufacturer is not null
      and as_contact   is not null
    )
  );

-- 비교가를 스토어 뷰에 노출한다. 원가·마진율·환율은 여전히 새지 않는다.
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
