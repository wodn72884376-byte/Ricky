import type { OrderStatus } from '@/lib/supabase/types';

/**
 * 주문 상태의 한국어 표기. **목록과 상세가 같은 표를 본다** —
 * 두 곳에서 따로 적으면 같은 주문이 화면마다 다른 이름으로 불린다.
 *
 * 문구는 운영자 용어가 아니라 고객이 읽는 말이다. `at_forwarder`는 배대지 도착이지만
 * 고객에게 의미 있는 사건은 "검수하고 포장한다"는 것이다.
 */

/** 정상 흐름. 취소·환불은 이 흐름 밖이라 타임라인에 넣지 않는다. */
export const ORDER_FLOW: { key: OrderStatus; label: string; hint: string }[] = [
  { key: 'paid', label: '결제 완료', hint: '주문이 접수됐어요.' },
  { key: 'sourcing', label: '현지 매입', hint: '캘거리에서 상품을 사고 있어요.' },
  { key: 'at_forwarder', label: '검수·포장', hint: '실물을 촬영하고 포장해요.' },
  { key: 'shipped', label: '출고', hint: '캘거리에서 인천으로 가고 있어요.' },
  { key: 'in_customs', label: '통관', hint: '수입 통관 중이에요.' },
  { key: 'delivered', label: '배송 완료', hint: '' },
];

/** 흐름 밖의 상태. 값이 있으면 타임라인 대신 이 문장 하나를 보여준다. */
export const ORDER_TERMINAL: Partial<Record<OrderStatus, string>> = {
  cancelled: '취소된 주문이에요.',
  refunded: '환불된 주문이에요.',
  pending_payment: '결제가 완료되지 않았어요.',
};

/**
 * 목록의 한 줄짜리 상태 라벨.
 *
 * `Record`라서 `OrderStatus`에 값을 추가하면 여기서 컴파일이 깨진다 — 의도한 것이다.
 * 새 상태가 목록에서 조용히 빈칸으로 나오는 것보다 빌드가 멈추는 편이 낫다.
 */
export const ORDER_STATUS_KO: Record<OrderStatus, string> = {
  pending_payment: '결제 대기',
  paid: '결제 완료',
  sourcing: '현지 매입',
  at_forwarder: '검수·포장',
  shipped: '출고',
  in_customs: '통관',
  delivered: '배송 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
};

/**
 * 아직 진행 중인가 — 손에 들어오지도, 끝나지도 않은 상태.
 *
 * 목록에서 이 주문들만 웨이트로 올린다. 색을 쓰지 않고 위계로만 구분한다 (DESIGN.md §2).
 */
export function isOrderInFlight(status: OrderStatus): boolean {
  return status !== 'delivered' && ORDER_FLOW.some((s) => s.key === status);
}
