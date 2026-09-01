'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { TextAreaField } from '@/components/ui/field';
import { addReply } from './actions';
import { REPLY_INITIAL } from './state';

/**
 * 답변 폼.
 *
 * **여기 쓴 글은 고객의 문의 화면에 그대로 보인다** (20260831000016).
 * 다만 알림 메일은 아직 자동으로 나가지 않아서 고객이 그 화면에 들어와야 읽는다 —
 * 그래서 라벨이 `답변 보내기` 가 아니라 `답변 남기기` 다. 화면이 그 차이를 숨기지 않는다 (§12-8).
 */
export function ReplyForm({ inquiryId }: { inquiryId: string }) {
  const [state, action] = useActionState(addReply, REPLY_INITIAL);

  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="id" value={inquiryId} />
      <TextAreaField
        label="답변"
        name="body"
        required
        placeholder="고객이 이 글을 그대로 읽어요. 존댓말과 `~해요` 종결로 써 주세요."
        error={state.status === 'error' ? state.message : undefined}
      />
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.status === 'ok' && (
          <span role="status" className="text-meta text-muted-text">고객 화면에 올렸어요.</span>
        )}
      </div>
    </form>
  );
}

/** 제출 중에는 잠근다 — 두 번 누르면 같은 답변이 두 줄 쌓인다. */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="inverted" size="md" disabled={pending}>
      {pending ? '남기는 중…' : '답변 남기기'}
    </Button>
  );
}
