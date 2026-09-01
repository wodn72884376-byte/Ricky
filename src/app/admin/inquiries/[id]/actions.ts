'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import type { InquiryStatus } from '@/lib/supabase/types';
import type { ReplyState } from './state';

/**
 * 문의 답변 기록과 상태 변경.
 *
 * **관리자 여부를 액션 안에서 다시 본다.** 레이아웃의 가드는 화면 렌더를 막을 뿐
 * 서버 액션 호출을 막지 않는다 — 액션은 자기 힘으로 서 있어야 한다.
 * (RLS `inquiries_admin_all` 이 최종 방어선이지만, 그건 정책이고 이건 라우트다.)
 */
async function requireAdmin() {
  const user = await getSessionUser();
  return user?.isAdmin ? user : null;
}

const STATUSES: InquiryStatus[] = ['open', 'answered', 'closed'];

/**
 * 답변을 남기고 상태를 `answered` 로 옮긴다.
 *
 * **이 글은 고객의 문의 상세 화면(`/support/inquiry/[ticket_no]`)에 그대로 보인다.**
 * 다만 알림 메일이 자동으로 나가지는 않아서 고객이 그 화면에 다시 들어와야 읽는다 —
 * 화면이 그 차이를 밝힌다.
 *
 * TODO(notify): 답변을 남길 때 `contact_email` 로 알림 메일을 보낸다.
 */
export async function addReply(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  if (!(await requireAdmin())) return { status: 'error', message: '권한이 없어요.' };

  const id = String(formData.get('id') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  if (!id) return { status: 'error', message: '문의를 찾을 수 없어요.' };
  if (body.length < 2) return { status: 'error', message: '답변 내용을 적어 주세요.' };
  if (body.length > 5000) return { status: 'error', message: '답변이 너무 길어요. 5,000자 안으로 줄여 주세요.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('inquiry_replies')
    .insert({ inquiry_id: id, author: 'operator', body });
  if (error) return { status: 'error', message: '답변을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.' };

  /*
    상태는 `open` 일 때만 옮긴다. 이미 `closed` 인 건에 메모를 덧붙였다고 해서
    다시 열린 것처럼 보이면 목록의 정렬이 흔들린다.
  */
  await supabase.from('inquiries').update({ status: 'answered' }).eq('id', id).eq('status', 'open');

  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath('/admin/inquiries');
  return { status: 'ok' };
}

/** 상태만 바꾼다. 답변 없이 종료하거나, 다시 열어야 할 때. */
export async function setInquiryStatus(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const id = String(formData.get('id') ?? '');
  const next = String(formData.get('status') ?? '') as InquiryStatus;
  if (!id || !STATUSES.includes(next)) return;

  const supabase = await createClient();
  await supabase.from('inquiries').update({ status: next }).eq('id', id);

  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath('/admin/inquiries');
}
