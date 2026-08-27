-- =============================================================================
-- IA 설계에서 드러난 스키마 갭 해소 (docs/IA.md §5)
--
--  5-1  게스트 주문에 연락 수단이 없다        → orders.contact_email
--  5-2  주문번호가 순차면 열거 공격에 취약    → next_order_no() + 조회 시도 로그
--  5-3  문의 저장소가 없다                    → inquiries / inquiry_replies
--  5-4  찜·재입고 알림 저장소가 없다          → wishlists / restock_alerts
--  5-5  검수 사진·리뷰가 없다                 → inspection_photos / reviews
--
-- 금액 규칙은 init과 동일: KRW = 정수(원), CAD/USD = 정수(cent).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5-1. 게스트 주문 연락 수단
--
-- 비회원 주문을 허용하므로(docs/IA.md 확정 전제) 주문 확인·발송 알림을 보낼 곳이
-- 필요하다. 회원 주문은 customers.email로 대체 가능하므로 nullable로 두되,
-- "둘 중 하나는 반드시 있다"를 제약으로 강제한다.
-- ---------------------------------------------------------------------------
alter table orders
  add column contact_email text
    check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table orders
  add constraint orders_contact_reachable
    check (contact_email is not null or customer_id is not null);

comment on column orders.contact_email is
  '게스트 주문의 연락 수단. 회원 주문이면 null 가능(customers.email 사용). 둘 다 null 금지.';

create index orders_contact_email_idx on orders(lower(contact_email));

-- ---------------------------------------------------------------------------
-- 5-2. 추측 불가능한 주문번호
--
-- /orders/lookup 은 주문번호 + 연락처로 조회한다. 주문번호가 순차(R-000001)면
-- 열거 공격으로 타인 주문의 존재와 연락처 일치 여부를 캐낼 수 있다.
--
-- 형식: R + YYMMDD + '-' + 6자
-- 문자셋: Crockford Base32 (I·L·O·U 제외 — 손으로 옮겨 적을 때 혼동 방지).
--         32자이므로 256 % 32 = 0 → gen_random_bytes 모듈로 편향이 없다.
-- 공간: 32^6 ≈ 10.7억 / 일
-- ---------------------------------------------------------------------------
create or replace function public.generate_order_no()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes    bytea := gen_random_bytes(6);
  suffix   text := '';
  i        int;
begin
  for i in 1..6 loop
    suffix := suffix || substr(alphabet, 1 + (get_byte(bytes, i - 1) % 32), 1);
  end loop;
  return 'R' || to_char(now() at time zone 'utc', 'YYMMDD') || '-' || suffix;
end $$;

-- 충돌 시 재시도. unique 제약에 부딪혀 INSERT가 실패하는 일이 없도록 한다.
create or replace function public.next_order_no()
returns text language plpgsql volatile as $$
declare
  candidate text;
  tries     int := 0;
begin
  loop
    candidate := generate_order_no();
    exit when not exists (select 1 from orders where order_no = candidate);
    tries := tries + 1;
    if tries > 10 then
      raise exception '주문번호 생성 실패: 10회 연속 충돌';
    end if;
  end loop;
  return candidate;
end $$;

alter table orders alter column order_no set default next_order_no();

-- 조회 시도 로그 — 서버리스 환경에서 rate limit의 근거가 된다.
-- 원문 IP는 저장하지 않는다(개인정보). 애플리케이션이 salt와 함께 해시해 넣는다.
create table order_lookup_attempts (
  id                 bigserial primary key,
  attempted_at       timestamptz not null default now(),
  ip_hash            text,
  order_no_attempted text,
  succeeded          boolean not null
);
create index order_lookup_attempts_idx on order_lookup_attempts(ip_hash, attempted_at desc);

comment on table order_lookup_attempts is
  '비회원 주문조회 열거 공격 방어용. 실패 응답은 사유를 구분하지 않는다(docs/IA.md §5-2).';

-- ---------------------------------------------------------------------------
-- 5-3. 문의 (자사몰만 운영하므로 필수 동선)
-- ---------------------------------------------------------------------------
create type inquiry_status as enum ('open', 'answered', 'closed');

create or replace function public.generate_ticket_no()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes    bytea := gen_random_bytes(5);
  suffix   text := '';
  i        int;
begin
  for i in 1..5 loop
    suffix := suffix || substr(alphabet, 1 + (get_byte(bytes, i - 1) % 32), 1);
  end loop;
  return 'Q' || to_char(now() at time zone 'utc', 'YYMMDD') || '-' || suffix;
end $$;

