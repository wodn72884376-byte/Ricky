'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Field, SelectField } from '@/components/ui/field';
import { ORDER_STATUS_KO } from '@/lib/orders';
import type { OrderStatus } from '@/lib/supabase/types';
import { saveTracking, setOrderStatus } from './actions';
import { ORDER_ACTION_INITIAL } from './state';

const STATUS_OPTIONS = (Object.keys(ORDER_STATUS_KO) as OrderStatus[]).map((value) => ({
  value,
  label: ORDER_STATUS_KO[value],
}));

/**
 * 상태 전이.
 *
 * 다음 단계 버튼만 두지 않고 **전체 목록에서 고르게** 한다 — 운영자는 되돌리기도 하고,
 * 취소·환불처럼 흐름 밖으로도 나가야 한다. 잘못 눌러도 다시 바꿀 수 있는 조작이라
 * 확인 대화상자를 두지 않는다.
 */
export function StatusControl({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const [state, action] = useActionState(setOrderStatus, ORDER_ACTION_INITIAL);

  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={orderId} />
      <SelectField label="주문 상태" name="status" defaultValue={current} options={STATUS_OPTIONS} />
      <Submit idle="상태 바꾸기" busy="바꾸는 중…" />
      <Feedback state={state} />
    </form>
  );
}

/** 송장. 배송 행이 없으면 서버가 만든다 */
export function TrackingControl({
  orderId,
  carrier,
  trackingNo,
}: {
  orderId: string;
  carrier: string | null;
  trackingNo: string | null;
}) {
  const [state, action] = useActionState(saveTracking, ORDER_ACTION_INITIAL);

  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={orderId} />
      <Field label="배송사" name="carrier" defaultValue={carrier ?? ''} placeholder="LTC" />
      <Field
        label="송장번호"
        name="trackingNo"
        defaultValue={trackingNo ?? ''}
        placeholder="1234567890"
      />
      <Submit idle="송장 저장" busy="저장하는 중…" />
      <Feedback state={state} />
    </form>
  );
}

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="md" disabled={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

function Feedback({ state }: { state: { status: string; message?: string } }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <span
      role="status"
      className={state.status === 'error' ? 'text-meta text-error' : 'text-meta text-muted-text'}
    >
      {state.message}
    </span>
  );
}
