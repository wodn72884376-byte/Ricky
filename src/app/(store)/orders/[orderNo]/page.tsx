import Link from 'next/link';
import { Container, NarrowShell } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { OrderDetailView, type OrderDetail } from '@/components/store/order-detail';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * 주문 상세.
 *
 * **접근 제어가 이 페이지의 핵심이다.** 주문번호는 URL에 노출되므로 그것만으로
 * 열려서는 안 된다 (docs/IA.md §5-2).
 *
 *   - 회원: RLS `orders_self_read`가 본인 주문만 통과시킨다.
 *   - 비회원: `/orders/lookup`에서 주문번호 + 연락처를 확인한 세션이 있어야 한다.
 *
 * 접근 불가와 존재하지 않음을 **같은 화면으로 처리한다** — 구분하면 주문번호의
 * 존재 여부가 새고, 그것만으로도 정보다.
 *
 * TODO(guest): 비회원 조회 세션(단기 서명 쿠키)을 발급하고 여기서 검증한다.
 *              지금은 회원 경로만 동작한다.
 */
export async function generateMetadata({ params }: PageProps<'/orders/[orderNo]'>) {
  const { orderNo } = await params;
  return { title: `주문 ${orderNo} — RICKY` };
}

async function loadOrder(orderNo: string): Promise<OrderDetail | null> {
  try {
    const supabase = await createClient();
    // RLS가 소유자 확인을 맡는다. 여기서 customer_id를 직접 비교하지 않는다 —
    // 정책이 한 곳(마이그레이션)에만 있어야 어긋나지 않는다.
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', orderNo)
      .maybeSingle();
    if (!data) return null;

    // TODO(data): order_items · shipments 조인해서 채운다.
    return null;
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
          <h1 className="text-headline font-bold">주문을 볼 수 없어요</h1>
          <p className="mt-4 text-body text-ink">
            주문번호가 맞지 않거나, 이 주문을 볼 권한이 없어요. 비회원으로 주문하셨다면
            주문조회에서 주문번호와 연락처를 확인해 주세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/orders/lookup" chevron>주문 조회</ButtonLink>
            <ButtonLink href="/support">문의하기</ButtonLink>
          </div>
          <p className="mt-8 text-meta text-muted-text">
            회원으로 주문하셨다면{' '}
            <Link href="/login" className="text-ink underline underline-offset-4">로그인</Link>
            {' '}후 주문 내역에서 보실 수 있어요.
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
