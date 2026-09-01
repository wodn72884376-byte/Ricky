'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, SelectField, TextAreaField } from '@/components/ui/field';
import { INQUIRY_CATEGORIES, INQUIRY_INITIAL } from '@/lib/support/inquiry';
import { submitInquiry } from './actions';

/**
 * 1:1 문의 접수. **회원 전용**이다 (2026-08-29) —
 * 답변을 보낼 곳과 지난 문의를 쌓을 곳이 계정 없이는 정해지지 않는다.
 *
 * 검증은 서버가 한다(`actions.ts`). 여기서 한 번 더 하지 않는 이유는 규칙이 두 벌이 되면
 * 화면은 통과시키고 서버가 거절하는 조합이 생기기 때문이다 — 스키마는 한 곳에만 둔다.
 *
 * `customer_id` 를 폼에 두지 않는다. 서버가 세션에서 채운다.
 */
export function InquiryForm({
  signedIn,
  defaultEmail = '',
}: {
  signedIn: boolean;
  defaultEmail?: string;
}) {
  const [state, action] = useActionState(submitInquiry, INQUIRY_INITIAL);
  /*
    `문의 하나 더 남기기` 가 가리키는 곳은 이 화면 자신이라 링크로는 폼이 돌아오지 않는다 —
    해시만 바뀌고 컴포넌트는 그대로 마운트되어 있어서 접수 확인 블록이 계속 남았다.
    방금 확인한 접수번호를 기억해 두고, 그 번호일 때만 폼을 다시 그린다.
  */
  const [dismissed, setDismissed] = useState<string | null>(null);

  // 폼을 그려 놓고 제출할 때 막지 않는다. 다 쓴 뒤에 로그인하라고 하면 글이 날아간다.
  if (!signedIn) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4">
        <p className="text-body leading-relaxed text-ink">
          문의를 남기시려면 로그인이 필요합니다. 답변을 보낼 곳과 지난 문의를 모아 둘 곳이
          있어야 하기 때문입니다.
        </p>
        <ButtonLink href={`/login?next=${encodeURIComponent('/support#inquiry')}`} chevron>
          로그인하기
        </ButtonLink>
      </div>
    );
  }

  if (state.status === 'ok' && state.ticketNo !== dismissed) {
    return (
      <div role="status" className="mt-8 flex flex-col items-start gap-4">
        <p className="text-body text-muted-text">문의를 접수했습니다.</p>
        <p data-numeric className="text-editorial font-bold text-ink">{state.ticketNo}</p>
        <p className="text-body leading-relaxed text-ink">
          접수 후 1영업일 안에 적어 주신 이메일로 답변을 보내드립니다. 캐나다와 한국의 시차 때문에
          다음 날 아침에 도착할 수 있습니다.
        </p>
        {/*
          접수번호가 주소가 된다 — 이 화면을 벗어나도 같은 건으로 돌아올 수 있다.
          반전 블랙은 화면당 하나이므로(DESIGN.md §4) 둘 다 고스트로 두고 순서로만 구분한다.
        */}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/support/inquiry/${state.ticketNo}`} chevron>
            문의 보기
          </ButtonLink>
          <Button type="button" variant="ghost" size="lg" onClick={() => setDismissed(state.ticketNo)}>
            문의 하나 더 남기기
          </Button>
        </div>
      </div>
    );
  }

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate className="mt-8 flex flex-col gap-6">
      <Field
        label="이메일"
        name="email"
        type="email"
        defaultValue={defaultEmail}
        autoComplete="email"
        required
        placeholder="you@example.com"
        hint="답변을 이 주소로 보내드립니다."
        error={errors.email}
      />
      {/*
        계정 이메일과 다를 수 있어서 계정에서 끌어오되 고칠 수 있게 둔다.
        네이버·카카오 계정은 이메일이 아예 없을 수 있다(20260829000008 B) — 그때는 빈칸이다.
      */}
      <SelectField
        label="문의 유형"
        name="category"
        defaultValue="general"
        options={[...INQUIRY_CATEGORIES]}
        hint="맞는 유형을 고르시면 담당자가 바로 확인합니다."
        error={errors.category}
      />
      <Field
        label="주문번호"
        name="orderNo"
        placeholder="R260826-7F3K9Q"
        hint="주문과 관련된 문의라면 적어 주십시오. 없으셔도 괜찮습니다."
        error={errors.orderNo}
      />
      <Field label="제목" name="subject" required error={errors.subject} />
      <TextAreaField
        label="문의 내용"
        name="body"
        required
        placeholder="어떤 상품의 어떤 점이 궁금하신지 적어 주십시오."
        error={errors.body}
      />

      <p className="text-meta leading-relaxed text-muted-text">
        개인통관고유부호나 카드번호는 적지 말아 주십시오. 필요하면 저희가 안전한 경로로 따로 여쭙겠습니다.
      </p>

      {/* 필드에 걸리지 않는 오류(로그인 만료·저장 실패)는 버튼 옆에 문장으로 둔다 */}
      {state.status === 'error' && state.message && !state.fieldErrors && (
        <p role="alert" className="text-body text-error">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}

/**
 * 제출 중에는 버튼을 잠근다. 두 번 누르면 문의가 두 건 접수된다 —
 * `useFormStatus` 는 감싸는 `<form>` 의 상태를 읽으므로 별도 컴포넌트여야 한다.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="inverted" size="lg" className="self-start" disabled={pending}>
      {pending ? '보내는 중…' : '문의 보내기'}
    </Button>
  );
}
