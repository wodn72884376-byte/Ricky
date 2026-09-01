import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { OrderDetailView, type OrderDetail } from '@/components/store/order-detail';

/**
 * 주문 상세 미리보기. **개발 환경 전용** — 프로덕션에서는 404다.
 *
 * 실제 `/orders/[orderNo]`는 DB 조회와 접근 제어를 거치므로 Supabase 없이는 열 수 없다.
 * 여기 데이터는 전부 가짜다.
 */
export const dynamic = 'force-static';

const SAMPLE: OrderDetail = {
  orderNo: 'R260827-FWBZKK',
  status: 'at_forwarder',
  placedAt: '2026년 8월 27일',
  receiverName: '김재우',
  receiverPhone: '010-1234-5678',
  postcode: '06236',
  address1: '서울특별시 강남구 테헤란로 1',
  address2: '101동 1001호',
  pccc: 'P123456789012',
  contactEmail: 'buyer@example.com',
  /* 주문 당시 스냅샷이다 — 실제 화면도 `order_items` 의 이 네 값만 갖는다 */
  items: [
    { name: "Arc'teryx Beta LT 자켓 블랙", option: 'M', qty: 1, unitPriceKrw: 742_000 },
    { name: 'lululemon Scuba 오버사이즈 후디', option: '4', qty: 2, unitPriceKrw: 121_000 },
  ],
  subtotalKrw: 984_000,
  shippingKrw: 23_000,
  totalKrw: 1_007_000,
  estimatedTaxKrw: 244_700,
  dutyFree: false,
  trackingNo: null,
  carrier: null,
};

export default function OrderPreview() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <Container as="section" className="py-12">
      <p className="mb-8 border border-outline px-4 py-3 text-meta text-muted-text">
        개발 미리보기 — 아래 주문은 가짜예요. 실제 화면은 <code>/orders/[주문번호]</code>예요.
      </p>
      <OrderDetailView order={SAMPLE} />
    </Container>
  );
}
