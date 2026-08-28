/**
 * 폼 상태 타입과 초기값.
 *
 * `'use server'` 파일은 **async 함수만 export할 수 있다.** 상수를 같이 두면
 * 빌드는 통과하고 요청 시점에 500이 난다 — 그래서 별도 모듈로 뺀다.
 */
export type CreateState = {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  /** 필드명 → 한 문장. 색만으로 전달하지 않는다 (DESIGN.md §14) */
  fieldErrors?: Record<string, string>;
  created?: { slug: string; name: string; variants: number; published: boolean };
};

export const INITIAL_STATE: CreateState = { status: 'idle' };
