import { z } from 'zod';
import type { InquiryCategory, InquiryStatus } from '@/lib/supabase/types';

/**
 * 1:1 문의 입력 규칙. **서버 액션과 클라이언트 폼이 같은 스키마를 본다** —
 * 두 곳에서 따로 적으면 화면은 통과시키고 서버가 거절하는 조합이 생긴다.
 *
 * 길이 상한은 DB 제약(`inquiries` check)과 같은 값이다. 여기서 먼저 걸러 주면
 * 사용자가 5,001자를 다 쓰고 나서 데이터베이스 오류를 보는 일이 없다.
 */

/**
 * DB `inquiries.category` check 와 같은 목록이다.
 *
 * 라벨 배열을 `Record<InquiryCategory, string>` 로 두면 **DB 타입에 값이 추가될 때
 * 여기서 컴파일이 깨진다** — 새 유형이 화면에서 조용히 빠지는 것보다 낫다.
 */
const CATEGORY_LABEL: Record<InquiryCategory, string> = {
  general: '일반 문의',
  order: '주문·결제',
  shipping: '배송',
  customs: '통관·관세',
  sizing: '사이즈',
  return: '교환·반품',
};

/** 화면 노출 순서. 위 표의 키 순서를 그대로 쓴다 */
export const INQUIRY_CATEGORIES = (Object.keys(CATEGORY_LABEL) as InquiryCategory[]).map(
  (value) => ({ value, label: CATEGORY_LABEL[value] }),
);

const CATEGORY_VALUES = Object.keys(CATEGORY_LABEL) as [InquiryCategory, ...InquiryCategory[]];

export const InquirySchema = z.object({
  email: z
    .string()
    .trim()
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, '답변을 받으실 이메일 주소를 정확히 입력해 주세요.'),
  category: z.enum(CATEGORY_VALUES).catch('general'),
  /* 주문번호는 선택값이다. 형식이 틀려도 막지 않고 연결만 포기한다 — 아래 주석 참조 */
  orderNo: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(1, '제목을 입력해 주세요.').max(200, '제목이 너무 길어요.'),
  body: z
    .string()
    .trim()
    .min(10, '문의 내용을 열 글자 이상 적어 주세요.')
    .max(5000, '문의 내용이 너무 길어요. 5,000자 안으로 줄여 주세요.'),
});

export type InquiryInput = z.infer<typeof InquirySchema>;

/**
 * 문의 접수 결과.
 *
 * `ticketNo` 는 접수번호다. 회원 전용이라 조회에 꼭 필요하진 않지만,
 * 메일이나 통화에서 이 건을 가리킬 이름이 하나는 있어야 한다.
 */
export type InquiryState =
  | { status: 'idle' }
  | { status: 'ok'; ticketNo: string }
  | { status: 'error'; message?: string; fieldErrors?: Record<string, string> };

export const INQUIRY_INITIAL: InquiryState = { status: 'idle' };

/**
 * 문의 상태 표기. 목록·상세·대시보드가 같은 단어를 써야 한다 —
 * 화면마다 다르면 같은 상태로 읽히지 않는다.
 *
 * `Record<InquiryStatus, …>` 라서 DB 타입에 값이 늘면 여기서 컴파일이 깨진다.
 */
export const INQUIRY_STATUS_KO: Record<InquiryStatus, string> = {
  open: '접수',
  answered: '답변함',
  closed: '종료',
};

/** 운영자가 아직 손대야 하는 상태 */
export function isInquiryPending(status: InquiryStatus): boolean {
  return status === 'open';
}

/** 유형 코드 → 한국어. 목록 표에서 쓴다 */
export function inquiryCategoryKo(category: InquiryCategory): string {
  return CATEGORY_LABEL[category] ?? category;
}

/**
 * 접수번호 형식. `generate_ticket_no()` (20260826000003) 와 같은 규칙이다 —
 * `Q` + YYMMDD + `-` + 5자. 알파벳에서 `I·L·O·U` 를 뺀 것은 손으로 옮겨 적을 때
 * 1·0 과 헷갈리지 않게 하기 위해서다.
 *
 * 주소창에 들어오는 값이므로 **모양이 맞을 때만 DB에 묻는다.** 아무 문자열이나
 * 질의로 넘기면 존재하지 않는 번호를 찍어 보는 시도가 그대로 조회가 된다.
 */
export const TICKET_NO_RE = /^Q\d{6}-[0-9A-HJKMNP-TV-Z]{5}$/;

/**
 * 소문자로 붙여넣은 링크도 살린다. 형식이 아니면 `null` — 호출부가 404로 처리한다.
 *
 * 여기서 `decodeURIComponent` 를 부르지 않는다. Next 가 이미 디코딩해서 넘겨주므로
 * 한 번 더 부르면 `%` 한 글자짜리 주소에서 `URIError` 가 나 화면이 통째로 500이 된다.
 */
export function normalizeTicketNo(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  return TICKET_NO_RE.test(value) ? value : null;
}

/** 종료된 문의에는 답을 이어 쓸 수 없다 (20260831000016 정책과 같은 조건) */
export function canReplyToInquiry(status: InquiryStatus): boolean {
  return status !== 'closed';
}
