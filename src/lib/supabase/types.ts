/**
 * Supabase 데이터베이스 타입.
 *
 * 현재는 supabase/migrations 를 기준으로 손으로 유지한다.
 * Supabase 프로젝트를 연결한 뒤에는 아래 명령으로 자동 생성본으로 교체할 것:
 *   npm run db:types
 *
 * 규칙: KRW는 정수(원), CAD/USD는 정수(cent). 금액에 number 소수 사용 금지.
 */

export type ProductStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ProductGender = 'men' | 'women' | 'unisex';
/** 내비게이션이 이 값으로 라우팅된다. DB에 check 제약이 걸려 있다. */
export type ProductCategory =
  | 'outerwear' | 'top' | 'bottom' | 'bag' | 'wallet' | 'shoes' | 'accessory';
export type StockType = 'preheld' | 'on_demand';
export type AvailabilityState = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'unknown';
export type MonitorTier = 'hot' | 'normal' | 'cold';
export type CheckStatus = 'ok' | 'blocked' | 'parse_error' | 'not_found' | 'network_error';
export type ListingEventType =
  | 'out_of_stock' | 'restock' | 'price_up' | 'price_down'
  | 'sale_start' | 'sale_end' | 'origin_change' | 'delisted';
export type OrderStatus =
  | 'pending_payment' | 'paid' | 'sourcing' | 'at_forwarder'
  | 'shipped' | 'in_customs' | 'delivered' | 'cancelled' | 'refunded';
export type CustomsStatus = 'not_started' | 'list_clearance' | 'formal_clearance' | 'cleared' | 'held';
export type PurchaseSource = 'official_online' | 'official_store' | 'outlet' | 'other';
export type InquiryStatus = 'open' | 'answered' | 'closed';
export type InquiryCategory = 'general' | 'order' | 'shipping' | 'customs' | 'sizing' | 'return';
export type InspectionKind =
  | 'tag' | 'serial' | 'size_label' | 'stitching'
  | 'packaging' | 'receipt' | 'invoice' | 'other';
export type ReviewStatus = 'pending' | 'published' | 'hidden';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  official_site_url: string | null;
  monitor_adapter: string | null;
  active: boolean;
  created_at: string;
}

