-- =============================================================================
-- 스마일리키 초기 스키마
-- 금액 규칙: KRW = integer(원 단위), CAD/USD = integer(cent 단위). float 사용 금지.
-- 정책 근거: PROJECT.md §3 (통관/가격), §6 (공급처 모니터링), §7 (데이터 모델)
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type product_status      as enum ('draft', 'active', 'paused', 'archived');
create type stock_type          as enum ('preheld', 'on_demand');          -- 선매입 / 주문매입
create type availability_state  as enum ('in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'unknown');
create type monitor_tier        as enum ('hot', 'normal', 'cold');
create type check_status        as enum ('ok', 'blocked', 'parse_error', 'not_found', 'network_error');
create type listing_event_type  as enum ('out_of_stock', 'restock', 'price_up', 'price_down',
                                         'sale_start', 'sale_end', 'origin_change', 'delisted');
create type order_status        as enum ('pending_payment', 'paid', 'sourcing', 'at_forwarder',
                                         'shipped', 'in_customs', 'delivered', 'cancelled', 'refunded');
create type customs_status      as enum ('not_started', 'list_clearance', 'formal_clearance', 'cleared', 'held');
create type purchase_source     as enum ('official_online', 'official_store', 'outlet', 'other');

-- ---------------------------------------------------------------------------
-- 공통: updated_at 자동 갱신
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 관리자 (고객/관리자 권한 분리)
-- ---------------------------------------------------------------------------
create table admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'operator' check (role in ('owner', 'operator')),
  created_at  timestamptz not null default now()
);

