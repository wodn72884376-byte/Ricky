import Link from 'next/link';
import { ChevronRight } from '@/components/ui/icons';
import { formatKoDate } from '@/lib/date';
import { formatKrw } from '@/lib/money';
import { ORDER_STATUS_KO, isOrderInFlight } from '@/lib/orders';
import type { OrderStatus } from '@/lib/supabase/types';

/**
 * 주문 내역 목록 (docs/IA.md §3).
 *
 * 표현 전용이다 — 조회와 접근 제어는 호출하는 쪽이 한다. 상세(`order-detail.tsx`)와
 * 같은 규칙을 따른다: 실제 라우트와 개발 미리보기가 같은 화면을 공유해야 한다.
 *
 * **사진을 넣지 않는다.** 목록의 상품명은 `order_items`의 스냅샷이라 주문 당시의
 * 이름이고, 지금 카탈로그에 같은 상품이 남아 있다는 보장이 없다(품절·단종·비공개).
 * 사진을 붙이려면 살아 있는 상품 행을 조인해야 하는데, 그러면 조인이 실패한 주문만
 * 사진이 비어 어긋나고, 최악의 경우 **주문한 것과 다른 사진**이 걸린다.
 * 사진은 상세에서 보여준다 — 목록은 잡지가 아니라 기록이다.
 */

export type OrderSummary = {
  orderNo: string;
  status: OrderStatus;
  /** ISO 문자열. 표시 시각대는 `formatKoDate`가 KST로 고정한다 */
  placedAt: string;
  totalKrw: number;
  /** 대표 상품명. 주문 당시의 스냅샷이다 */
  leadItemName: string | null;
  /** 서로 다른 품목 수. 수량 합계가 아니다 */
  itemCount: number;
};

/** `Beta LT 자켓 외 2건` */
function itemsLabel(order: OrderSummary): string | null {
  if (!order.leadItemName) return null;
  const rest = order.itemCount - 1;
  return rest > 0 ? `${order.leadItemName} 외 ${rest}건` : order.leadItemName;
}

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="mt-10 border-t border-outline">
      {orders.map((order) => {
        const inFlight = isOrderInFlight(order.status);
        const items = itemsLabel(order);

        return (
          <li key={order.orderNo} className="border-b border-outline">
            {/*
              줄 전체가 탭 영역이다 (DESIGN.md §8) — 오른쪽에 `보기` 버튼을 따로 두지 않는다.
              후행 셰브런이 누를 수 있다는 유일한 표시다.
            */}
            <Link
              href={`/orders/${order.orderNo}`}
              className="group flex flex-col gap-5 py-7 md:flex-row md:items-center md:gap-8"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-meta">
                  <span className="text-muted-text">{formatKoDate(order.placedAt)}</span>
                  {/* 색이 아니라 웨이트로 진행 중인 주문을 올린다 (DESIGN.md §2) */}
                  <span className={inFlight ? 'font-bold text-ink' : 'text-muted-text'}>
                    {ORDER_STATUS_KO[order.status]}
                  </span>
                </p>

                <p
                  data-numeric
                  className="mt-2 text-editorial font-bold text-ink group-hover:underline group-hover:underline-offset-4"
                >
                  {order.orderNo}
                </p>

                {items && <p className="mt-2 text-body text-ink">{items}</p>}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
                <span data-numeric className="text-product font-bold text-ink">
                  {formatKrw(order.totalKrw)}
                </span>
                <ChevronRight className="text-muted" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