export type ProductRow = {
  id: string;
  brand_id: string;
  name: string;
  name_en: string | null;
  slug: string;
  category: ProductCategory;
  /** unisex는 Men's·Women's 양쪽에 노출된다 */
  gender: ProductGender;
  /** BEST 큐레이션 순서. null이면 BEST가 아니다 */
  featured_rank: number | null;
  hs_code: string | null;
  /** 실물 라벨 기준 원산지. 브랜드 국적으로 추정 금지. */
  origin_country: string | null;
  /** origin_country = 'CA' 일 때만 true (DB generated column). 관세 0%, 부가세는 별도 부과. */
  ckfta_eligible: boolean | null;
  description: string | null;
  images: Json;
  /** 상품 정보 제공 고시 — active 상태에는 아래 넷과 origin_country가 모두 있어야 한다 (DB check) */
  material: string | null;
  care: string | null;
  manufacturer: string | null;
  as_contact: string | null;
  /** 한국 공식 정발가(원). 확인된 경우에만 채운다 — 추정치를 넣지 않는다 */
  kr_retail_krw: number | null;
  /** 이 상품 한 점의 국제 배송비(원). null이면 무게 기반 계산값, 0은 무료배송 */
  shipping_krw: number | null;
  /** 네이버 스마트스토어 상품 URL. active 상태에는 반드시 있어야 한다 (DB check) */
  smartstore_url: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export type ProductVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  /** 관리자 전용. 고객 응답에 절대 포함하지 않는다. */
  cost_cad_cents: number | null;
  /** 고객 노출 통합 단일가(원). */
  price_krw: number | null;
  weight_g: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  stock_type: StockType;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryRow = {
  variant_id: string;
  on_hand: number;
  reserved: number;
  safety_stock: number;
  available: number;
  location: string | null;
  updated_at: string;
}

export type PurchaseRow = {
  id: string;
  variant_id: string;
  qty: number;
  unit_cost_cad_cents: number;
  gst_cad_cents: number;
  handling_fee_cad_cents: number;
  source: PurchaseSource;
  order_id: string | null;
  purchased_at: string;
  note: string | null;
  created_at: string;
}

export type SupplierListingRow = {
  id: string;
  variant_id: string;
  brand_id: string;
  product_url: string;
  supplier_sku: string | null;
  size_code: string | null;
  color_code: string | null;
  list_price_cad_cents: number | null;
  current_price_cad_cents: number | null;
  on_sale: boolean;
  availability: AvailabilityState;
  origin_country: string | null;
  tier: MonitorTier;
  last_checked_at: string | null;
  last_success_at: string | null;
  fail_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type StockCheckRow = {
  id: number;
  listing_id: string;
  checked_at: string;
  status: CheckStatus;
  availability: AvailabilityState | null;
  price_cad_cents: number | null;
  on_sale: boolean | null;
  raw: Json | null;
  duration_ms: number | null;
}

export type ListingEventRow = {
  id: number;
  listing_id: string;
  type: ListingEventType;
  before: Json | null;
  after: Json | null;
  occurred_at: string;
  action_taken: string | null;
  needs_review: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
}

export type FxRateRow = {
  id: number;
  pair: string;
  rate: number;
  source: string;
  effective_date: string;
  fetched_at: string;
}

export type OrderRow = {
  id: string;
  order_no: string;
  /** 게스트 주문의 연락 수단. 회원 주문이면 null (customers.email 사용). */
  contact_email: string | null;
  customer_id: string | null;
  status: OrderStatus;
  receiver_name: string;
  receiver_phone: string;
  postcode: string;
  address1: string;
  address2: string | null;
  /** 개인통관고유부호. 민감정보 — 로그/에러리포트에 남기지 않는다. */
  pccc: string;
  subtotal_krw: number;
  shipping_krw: number;
  discount_krw: number;
  total_krw: number;
  fx_cad_krw: number | null;
  fx_usd_krw_customs: number | null;
  declared_value_usd_cents: number | null;
  duty_free_expected: boolean | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  placed_at: string;
  updated_at: string;
}

export type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string;
  qty: number;
  unit_price_krw: number;
  cost_snapshot_cad_cents: number | null;
  product_name_snapshot: string;
  option_snapshot: string | null;
  origin_snapshot: string | null;
  created_at: string;
}

export type ShipmentRow = {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_no: string | null;
  actual_weight_g: number | null;
  volumetric_weight_g: number | null;
  chargeable_weight_g: number | null;
  oversize: boolean;
  shipping_cost_cad_cents: number | null;
  customs_state: CustomsStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminUserRow = {
  user_id: string;
  role: 'owner' | 'operator';
  created_at: string;
}

export type SettingRow = {
  key: string;
  value: Json;
  updated_at: string;
}

/** 스토어 노출용 뷰 — 원가/마진 제외, 재고 신선도 게이트 적용 */
export type StoreVariantRow = {
  variant_id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price_krw: number | null;
  /** 비교가. 원가·마진과 달리 고객 노출 대상이다 */
  kr_retail_krw: number | null;
  /** 상품별 배송비(원). null이면 무게 기반 계산값 */
  shipping_krw: number | null;
  /** 결제로 가는 유일한 경로 */
  smartstore_url: string | null;
  stock_type: StockType;
  purchasable: boolean | null;
  supplier_checked_at: string | null;
  gender: ProductGender;
  category: ProductCategory;
  featured_rank: number | null;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

/* ── 20260826000003: 게스트 주문 · 지원 · 증빙 (docs/IA.md §5) ── */

export type InquiryRow = {
  id: string;
  /** `Q<YYMMDD>-<5자>`. 비회원 조회용이므로 난수 성분을 포함한다. */
  ticket_no: string;
  customer_id: string | null;
  contact_email: string;
  order_id: string | null;
  category: InquiryCategory;
  subject: string;
  body: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export type InquiryReplyRow = {
  id: string;
  inquiry_id: string;
  author: 'customer' | 'operator';
  body: string;
  created_at: string;
}

export type WishlistRow = {
  customer_id: string;
  variant_id: string;
  created_at: string;
}

export type RestockAlertRow = {
  id: string;
  variant_id: string;
  customer_id: string | null;
  contact_email: string;
  created_at: string;
  notified_at: string | null;
}

export type InspectionPhotoRow = {
  id: string;
  order_id: string | null;
  variant_id: string | null;
  kind: InspectionKind;
  /** Supabase Storage 경로. 공개 URL을 저장하지 않는다. */
  storage_path: string;
  caption: string | null;
  shot_at: string;
  /** 영수증·인보이스는 마스킹 확인 전까지 false. */
  is_public: boolean;
  created_at: string;
}

export type ReviewRow = {
  id: string;
  /** 구매 확인된 후기만 존재하도록 order_items를 참조한다. */
  order_item_id: string;
  customer_id: string | null;
  rating: number;
  body: string;
  photos: Json;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type OrderLookupAttemptRow = {
  id: number;
  attempted_at: string;
  /** 원문 IP를 저장하지 않는다. 애플리케이션이 salt와 함께 해시해 넣는다. */
  ip_hash: string | null;
  order_no_attempted: string | null;
  succeeded: boolean;
}

/**
 * `interface`가 아니라 `type`이어야 한다. postgrest-js의 `GenericSchema` 제약은
 * 인덱스 시그니처 호환을 요구하는데, interface는 암묵적 인덱스 시그니처를 얻지 못한다.
 * interface로 두면 `.select('id')` 결과가 조용히 `never`가 된다.
 */
export type Database = {
  public: {
    Tables: {
      admin_users: TableDef<AdminUserRow>;
      brands: TableDef<BrandRow>;
      customers: TableDef<CustomerRow>;
      fx_rates: TableDef<FxRateRow>;
      inventory: TableDef<InventoryRow>;
      listing_events: TableDef<ListingEventRow>;
      order_items: TableDef<OrderItemRow>;
      orders: TableDef<OrderRow>;
      product_variants: TableDef<ProductVariantRow>;
      products: TableDef<ProductRow>;
      purchases: TableDef<PurchaseRow>;
      settings: TableDef<SettingRow>;
      shipments: TableDef<ShipmentRow>;
      stock_checks: TableDef<StockCheckRow>;
      supplier_listings: TableDef<SupplierListingRow>;
      inquiries: TableDef<InquiryRow>;
      inquiry_replies: TableDef<InquiryReplyRow>;
      wishlists: TableDef<WishlistRow>;
      restock_alerts: TableDef<RestockAlertRow>;
      inspection_photos: TableDef<InspectionPhotoRow>;
      reviews: TableDef<ReviewRow>;
      order_lookup_attempts: TableDef<OrderLookupAttemptRow>;
    };
    Views: {
      store_variants: { Row: StoreVariantRow; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      generate_order_no: { Args: Record<string, never>; Returns: string };
      next_order_no: { Args: Record<string, never>; Returns: string };
      generate_ticket_no: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      product_status: ProductStatus;
      stock_type: StockType;
      availability_state: AvailabilityState;
      monitor_tier: MonitorTier;
      check_status: CheckStatus;
      listing_event_type: ListingEventType;
      order_status: OrderStatus;
      customs_status: CustomsStatus;
      purchase_source: PurchaseSource;
      product_gender: ProductGender;
      inquiry_status: InquiryStatus;
      inspection_kind: InspectionKind;
      review_status: ReviewStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