-- security definer: RLS 정책 내부에서 admin_users를 재귀 없이 조회하기 위함
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 고객
-- ---------------------------------------------------------------------------
create table customers (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger customers_touch before update on customers
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 브랜드 / 상품 / 옵션
-- ---------------------------------------------------------------------------
create table brands (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  official_site_url text,                        -- 캐나다(CA) 공식몰 URL
  monitor_adapter   text,                        -- 'arcteryx' | 'lululemon' | 'coach' ...
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create table products (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references brands(id) on delete restrict,
  name            text not null,                 -- 한국어 노출명
  name_en         text,
  slug            text not null unique,
  category        text not null,                 -- 'outerwear' | 'top' | 'bottom' | 'bag' | 'shoes' | 'accessory'
  hs_code         text,
  -- 원산지는 반드시 실물 라벨 기준. 브랜드 국적으로 추정 금지 (PROJECT.md §3.3)
  origin_country  char(2),                       -- ISO 3166-1 alpha-2
  -- CKFTA: Made in Canada만 관세 0% (부가세 10%는 별도 부과)
  ckfta_eligible  boolean generated always as (origin_country = 'CA') stored,
  description     text,
  images          jsonb not null default '[]'::jsonb,
  status          product_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_brand_idx  on products(brand_id);
create index products_status_idx on products(status);
create trigger products_touch before update on products
  for each row execute function touch_updated_at();

create table product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  sku            text not null unique,
  size           text,
  color          text,
  -- 원가(CAD cent). GST 5%·현지 핸들링 포함 후 값은 purchases에서 실측으로 갱신
  cost_cad_cents integer check (cost_cad_cents >= 0),
  -- 고객 노출 단일 판매가. 원가/마진/환율은 절대 고객 API로 내보내지 않는다 (§3.1)
  price_krw      integer check (price_krw >= 0),
  weight_g       integer check (weight_g >= 0),
  length_mm      integer check (length_mm >= 0),
  width_mm       integer check (width_mm >= 0),
  height_mm      integer check (height_mm >= 0),
  stock_type     stock_type not null default 'on_demand',
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_id, size, color)
);
create index variants_product_idx on product_variants(product_id);
create trigger variants_touch before update on product_variants
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 자체 재고 (선매입분)
-- ---------------------------------------------------------------------------
create table inventory (
  variant_id    uuid primary key references product_variants(id) on delete cascade,
  on_hand       integer not null default 0 check (on_hand >= 0),
  reserved      integer not null default 0 check (reserved >= 0),
  safety_stock  integer not null default 0 check (safety_stock >= 0),
  available     integer generated always as (on_hand - reserved) stored,
  location      text,
  updated_at    timestamptz not null default now()
);
create trigger inventory_touch before update on inventory
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 매입 (Principal 지위 근거: 자기 자본 선매입 기록)
-- ---------------------------------------------------------------------------
create table purchases (
  id                     uuid primary key default gen_random_uuid(),
  variant_id             uuid not null references product_variants(id) on delete restrict,
  qty                    integer not null check (qty > 0),
  unit_cost_cad_cents    integer not null check (unit_cost_cad_cents >= 0),  -- GST 제외 단가
  gst_cad_cents          integer not null default 0,                        -- 알버타: GST 5%만, PST 없음
  handling_fee_cad_cents integer not null default 0,                        -- 배대지 검수/재포장 $4~8
  source                 purchase_source not null default 'official_online',
  order_id               uuid,                                              -- 주문매입인 경우 연결 (FK는 아래에서 추가)
  purchased_at           timestamptz not null default now(),
  note                   text,
  created_at             timestamptz not null default now()
);
create index purchases_variant_idx on purchases(variant_id);

-- ---------------------------------------------------------------------------
-- 공급처 모니터링 (캐나다 공식몰) — PROJECT.md §6
-- ---------------------------------------------------------------------------
create table supplier_listings (
  id                     uuid primary key default gen_random_uuid(),
  variant_id             uuid not null references product_variants(id) on delete cascade,
  brand_id               uuid not null references brands(id) on delete restrict,
  product_url            text not null,
  supplier_sku           text,
  size_code              text,
  color_code             text,
  list_price_cad_cents   integer,   -- 정가
  current_price_cad_cents integer,  -- 현재가(세일 반영)
  on_sale                boolean not null default false,
  availability           availability_state not null default 'unknown',
  origin_country         char(2),   -- 공식몰 표기 원산지 (변경 감지용)
  tier                   monitor_tier not null default 'normal',
  last_checked_at        timestamptz,
  last_success_at        timestamptz,
  fail_count             integer not null default 0,
  active                 boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (variant_id, product_url)
);
create index listings_tier_checked_idx on supplier_listings(tier, last_checked_at) where active;
create index listings_brand_idx        on supplier_listings(brand_id);
create trigger listings_touch before update on supplier_listings
  for each row execute function touch_updated_at();

create table stock_checks (
  id             bigserial primary key,
  listing_id     uuid not null references supplier_listings(id) on delete cascade,
  checked_at     timestamptz not null default now(),
  status         check_status not null,
  availability   availability_state,
  price_cad_cents integer,
  on_sale        boolean,
  raw            jsonb,          -- 파싱 원본 스냅샷 (디버깅/증빙)
  duration_ms    integer
);
create index stock_checks_listing_idx on stock_checks(listing_id, checked_at desc);

create table listing_events (
  id           bigserial primary key,
  listing_id   uuid not null references supplier_listings(id) on delete cascade,
  type         listing_event_type not null,
  before       jsonb,
  after        jsonb,
  occurred_at  timestamptz not null default now(),
  action_taken text,            -- 자동 실행된 액션
  needs_review boolean not null default false,  -- 운영자 승인 대기 (가격 변동 등)
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id)
);
create index listing_events_review_idx on listing_events(needs_review, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 환율 — 관세 안내용(관세청 고시)과 원가 계산용(시장)을 분리 저장 (§5)
-- ---------------------------------------------------------------------------
create table fx_rates (
  id             bigserial primary key,
  pair           text not null,         -- 'CAD/KRW' | 'USD/KRW'
  rate           numeric(14,6) not null check (rate > 0),
  source         text not null,         -- 'customs_notice' | 'market'
  effective_date date not null,
  fetched_at     timestamptz not null default now(),
  unique (pair, source, effective_date)
);

-- ---------------------------------------------------------------------------
-- 주문 — DDU. 판매가에 한국 관세·부가세 미포함 (§2)
-- ---------------------------------------------------------------------------
create table orders (
  id                        uuid primary key default gen_random_uuid(),
  order_no                  text not null unique,
  customer_id               uuid references customers(id) on delete set null,
  status                    order_status not null default 'pending_payment',

  -- 수취인 / 통관 정보
  receiver_name             text not null,
  receiver_phone            text not null,
  postcode                  text not null,
  address1                  text not null,
  address2                  text,
  -- 개인통관고유부호: P + 12자리. 민감정보이므로 로그/에러리포트에 남기지 않는다.
  pccc                      text not null check (pccc ~ '^P[0-9]{12}$'),

  -- 금액 (KRW 정수)
  subtotal_krw              integer not null check (subtotal_krw >= 0),
  shipping_krw              integer not null default 0 check (shipping_krw >= 0),
  discount_krw              integer not null default 0 check (discount_krw >= 0),
  total_krw                 integer not null check (total_krw >= 0),

  -- 주문 시점 환율 스냅샷 (정산·마진 계산 기준)
  fx_cad_krw                numeric(14,6),   -- 원가 환산용 시장환율
  fx_usd_krw_customs        numeric(14,6),   -- USD 150 판정용 관세청 고시환율
  declared_value_usd_cents  integer,         -- 판정 시점 신고가(참고치)
  duty_free_expected        boolean,         -- 목록통관 예상 여부

  -- Stripe (KRW는 zero-decimal: amount에 원 단위 정수 그대로)
  stripe_checkout_session_id text,
  stripe_payment_intent_id   text,
  paid_at                   timestamptz,

  placed_at                 timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id, placed_at desc);
create index orders_status_idx   on orders(status);
create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

alter table purchases
  add constraint purchases_order_fk foreign key (order_id) references orders(id) on delete set null;

create table order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references orders(id) on delete cascade,
  variant_id            uuid not null references product_variants(id) on delete restrict,
  qty                   integer not null check (qty > 0),
  -- 통합 단일가. "상품원가 + 대행수수료" 분리 저장/청구 금지 (§3.1)
  unit_price_krw        integer not null check (unit_price_krw >= 0),
  cost_snapshot_cad_cents integer,          -- 관리자 전용 마진 계산용
  product_name_snapshot text not null,
  option_snapshot       text,
  origin_snapshot       char(2),
  created_at            timestamptz not null default now()
);
create index order_items_order_idx on order_items(order_id);

