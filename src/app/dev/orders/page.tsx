import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { OrderList, type OrderSummary } from '@/components/store/order-list';

/**
 * 주문 내역 미리보기. **개발 환경 전용** — 프로덕션에서는 404다.
 *
 * 실제 `/account/orders`는 로그인과 RLS를 거치므로 Supabase 없이는 열 수 없다.
 * 여기 데이터는 전부 가짜이며, 상태별 위계를 한 화면에서 비교하려고 흐름을 섞어 뒀다.
 */
export const dynamic = 'force-static';

const SAMPLE: OrderSummary[] = [
  {
    orderNo: 'R260828-QPMZ4T', status: 'at_forwarder', placedAt: '2026-08-28T02:14:00Z',
    totalKrw: 1_007_000, leadItemName: 'Beta LT 자켓', itemCount: 3,
  },
  {
    orderNo: 'R260812-KD7WNR', status: 'shipped', placedAt: '2026-08-12T23:40:00Z',
    totalKrw: 412_000, leadItemName: 'Scuba 오버사이즈 후디', itemCount: 1,
  },
  {
    orderNo: 'R260721-BX2LHV', status: 'delivered', placedAt: '2026-07-21T11:05:00Z',
    totalKrw: 689_000, leadItemName: 'Brooklyn 숄더백 28', itemCount: 2,
  },
  {
    orderNo: 'R260703-VN9GJC', status: 'cancelled', placedAt: '2026-07-03T05:22:00Z',
    totalKrw: 238_000, leadItemName: 'Gamma 라이트웨이트 후디', itemCount: 1,
  },
];

export default function OrderListPreview() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <Container as="section" className="py-12">
      <p className="mb-8 border border-outline px-4 py-3 text-meta text-muted-text">
        개발 미리보기 — 아래 주문은 가짜예요. 실제 화면은 <code>/account/orders</code>예요.
      </p>
      <h1 className="text-headline font-bold">주문 내역</h1>
      <OrderList orders={SAMPLE} />
    </Container>
  );
}
