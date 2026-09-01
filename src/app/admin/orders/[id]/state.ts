/**
 * 주문 화면의 폼 상태.
 *
 * `'use server'` 파일은 async 함수만 export할 수 있어서 상수를 여기 둔다
 * (admin/products/state.ts 와 같은 이유).
 */
export type OrderActionState = { status: 'idle' | 'ok' | 'error'; message?: string };

export const ORDER_ACTION_INITIAL: OrderActionState = { status: 'idle' };
