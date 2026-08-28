/**
 * 폼 상태 타입과 초기값. 등록과 수정이 공유한다.
 *
 * `'use server'` 파일은 **async 함수만 export할 수 있다.** 상수를 같이 두면
 * 빌드는 통과하고 요청 시점에 500이 난다 — 그래서 별도 모듈로 뺀다.
 */
export type FormState = {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  /** 필드명 → 한 문장. 색만으로 전달하지 않는다 (DESIGN.md §14) */
  fieldErrors?: Record<string, string>;
  /** 저장 결과 요약. 등록·수정이 같은 모양을 쓴다 */
  saved?: { slug: string; name: string; variants: number; status: string };
};

/** 이전 이름. 등록 화면이 쓰던 별칭을 남겨 둔다 */
export type CreateState = FormState;

export const INITIAL_STATE: FormState = { status: 'idle' };

/**
 * 상태 표기. 목록·폼·저장 결과가 같은 단어를 써야 한다 —
 * 화면마다 다르면 같은 상태로 읽히지 않는다.
 *
 * 이 파일에 두는 이유: 클라이언트 폼과 서버 액션이 모두 import하므로
 * zod가 들어 있는 schema.ts에 두면 검증 스키마가 클라이언트 번들로 딸려 간다.
 */
export const STATUS_LABEL: Record<string, string> = {
  active: '판매 중',
  draft: '임시저장',
  paused: '일시중지',
  archived: '보관',
};
