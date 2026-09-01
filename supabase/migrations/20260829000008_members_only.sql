-- =============================================================================
-- 회원 전용 전환 + 소셜 로그인
--
-- 결정 (2026-08-29):
--   1. 비회원 주문을 없앤다. 주문·문의·재입고 알림 전부 로그인이 필요하다.
--   2. 로그인은 소셜만 — 구글 · 네이버 · 카카오. 매직링크(이메일 OTP)는 쓰지 않는다.
--
-- 이 마이그레이션이 푸는 문제는 셋이다.
--
--  A. `customers` 행을 만드는 주체가 없었다.
--     `orders.customer_id → customers.id → auth.users.id` 인데, 가입 시 `customers`에
--     행을 넣는 트리거가 없어서 로그인해도 주문이 불가능했다. 매직링크 시절에도 같은
--     구멍이었고, 회원 전용이 되면서 **모든 주문의 전제**가 되므로 여기서 막는다.
--
--  B. 네이버는 이메일을 안 줄 수 있다.
--     네이버 OIDC 디스커버리의 `scopes_supported` 는 `["openid","profile"]` 뿐이고
--     `subject_types_supported` 는 `pairwise` 다. 즉 `auth.users.email` 이 null 인
--     회원이 생긴다. `customers.email` 의 not null 을 풀고, **주문 시점에 받는**
--     `orders.contact_email` 을 필수로 올린다 — 연락 수단은 주문마다 확정돼야 한다.
--
--  C. 게스트 조회 경로가 남아 있었다.
--     `/orders/lookup` 과 그 열거 공격 방어 로그(`order_lookup_attempts`)는
--     비회원 주문이 있을 때만 의미가 있다. 함께 걷어낸다.
--
-- 추측 불가능한 주문번호(`next_order_no`)는 **남긴다.** 회원 전용이 되어도 주문번호는
-- 메일·택배 송장에 찍혀 밖으로 나가므로 순차값이면 안 된다.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. 가입 시 customers 행 생성
--
-- security definer 로 둔다 — auth.users 트리거는 인증 이전 컨텍스트에서 돌아
-- RLS 를 통과할 주체가 없다. search_path 를 고정해 함수 탈취를 막는다.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (id, email, name)
  values (
    new.id,
    new.email,   -- 네이버는 null 일 수 있다 (B)
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nickname'
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- B. 이메일이 없는 회원을 허용한다
-- ---------------------------------------------------------------------------
alter table customers alter column email drop not null;

comment on column customers.email is
  '소셜 계정이 준 이메일. 네이버는 제공하지 않을 수 있어 null 이다. '
  '연락 수단이 필요한 곳은 orders.contact_email 을 쓴다.';

-- ---------------------------------------------------------------------------
-- C. 주문: 회원 전용
--
-- customer_id 를 not null 로 올리므로 `on delete set null` 은 성립하지 않는다.
-- `restrict` 로 바꾼다 — 주문 기록이 있는 회원은 지워지지 않는다(전자상거래법상
-- 거래 기록은 5년 보존 대상이다).
-- ---------------------------------------------------------------------------
alter table orders drop constraint orders_contact_reachable;
alter table orders drop constraint orders_customer_id_fkey;
alter table orders alter column customer_id set not null;
alter table orders add constraint orders_customer_id_fkey
  foreign key (customer_id) references customers(id) on delete restrict;

alter table orders alter column contact_email set not null;

comment on column orders.contact_email is
  '이 주문의 연락 수단. 주문 폼에서 직접 받는다 — 소셜 계정이 이메일을 주지 않을 수 있고, '
  '계정 이메일과 받을 곳이 다를 수도 있다.';

-- 비회원 주문조회 열거 공격 방어 로그. 조회 경로 자체가 사라져 쓰임이 없다.
drop table order_lookup_attempts;

-- ---------------------------------------------------------------------------
-- C. 문의: 회원 전용
-- ---------------------------------------------------------------------------
alter table inquiries drop constraint inquiries_customer_id_fkey;
alter table inquiries alter column customer_id set not null;
alter table inquiries add constraint inquiries_customer_id_fkey
  foreign key (customer_id) references customers(id) on delete cascade;

drop policy inquiries_public_insert on inquiries;
create policy inquiries_self_insert on inquiries
  for insert to authenticated with check (customer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- C. 재입고 알림: 회원 전용
--
-- 중복 방지 키를 (variant, 이메일) 에서 (variant, 회원) 으로 옮긴다.
-- 이메일이 없는 회원이 생기므로 이메일은 더 이상 신원이 될 수 없다.
-- ---------------------------------------------------------------------------
alter table restock_alerts drop constraint restock_alerts_customer_id_fkey;
alter table restock_alerts alter column customer_id set not null;
alter table restock_alerts add constraint restock_alerts_customer_id_fkey
  foreign key (customer_id) references customers(id) on delete cascade;

alter table restock_alerts drop constraint restock_alerts_variant_id_contact_email_key;
alter table restock_alerts add constraint restock_alerts_variant_id_customer_id_key
  unique (variant_id, customer_id);
alter table restock_alerts alter column contact_email drop not null;

drop policy restock_alerts_public_insert on restock_alerts;
create policy restock_alerts_self_all on restock_alerts
  for all to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());
