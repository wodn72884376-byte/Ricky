-- =============================================================================
-- 20260831000015 — 스마트스토어 URL 없이도 게시할 수 있게 한다
-- =============================================================================
--
-- 20260828000007 이 게시 게이트에 `smartstore_url is not null` 을 더했다.
-- 근거는 "살 수 없는 상품을 판매 중으로 두지 않는다" 였고, 그 자체는 옳다.
--
-- 그런데 스마트스토어 개설 전이라 URL 이 63개 전부 비어 있고, 그래서 **아무것도
-- 게시할 수 없다.** 게시가 없으면 `store_variants` 가 비고, 재고 수집이 DB 까지
-- 들어와도 화면에 닿지 못한다 — 재고 연동 전체가 URL 하나에 막힌 상태다.
--
-- 살 수 없다는 사실은 이미 화면이 정직하게 말한다. 상품 상세는 구매 경로가 없으면
-- `바로 구매` 를 그리지 않고 "아직 판매를 준비하고 있어요" 와 1:1 문의를 보여 준다
-- (product-options.tsx). 없는 버튼을 있는 척하지 않으므로, 게시해도 고객을 속이지 않는다.
--
-- 고시 항목(원산지·소재·취급주의·제조자·A/S)은 그대로 요구한다. 그건 법이 요구하는
-- 표기이고 화면이 대신 말해 줄 수 있는 것이 아니다.
--
-- 되돌리려면 `and smartstore_url is not null` 한 줄을 다시 넣으면 된다.
-- =============================================================================

alter table products
  drop constraint products_disclosure_complete;

alter table products
  add constraint products_disclosure_complete check (
    status <> 'active'
    or (
      origin_country   is not null
      and material     is not null
      and care         is not null
      and manufacturer is not null
      and as_contact   is not null
    )
  );

comment on constraint products_disclosure_complete on products is
  '게시(active) 상품은 전자상거래 고시 항목을 모두 채워야 한다. 구매 경로(smartstore_url)는 '
  '요구하지 않는다 — 없으면 화면이 "판매 준비 중"으로 정직하게 표시한다(20260831000015).';
