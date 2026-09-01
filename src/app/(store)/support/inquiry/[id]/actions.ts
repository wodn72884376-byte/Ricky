'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { canReplyToInquiry, normalizeTicketNo } from '@/lib/support/inquiry';
import type { FollowUpState } from './state';

/**
 * 고객이 자기 문의에 답을 이어 쓴다.
 *
 * **문의를 접수번호로 다시 찾는다.** 화면이 보낸 `id`(uuid)를 그대로 믿으면 남의 문의에
 * 줄을 남길 수 있다 — 접수번호로 조회하면 RLS(`inquiries_self_read`)가 본인 것만
 * 통과시키므로, 남의 번호를 넣어도 "찾을 수 없다"가 된다.
 *
 * `author` 는 항상 `'customer'` 다. 정책(20260831000016)도 같은 값만 허용한다 —
 * 고객이 운영자 이름으로 줄을 남기면 상세 화면의 `운영자 ·` 표기가 거짓말이 된다.
 *
 * 상태를 여기서 바꾸지 않는다. `answered` → `open` 되돌리기는 트리거가 한다 —
 * 고객에게 `inquiries` update 권한을 주면 제목·본문까지 고칠 수 있게 된다.
 */
export async function replyToInquiry(
  _prev: FollowUpState,
  formData: FormData,
): Promise<FollowUpState> {
  const body = String(formData.get('body') ?? '').trim();
  const ticketNo = normalizeTicketNo(String(formData.get('ticketNo') ?? ''));

  const user = await getSessionUser();
  if (!user) {
    return { status: 'error', message: '로그인이 풀렸습니다. 다시 로그인한 뒤 보내 주십시오.', body };
  }
  if (!ticketNo) return { status: 'error', message: '문의를 찾을 수 없습니다.', body };
  if (body.length < 2) return { status: 'error', message: '내용을 적어 주십시오.', body };
  if (body.length > 5000) {
    return { status: 'error', message: '내용이 너무 깁니다. 5,000자 안으로 줄여 주십시오.', body };
  }

  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('id, status')
    .eq('ticket_no', ticketNo)
    .maybeSingle();
  if (!inquiry) return { status: 'error', message: '문의를 찾을 수 없습니다.', body };

  // 종료된 건은 화면에도 상자가 없지만, 그 사이에 운영자가 종료했을 수 있다
  if (!canReplyToInquiry(inquiry.status)) {
    return {
      status: 'error',
      message: '이 문의는 종료되었습니다. 새로 남겨 주시면 이어서 도와드리겠습니다.',
      body,
    };
  }

  const { error } = await supabase
    .from('inquiry_replies')
    .insert({ inquiry_id: inquiry.id, author: 'customer', body });
  if (error) {
    // 원문을 화면에 흘리지 않는다. 사용자가 할 수 있는 일만 말한다.
    return { status: 'error', message: '보내지 못했습니다. 잠시 후 다시 시도해 주십시오.', body };
  }

  revalidatePath(`/support/inquiry/${ticketNo}`);
  return { status: 'ok' };
}
