import { describe, expect, it } from 'vitest';
import {
  INQUIRY_STATUS_KO,
  TICKET_NO_RE,
  canReplyToInquiry,
  normalizeTicketNo,
} from './inquiry';

/**
 * 접수번호는 **주소의 일부**다 (`/support/inquiry/[id]`). 모양이 맞을 때만 DB에 물으므로
 * 이 함수가 느슨해지면 존재하지 않는 번호를 찍어 보는 시도가 그대로 조회가 된다.
 *
 * 규칙의 원본은 `generate_ticket_no()` (20260826000003) 다 — 여기가 그것을 따라간다.
 */
describe('normalizeTicketNo', () => {
  it('생성 규칙 그대로인 번호를 통과시킨다', () => {
    expect(normalizeTicketNo('Q260831-4B7MQ')).toBe('Q260831-4B7MQ');
  });

  it('소문자로 붙여넣은 링크도 살린다', () => {
    expect(normalizeTicketNo('q260831-4b7mq')).toBe('Q260831-4B7MQ');
  });

  it('앞뒤 공백을 털어낸다', () => {
    expect(normalizeTicketNo('  Q260831-4B7MQ \n')).toBe('Q260831-4B7MQ');
  });

  it.each([
    ['빈 값', ''],
    ['접두가 다름', 'R260831-4B7MQ'],
    ['날짜 자릿수 부족', 'Q26083-4B7MQ'],
    ['꼬리 자릿수 부족', 'Q260831-4B7M'],
    ['꼬리가 김', 'Q260831-4B7MQ1'],
    ['하이픈 없음', 'Q2608314B7MQ'],
    // 알파벳에서 뺀 글자들 — 손으로 옮겨 적을 때 1·0 과 헷갈린다
    ['I 포함', 'Q260831-4B7MI'],
    ['L 포함', 'Q260831-4B7ML'],
    ['O 포함', 'Q260831-4B7MO'],
    ['U 포함', 'Q260831-4B7MU'],
    ['와일드카드', 'Q260831-%'],
  ])('%s 는 거절한다', (_label, input) => {
    expect(normalizeTicketNo(input)).toBeNull();
  });

  /*
    Next 가 이미 디코딩한 값을 넘기므로 여기서 또 디코딩하면 `%` 한 글자짜리 주소에서
    URIError 가 나 화면이 통째로 500이 된다. 던지지 않고 null 을 돌려줘야 한다.
  */
  it('디코딩할 수 없는 문자열에도 던지지 않는다', () => {
    expect(() => normalizeTicketNo('%')).not.toThrow();
    expect(normalizeTicketNo('%')).toBeNull();
  });

  it('정규식은 여러 번 호출해도 같은 답을 준다 (전역 플래그 없음)', () => {
    expect(TICKET_NO_RE.test('Q260831-4B7MQ')).toBe(true);
    expect(TICKET_NO_RE.test('Q260831-4B7MQ')).toBe(true);
  });
});

/** 종료된 문의에 답을 이어 쓸 수 없다 — 정책(20260831000016)과 화면이 같은 조건을 본다 */
describe('canReplyToInquiry', () => {
  it.each([
    ['open', true],
    ['answered', true],
    ['closed', false],
  ] as const)('%s → %s', (status, expected) => {
    expect(canReplyToInquiry(status)).toBe(expected);
  });

  it('상태 단어는 화면마다 같은 것을 쓴다', () => {
    expect(INQUIRY_STATUS_KO.open).toBe('접수');
    expect(INQUIRY_STATUS_KO.answered).toBe('답변함');
    expect(INQUIRY_STATUS_KO.closed).toBe('종료');
  });
});
