/**
 * 답변 폼 상태.
 *
 * `'use server'` 파일은 **async 함수만 export할 수 있다.** 상수를 같이 두면 빌드는
 * 통과하고 요청 시점에 500이 난다 — 그래서 별도 모듈로 뺀다 (admin/products/state.ts 와 같은 이유).
 */
export type ReplyState = { status: 'idle' | 'ok' | 'error'; message?: string };

export const REPLY_INITIAL: ReplyState = { status: 'idle' };
