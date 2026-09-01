import Link from 'next/link';
import { Container, NarrowShell } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { OrderDetailView, type OrderDetail } from '@/components/store/order-detail';
import { createClient } from '@/lib/supabase/server';
import { formatKoDate } from '@/lib/date';

export const dynamic = 'force-dynamic';

/**
 * 주문 상세.
 *
 * **접근 제어가 이 페이지의 핵심이다.** 주문번호는 URL에 노출되므로 그것만으로
 * 열려서는 안 된다 (docs/IA.md §5-2).
 *
 * 회원 전용이다 (2026-08-29). RLS `orders_self_read` 가 본인 주문만 통과시키므로
 * 여기서 소유자를 다시 비교하지 않는다 — 정책이 한 곳(마이그레이션)에만 있어야 어긋나지 않는다.
 *
 * 접근 불가와 존재하지 않음을 **같은 화면으로 처리한다** — 구분하면 주문번호의
 * 존재 여부가 새고, 그것만으로도 정보다.
 */
export async function generateMetadata({ params }: PageProps<'/orders/[orderNo]'>) {
  const { orderNo } = await params;
  return { title: `주문 ${orderNo}` };
}

async function loadOrder(orderNo: string): Promise<OrderDetail | null> {
  try {
    const supabase = await createClient();

    /*
      **`select('*')` 를 쓰지 않는다.** 20260830000011 이후 `orders` 는 컬럼 단위 grant라
      `fx_cad_krw` 가 고객 롤에 없다 — `*` 는 그 컬럼까지 요구해서 통째로 permission denied 가
      난다. 필요한 컬럼만 적는 것이 규칙이자 원가가 새지 않는 이유다 (CLAUDE.md 규칙 1).

      소유자 확인은 RLS `orders_self_read` 가 한다. 여기서 customer_id 를 비교하지 않는다 —
      정책이 한 곳(마이그레이션)에만 있어야 목록(`/account/orders`)과 어긋나지 않는다.
    */
    const { data: order } = await supabase
      .from('orders')
      // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃고 결과가 무너진다.
      .select('id, order_no, status, placed_at, receiver_name, receiver_phone, postcode, address1, address2, pccc, contact_email, subtotal_krw, shipping_krw, total_krw, duty_free_expected')
      .eq('order_no', orderNo)
      .maybeSingle();
    if (!order) return null;

    /*
      품목과 배송은 따로 읽는다. PostgREST 임베드를 쓰려면 `supabase/types.ts` 의
      `Relationships` 가 채워져 있어야 하는데 손으로 유지하는 타입이라 비어 있고,
      그러면 반환 타입이 조용히 무너진다. `npm run db:types` 로 갈아탄 뒤 합칠 것.

      둘 다 RLS 가 주문 소유자만 통과시킨다(`order_items_self_read` · `shipments_self_read`).
    */
    const [{ data: items }, { data: shipments }] = await Promise.all([
      supabase
        .from('order_items')
        .select('product_name_snapshot, option_snapshot, qty, unit_price_krw')
        .eq('order_id', order.id)
        .order('created_at'),
      supabase
        .from('shipments')
        .select('carrier, tracking_no, shipped_at')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    // 송장은 가장 최근 것 하나만 쓴다. 분할 출고는 아직 화면에 없다.
    const shipment = shipments?.[0] ?? null;

    return {
      orderNo: order.order_no,
      status: order.status,
      placedAt: formatKoDate(order.placed_at),
      receiverName: order.receiver_name,
      receiverPhone: order.receiver_phone,
      postcode: order.postcode,
      address1: order.address1,
      address2: order.address2,
      // 원문은 넘기고 마스킹은 컴포넌트가 한다 (PROJECT.md §3.4). 로그에 남기지 않는다.
      pccc: order.pccc,
      contactEmail: order.contact_email,
      items: (items ?? []).map((it) => ({
        name: it.product_name_snapshot,
        option: it.option_snapshot,
        qty: it.qty,
        unitPriceKrw: it.unit_price_krw,
      })),
      subtotalKrw: order.subtotal_krw,
      shippingKrw: order.shipping_krw,
      totalKrw: order.total_krw,
      /*
        예상 세액을 여기서 다시 계산하지 않는다. 계산하려면 품목마다 카테고리와 원산지가
        필요한데 카테고리는 `products` 에 있고 그 경로가 고객에게 닫혀 있다. 무엇보다
        세액은 주문 시점 환율·세율의 스냅샷이어야 한다(CLAUDE.md 규칙 7) — 지금 값으로
        다시 계산하면 결제 때 보여드린 숫자와 달라진다. 저장된 값이 없으면 없다고 쓴다.
      */
      estimatedTaxKrw: null,
      dutyFree: order.duty_free_expected === true,
      trackingNo: shipment?.tracking_no ?? null,
      carrier: shipment?.carrier ?? null,
    };
  } catch {
    return null;
  }
}

export default async function OrderPage({ params }: PageProps<'/orders/[orderNo]'>) {
  const { orderNo } = await params;
  const order = await loadOrder(orderNo);

  if (!order) {
    return (
      <Container as="section" className="py-20">
        <NarrowShell width="prose">
          <h1 className="text-headline font-bold">주문을 볼 수 없습니다</h1>
          <p className="mt-4 text-body text-ink">
            주문번호가 맞지 않거나, 이 주문을 볼 권한이 없습니다. 주문하신 계정으로
            로그인하셨는지 확인해 주십시오.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/account/orders" chevron>주문 내역</ButtonLink>
            <ButtonLink href="/support">문의하기</ButtonLink>
          </div>
          <p className="mt-8 text-meta text-muted-text">
            다른 계정으로 주문하셨다면{' '}
            <Link href="/login" className="text-ink underline underline-offset-4">로그인</Link>
            {' '}후 다시 시도해 주십시오.
          </p>
        </NarrowShell>
      </Container>
    );
  }

  return (
    <Container as="section" className="py-12 lg:py-16">
      <OrderDetailView order={order} />
    </Container>
  );
}
