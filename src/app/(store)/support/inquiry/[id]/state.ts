/**
 * 되묻기 폼 상태.
 *
 * `'use server'` 파일은 **async 함수만 export할 수 있다.** 상수를 같이 두면 빌드는
 * 통과하고 요청 시점에 500이 난다 — 그래서 별도 모듈로 뺀다
 * (admin/inquiries/[id]/state.ts 와 같은 이유).
 */
export type FollowUpState = {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  /** 저장에 실패했을 때 쓴 글을 돌려준다 — 다시 치게 만들지 않는다 */
  body?: string;
};

export const FOLLOW_UP_INITIAL: FollowUpState = { status: 'idle' };
