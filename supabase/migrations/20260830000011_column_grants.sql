-- =============================================================================
-- 20260830000011 — 원가·환율 컬럼을 고객 롤에서 실제로 차단한다 (CLAUDE.md 규칙 1)
-- =============================================================================
--
-- 문제. RLS는 **행** 단위다. 행이 통과하면 그 행의 모든 컬럼이 함께 나간다.
-- 그래서 아래 네 정책은 원가·환율을 고객에게 열어 두고 있었다:
--
--   variants_public_read    anon 에게 판매 중인 variant 전체 → cost_cad_cents
--   orders_self_read        본인 주문 전체                   → fx_cad_krw
--   order_items_self_read   본인 주문 품목 전체              → cost_snapshot_cad_cents
--   shipments_self_read     본인 배송 전체                   → shipping_cost_cad_cents
--
-- init.sql 은 "원가/마진 컬럼은 뷰(store_variants)로만 노출한다"고 적었지만
-- **기반 테이블 자체를 닫지 않아서** `/rest/v1/product_variants?select=cost_cad_cents`
-- 한 줄이면 익명으로 전 상품 원가를 읽을 수 있었다.
--
-- 해법은 두 겹이다.
--   (1) 컬럼 단위 grant — 고객 롤에 원가·환율 컬럼을 아예 주지 않는다
--   (2) product_variants 는 공개 정책 자체를 없앤다 — 스토어는 store_variants 뷰로만 읽는다
--
-- **관리자도 `authenticated` 롤이다.** 컬럼 grant 는 롤 단위라 둘을 구분하지 못한다.
-- 그래서 원가가 필요한 관리자 경로는 앞으로 `createAdminClient()`(service_role)를 쓴다.
-- 지금 관리자 화면이 원가를 읽는 곳은 product_variants 뿐이고, 그 테이블은 (2)로
-- 처리하므로 `authenticated` 의 컬럼 권한을 건드리지 않는다.
-- =============================================================================


-- ── (1) 주문 계열: 원가·환율 컬럼만 빼고 다시 준다 ───────────────────────────
--
-- 컬럼을 하나하나 적지 않고 카탈로그에서 뽑는다. 손으로 적으면 열 개 중 하나를
-- 빠뜨렸을 때 고객 주문 조회가 조용히 permission denied 로 죽는다.
--
-- **주의: 이 grant 는 마이그레이션 시점의 스냅샷이다.** 나중에 이 세 테이블에
-- 컬럼을 추가하면 그 컬럼은 grant 되지 않아 `select` 가 실패한다. 컬럼을 추가하는
-- 마이그레이션은 grant 도 함께 써야 한다 — `schema.test.ts` 가 이걸 검사한다.
do $$
declare
  target record;
  cols   text;
begin
  for target in
    select * from (values
      ('orders',      array['fx_cad_krw']),                 -- 원가 환산용 시장환율
      ('order_items', array['cost_snapshot_cad_cents']),    -- 마진 계산용 원가 스냅샷
      ('shipments',   array['shipping_cost_cad_cents'])     -- 실제 지불한 국제 운임
    ) as t(tbl, secret)
  loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
      into cols
      from information_schema.columns
     where table_schema = 'public'
       and table_name   = target.tbl
       and column_name <> all (target.secret);

    -- anon 은 다시 주지 않는다. 이 세 테이블에 비로그인 접근 정책은 없다.
    execute format('revoke select on public.%I from anon, authenticated', target.tbl);
    execute format('grant select (%s) on public.%I to authenticated', cols, target.tbl);
  end loop;
end $$;


-- ── (2) product_variants: 스토어는 뷰로만 읽는다 ────────────────────────────
--
-- 관리자는 원가 컬럼이 필요하므로 `authenticated` 의 테이블 권한은 남긴다.
-- 대신 공개 읽기 **정책**을 없애서 관리자가 아닌 로그인 사용자는 한 행도 못 본다
-- (`product_variants_admin_all` 만 남는다).
--
-- store_variants 뷰는 `security_invoker = off` 라 소유자 권한으로 돌기 때문에
-- 이 정책을 없애도 그대로 동작한다 — 스토어가 보는 경로는 그쪽이다.
drop policy if exists variants_public_read on public.product_variants;

-- anon 은 뷰만 있으면 되므로 기반 테이블 권한을 회수한다.
-- 정책이 사라져 이미 0행이지만, 나중에 누가 정책을 다시 만들어도 원가는 못 읽게 한다.
revoke select on public.product_variants from anon;

comment on column public.product_variants.cost_cad_cents is
  '원가(CAD cent). 관리자 전용 — anon 은 테이블 권한 없음, 고객은 정책상 0행. 스토어는 store_variants 뷰를 쓴다.';
comment on column public.orders.fx_cad_krw is
  '원가 환산용 시장환율. 관리자 전용 — authenticated 에 컬럼 grant 없음 (20260830000011).';
comment on column public.order_items.cost_snapshot_cad_cents is
  '마진 계산용 원가 스냅샷. 관리자 전용 — authenticated 에 컬럼 grant 없음 (20260830000011).';
comment on column public.shipments.shipping_cost_cad_cents is
  '실제 지불 국제 운임(CAD cent). 관리자 전용 — authenticated 에 컬럼 grant 없음 (20260830000011).';
