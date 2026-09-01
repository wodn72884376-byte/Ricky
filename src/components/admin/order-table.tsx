import Link from 'next/link';
import { InvertedChip } from '@/components/ui/states';
import { formatElapsed, formatKoDate } from '@/lib/date';
import { formatKrw } from '@/lib/money';
import { ORDER_STATUS_KO, isOrderInFlight } from '@/lib/orders';
import type { OrderStatus } from '@/lib/supabase/types';

/**
 * 주문 목록 표 (docs/wireframes/08-admin.md §2).
 *
 * **마지막 열이 경과 시간이다.** 방치된 건이 눈에 띄어야 한다 — 이 표의 목적은
 * 기록 열람이 아니라 "지금 손대야 하는 것 찾기"다.
 *
 * 금액은 `tabular-nums` 우측 정렬(DESIGN.md §9). 원가·마진은 여기 없다 —
 * `orders.fx_cad_krw` 는 고객 롤뿐 아니라 **관리자 화면의 이 경로에도 필요 없다**
 * (컬럼 grant 로 authenticated 에서 빠져 있다, 20260830000011).
 */

export type AdminOrderRow = {
  id: string;
  order_no: string;
  placed_at: string;
  status: OrderStatus;
  receiver_name: string;
  total_krw: number;
  contact_email: string | null;
};

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3 text-label font-bold text-ink ${right ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

export function OrderTable({ rows }: { rows: AdminOrderRow[] }) {
  return (
    // 열을 숨기지 않는다 — 운영자는 전체 숫자를 봐야 한다 (DESIGN.md §8)
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-y border-outline">
            <Th>주문번호</Th>
            <Th>접수</Th>
            <Th>받는 분</Th>
            <Th right>금액</Th>
            <Th>상태</Th>
            <Th right>경과</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const inFlight = isOrderInFlight(row.status);
            return (
              <tr key={row.id} className="border-b border-outline align-top">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${row.id}`}
                    data-numeric
                    className="text-meta font-bold text-ink underline-offset-4 hover:underline"
                  >
                    {row.order_no}
                  </Link>
                </td>
                <td className="px-4 py-4 text-meta text-muted-text">{formatKoDate(row.placed_at)}</td>
                <td className="px-4 py-4">
                  <p className="text-meta text-ink">{row.receiver_name}</p>
                  {row.contact_email && (
                    <p className="mt-1 text-meta text-muted-text">{row.contact_email}</p>
                  )}
                </td>
                <td data-numeric className="px-4 py-4 text-right text-meta font-bold text-ink">
                  {formatKrw(row.total_krw)}
                </td>
                <td className="px-4 py-4">
                  {inFlight ? (
                    <InvertedChip>{ORDER_STATUS_KO[row.status]}</InvertedChip>
                  ) : (
                    <span className="text-meta text-muted-text">{ORDER_STATUS_KO[row.status]}</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right text-meta text-muted-text">
                  {formatElapsed(row.placed_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