create table shipments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  carrier             text,                    -- 'LTC' | 'jeil' ...
  tracking_no         text,
  actual_weight_g     integer,
  volumetric_weight_g integer,
  chargeable_weight_g integer,                 -- max(실무게, 부피무게)
  oversize            boolean not null default false,  -- 최장변 1m 초과 할증
  shipping_cost_cad_cents integer,
  customs_state       customs_status not null default 'not_started',
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index shipments_order_idx on shipments(order_id);
create trigger shipments_touch before update on shipments
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 설정 (마진율, 배송요금표, 관세율표, 폴링 주기, 신선도 임계시간)
-- ---------------------------------------------------------------------------
create table settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on settings
  for each row execute function touch_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table admin_users        enable row level security;
alter table customers          enable row level security;
alter table brands             enable row level security;
alter table products           enable row level security;
alter table product_variants   enable row level security;
alter table inventory          enable row level security;
alter table purchases          enable row level security;
alter table supplier_listings  enable row level security;
alter table stock_checks       enable row level security;
alter table listing_events     enable row level security;
alter table fx_rates           enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table shipments          enable row level security;
alter table settings           enable row level security;

-- 관리자: 전 테이블 전권
do $$
declare t text;
begin
  foreach t in array array[
    'admin_users','customers','brands','products','product_variants','inventory',
    'purchases','supplier_listings','stock_checks','listing_events','fx_rates',
    'orders','order_items','shipments','settings'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t);
  end loop;
end $$;

-- 스토어 공개 읽기: 판매 중인 상품만. 원가/마진 컬럼은 뷰(§ store_variants)로만 노출한다.
create policy brands_public_read on brands
  for select to anon, authenticated using (active);

create policy products_public_read on products
  for select to anon, authenticated using (status = 'active');

create policy variants_public_read on product_variants
  for select to anon, authenticated
  using (active and exists (select 1 from products p where p.id = product_id and p.status = 'active'));

-- 고객 본인 데이터
create policy customers_self on customers
  for select to authenticated using (id = auth.uid());
create policy customers_self_update on customers
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy orders_self_read on orders
  for select to authenticated using (customer_id = auth.uid());

create policy order_items_self_read on order_items
  for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

create policy shipments_self_read on shipments
  for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- inventory / supplier_listings / purchases / stock_checks / listing_events / settings /
-- fx_rates 는 관리자 정책만 존재 → 고객에게 비공개.
-- 스토어의 재고 가용성은 아래 뷰를 통해서만 노출한다.

-- =============================================================================
-- 스토어 노출용 뷰 — 원가·마진·환율을 제외하고, 재고 신선도 게이트를 적용 (§6.5)
-- =============================================================================
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
left join inventory i on i.variant_id = v.id
where v.active;

grant select on store_variants to anon, authenticated;