create table inquiries (
  id            uuid primary key default gen_random_uuid(),
  ticket_no     text not null unique default generate_ticket_no(),
  customer_id   uuid references customers(id) on delete set null,
  contact_email text not null
    check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  order_id      uuid references orders(id) on delete set null,
  category      text not null default 'general'
    check (category in ('general', 'order', 'shipping', 'customs', 'sizing', 'return')),
  subject       text not null check (length(subject) between 1 and 200),
  body          text not null check (length(body) between 1 and 5000),
  status        inquiry_status not null default 'open',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index inquiries_status_idx on inquiries(status, created_at desc);
create trigger inquiries_touch before update on inquiries
  for each row execute function touch_updated_at();

create table inquiry_replies (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references inquiries(id) on delete cascade,
  author      text not null check (author in ('customer', 'operator')),
  body        text not null check (length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);
create index inquiry_replies_idx on inquiry_replies(inquiry_id, created_at);

-- ---------------------------------------------------------------------------
-- 5-4. 찜 · 재입고 알림
--
-- 재입고 알림은 비회원도 신청할 수 있어야 한다(품절 카드의 고스트 CTA).
-- 찜은 회원 전용이다 — 저장할 주체가 없으면 의미가 없다.
-- ---------------------------------------------------------------------------
create table wishlists (
  customer_id uuid not null references customers(id) on delete cascade,
  variant_id  uuid not null references product_variants(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (customer_id, variant_id)
);

create table restock_alerts (
  id            uuid primary key default gen_random_uuid(),
  variant_id    uuid not null references product_variants(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  contact_email text not null
    check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  created_at    timestamptz not null default now(),
  notified_at   timestamptz,
  unique (variant_id, contact_email)
);
create index restock_alerts_pending_idx on restock_alerts(variant_id) where notified_at is null;

-- ---------------------------------------------------------------------------
-- 5-5. 검수 사진 · 후기
--
-- 검수 사진은 이 브랜드의 신뢰 증명 수단이다(PRODUCT.md 설계원칙 1).
-- 영수증·인보이스는 금액과 개인정보 마스킹을 거친 뒤에만 공개한다.
-- ---------------------------------------------------------------------------
create type inspection_kind as enum
  ('tag', 'serial', 'size_label', 'stitching', 'packaging', 'receipt', 'invoice', 'other');

create table inspection_photos (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade,
  variant_id   uuid references product_variants(id) on delete set null,
  kind         inspection_kind not null,
  storage_path text not null,                 -- Supabase Storage 경로
  caption      text,
  shot_at      timestamptz not null default now(),
  -- 영수증·인보이스는 마스킹 확인 전까지 공개하지 않는다
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  check (order_id is not null or variant_id is not null)
);
create index inspection_photos_order_idx   on inspection_photos(order_id);
create index inspection_photos_public_idx  on inspection_photos(variant_id) where is_public;

create type review_status as enum ('pending', 'published', 'hidden');

-- order_item_id 참조가 "구매 확인된 후기만 존재한다"를 강제한다.
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references order_items(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  rating        smallint not null check (rating between 1 and 5),
  body          text not null check (length(body) between 1 and 2000),
  photos        jsonb not null default '[]'::jsonb,
  status        review_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index reviews_published_idx on reviews(status, created_at desc);
create trigger reviews_touch before update on reviews
  for each row execute function touch_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table order_lookup_attempts enable row level security;
alter table inquiries             enable row level security;
alter table inquiry_replies       enable row level security;
alter table wishlists             enable row level security;
alter table restock_alerts        enable row level security;
alter table inspection_photos     enable row level security;
alter table reviews               enable row level security;

-- 관리자 전권
do $$
declare t text;
begin
  foreach t in array array[
    'order_lookup_attempts','inquiries','inquiry_replies','wishlists',
    'restock_alerts','inspection_photos','reviews'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t);
  end loop;
end $$;

-- 문의: 누구나 접수할 수 있다. 조회는 공개하지 않는다 —
-- 접수번호+이메일 확인은 security definer RPC를 통해서만 이뤄진다(열거 방지).
create policy inquiries_public_insert on inquiries
  for insert to anon, authenticated with check (true);

create policy inquiries_self_read on inquiries
  for select to authenticated using (customer_id = auth.uid());

create policy inquiry_replies_self_read on inquiry_replies
  for select to authenticated
  using (exists (select 1 from inquiries i where i.id = inquiry_id and i.customer_id = auth.uid()));

-- 재입고 알림: 비회원 신청 허용. 조회는 비공개(이메일 목록이 새면 안 된다).
create policy restock_alerts_public_insert on restock_alerts
  for insert to anon, authenticated with check (true);

-- 찜: 본인 것만
create policy wishlists_self_all on wishlists
  for all to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- 검수 사진: 공개 표시된 것만 스토어에 노출. 주문 소유자는 자기 주문분 전체를 본다.
create policy inspection_photos_public_read on inspection_photos
  for select to anon, authenticated using (is_public);

create policy inspection_photos_owner_read on inspection_photos
  for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- 후기: 게시된 것만 공개. 작성은 자기 주문 항목에 대해서만.
create policy reviews_public_read on reviews
  for select to anon, authenticated using (status = 'published');

create policy reviews_self_read on reviews
  for select to authenticated using (customer_id = auth.uid());

create policy reviews_self_insert on reviews
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from order_items oi
      join orders o on o.id = oi.order_id
      where oi.id = order_item_id and o.customer_id = auth.uid()
    )
  );

-- order_lookup_attempts 는 관리자 정책만 존재 → 서비스 역할과 운영자만 접근.
