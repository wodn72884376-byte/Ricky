'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { TextAreaField } from '@/components/ui/field';
import { replyToInquiry } from './actions';
import { FOLLOW_UP_INITIAL } from './state';

/**
 * 되묻기 상자.
 *
 * 이 상자가 없으면 고객은 같은 건으로 **새 문의**를 접수한다 — 한 대화가 티켓 두 개로
 * 갈라지고 운영자가 손으로 잇는다.
 *
 * 보낸 뒤 상자를 비우는 일은 **부모가 한다.** `page.tsx` 가 답변 수를 `key` 로 주므로,
 * 서버가 새 줄을 실어 다시 그리면 이 컴포넌트가 통째로 새로 마운트되며 빈칸이 된다.
 * 여기서 effect 로 지우면 저장이 실패했을 때도 글이 사라질 위험이 생긴다.
 *
 * 보냈다는 확인 문구를 따로 두지 않는다 — 위 대화에 방금 쓴 글이 올라온다.
 */
export function FollowUpForm({ ticketNo }: { ticketNo: string }) {
  const [state, action] = useActionState(replyToInquiry, FOLLOW_UP_INITIAL);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="ticketNo" value={ticketNo} />
      <TextAreaField
        label="이어서 남기기"
        name="body"
        required
        // 저장에 실패하면 서버가 쓴 글을 돌려준다. 다시 치게 만들지 않는다.
        defaultValue={state.status === 'error' ? (state.body ?? '') : ''}
        placeholder="답변에 이어서 궁금한 점을 적어 주십시오."
        error={state.status === 'error' ? state.message : undefined}
      />
      <SubmitButton />
    </form>
  );
}

/** 제출 중에는 잠근다 — 두 번 누르면 같은 글이 두 줄 쌓인다. */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="inverted" size="lg" className="self-start" disabled={pending}>
      {pending ? '보내는 중…' : '보내기'}
    </Button>
  );
}
