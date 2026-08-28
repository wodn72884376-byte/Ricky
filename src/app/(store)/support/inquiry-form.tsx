'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, TextAreaField } from '@/components/ui/field';

/**
 * 1:1 문의 접수.
 *
 * 스키마는 준비되어 있다(`inquiries`, 비회원 insert 허용). 아직 서버 액션을 붙이지 않았으므로
 * **접수되지 않는다는 사실을 화면에서 숨기지 않는다** — 모르는 것은 모른다고 쓴다(DESIGN.md §12-8).
 *
 * TODO(server): 서버 액션에서 anon 클라이언트로 inquiries insert → 접수번호(ticket_no) 반환.
 *   주문번호는 선택값이며, 있으면 order_id를 서버에서 조회해 연결한다.
 */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Errors = { email?: string; subject?: string; body?: string };

export function InquiryForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const subject = String(form.get('subject') ?? '').trim();
    const body = String(form.get('body') ?? '').trim();

    const next: Errors = {};
    if (!EMAIL.test(email)) next.email = '답변을 받으실 이메일 주소를 정확히 입력해 주세요.';
    if (!subject) next.subject = '제목을 입력해 주세요.';
    if (body.length < 10) next.body = '문의 내용을 열 글자 이상 적어 주세요.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="mt-8 flex flex-col items-start gap-4">
        <p className="text-editorial font-bold text-ink">아직 접수되지 않았어요</p>
        <p className="text-body leading-relaxed text-ink">
          문의 접수 기능을 준비하고 있어요. 지금은 작성하신 내용이 저장되지 않아요.
          급하신 문의는 주문 확인 메일에 회신해 주시면 같은 담당자가 확인해요.
        </p>
        <Button type="button" variant="ghost" size="lg" onClick={() => setSubmitted(false)}>
          다시 작성하기
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
      <Field
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        hint="답변을 이 주소로 보내드려요."
        error={errors.email}
      />
      <Field
        label="주문번호"
        name="orderNo"
        placeholder="R260826-7F3K9Q"
        hint="주문과 관련된 문의라면 적어 주세요. 없으셔도 괜찮아요."
      />
      <Field label="제목" name="subject" required error={errors.subject} />
      <TextAreaField
        label="문의 내용"
        name="body"
        required
        placeholder="어떤 상품의 어떤 점이 궁금하신지 적어 주세요."
        error={errors.body}
      />
      <p className="text-meta leading-relaxed text-muted-text">
        개인통관고유부호나 카드번호는 적지 말아 주세요. 필요하면 저희가 안전한 경로로 따로 여쭤볼게요.
      </p>
      <Button type="submit" variant="inverted" size="lg" className="self-start">
        문의 보내기
      </Button>
    </form>
  );
}
