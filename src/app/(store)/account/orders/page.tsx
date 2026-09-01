import { Container } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { OrderList, type OrderSummary } from '@/components/store/order-list';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: '주문 내역' };

/**
 * 주문 내역 (docs/IA.md §3).
 *
 * 로그인 확인은 `../layout.tsx`가 끝냈다. 여기서는 조회만 한다.
 *
 * **소유자를 직접 비교하지 않는다.** RLS `orders_self_read`가 본인 주문만 통과시킨다 —
 * 정책이 한 곳(마이그레이션)에만 있어야 상세(`/orders/[orderNo]`)와 어긋나지 않는다.
 */

/** 한 번에 읽는 최대 건수. 이 수를 넘길 만큼 주문이 쌓이면 커서 페이지네이션을 붙인다. */
const LIMIT = 50;

/**
 * 조회 결과. **비어 있음과 못 읽음을 구분한다** — 장애를 "주문이 없어요"로 덮으면
 * 고객은 주문이 사라진 줄 안다 (DESIGN.md §12-8).
 */
type Result = { ok: true; orders: OrderSummary[] } | { ok: false };

async function loadOrders(): Promise<Result> {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_no, status, placed_at, total_krw')
      .order('placed_at', { ascending: false })
      .limit(LIMIT);
    if (error || !orders) return { ok: false };
    if (orders.length === 0) return { ok: true, orders: [] };

    /*
      품목은 별도 질의로 읽는다. PostgREST 임베드(`order_items(...)`)를 쓰려면
      `supabase/types.ts`의 `Relationships`가 채워져 있어야 하는데 지금은 손으로 유지하는
      타입이라 비어 있고, 그러면 반환 타입이 조용히 무너진다.
      `npm run db:types`로 자동 생성본으로 갈아탄 뒤에 임베드 한 번으로 합칠 것.
    */
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, product_name_snapshot')
      .in('order_id', orders.map((o) => o.id));
    if (itemsError) return { ok: false };

    const byOrder = new Map<string, string[]>();
    for (const item of items ?? []) {
      const list = byOrder.get(item.order_id) ?? [];
      list.push(item.product_name_snapshot);
      byOrder.set(item.order_id, list);
    }

    return {
      ok: true,
      orders: orders.map((o) => {
        const names = byOrder.get(o.id) ?? [];
        return {
          orderNo: o.order_no,
          status: o.status,
          placedAt: o.placed_at,
          totalKrw: o.total_krw,
          leadItemName: names[0] ?? null,
          itemCount: names.length,
        };
      }),
    };
  } catch {
    // Supabase 미설정·네트워크 장애. 여기서 던지면 화면이 통째로 500이 된다.
    return { ok: false };
  }
}

export default async function AccountOrdersPage() {
  const result = await loadOrders();

  return (
    <Container as="section" className="py-12 lg:py-16">
      <h1 className="text-headline font-bold">주문 내역</h1>

      {!result.ok ? (
        <Unavailable />
      ) : result.orders.length === 0 ? (
        <Empty />
      ) : (
        <>
          <OrderList orders={result.orders} />
          <p className="mt-8 max-w-[var(--measure-prose)] text-meta text-muted-text">
            관세·부가세는 결제 금액에 포함되어 있지 않습니다. 통관 시 수취인이 납부하셔야 합니다.
          </p>
        </>
      )}
    </Container>
  );
}

/** 빈 상태 — 부재를 설명하는 한 줄과 고스트 CTA 하나 (DESIGN.md §14). */
function Empty() {
  return (
    <div className="mt-10 max-w-[var(--measure-prose)]">
      <p className="text-body text-ink">아직 주문하신 상품이 없습니다.</p>
      {/*
        스마트스토어 결제분은 우리 DB에 주문이 남지 않는다(6c8b67e).
        그걸 말하지 않으면 "분명 샀는데 비어 있다"가 된다 — 없는 것과 여기 없는 것은 다르다.
      */}
      <p className="mt-2 text-meta text-muted-text">
        스마트스토어에서 결제하신 주문은 네이버 앱의 주문 내역에 있습니다.
      </p>
      <div className="mt-8">
        <ButtonLink href="/shop" chevron>상품 둘러보기</ButtonLink>
      </div>
    </div>
  );
}

/** 조회 실패 — 비어 있다고 말하지 않는다. */
function Unavailable() {
  return (
    <div className="mt-10 max-w-[var(--measure-prose)]">
      <p className="text-body text-ink">주문 내역을 불러오지 못했습니다.</p>
      <p className="mt-2 text-meta text-muted-text">
        주문이 사라진 것은 아닙니다. 잠시 후 다시 시도해 주십시오.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/account/orders" chevron>다시 시도하기</ButtonLink>
        <ButtonLink href="/support">문의하기</ButtonLink>
      </div>
    </div>
  );
}
