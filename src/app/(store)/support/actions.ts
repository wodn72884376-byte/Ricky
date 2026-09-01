'use server';

import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { InquirySchema, type InquiryState } from '@/lib/support/inquiry';

/**
 * 1:1 문의 접수.
 *
 * **회원 전용**이다 (2026-08-29). `inquiries.customer_id` 가 not null 이고
 * insert 정책이 `customer_id = auth.uid()` 를 요구한다.
 *
 * 규칙 둘:
 *   - `customer_id` 는 **세션에서** 채운다. 클라이언트가 보낸 값을 쓰면 남의 이름으로
 *     문의를 넣을 수 있다. 폼에 그 필드를 두지도 않는다.
 *   - 검증을 서버에서 다시 한다. 화면 검증은 즉시 피드백을 위한 것이고 권한이 없다.
 */
export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const user = await getSessionUser();
  if (!user) {
    return { status: 'error', message: '로그인이 풀렸습니다. 다시 로그인한 뒤 보내 주십시오.' };
  }

  const parsed = InquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: 'error', message: '입력을 확인해 주십시오.', fieldErrors };
  }

  const { email, category, orderNo, subject, body } = parsed.data;
  const supabase = await createClient();

  /*
    주문번호는 선택값이다. 적어 주셨는데 못 찾으면 **문의를 거절하지 않고 연결만 포기한다** —
    오타 하나로 쓴 글을 돌려보내는 것이 주문 연결보다 나쁘다. 본문에 주문번호가 남아 있으므로
    운영자가 손으로 이을 수 있다.

    RLS(`orders_self_read`)가 본인 주문만 통과시키므로 남의 주문번호로는 아무것도 못 찾는다.
  */
  let orderId: string | null = null;
  if (orderNo) {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('order_no', orderNo)
      .maybeSingle();
    orderId = data?.id ?? null;
  }

  const { data, error } = await supabase
    .from('inquiries')
    .insert({
      customer_id: user.id,
      contact_email: email,
      category,
      order_id: orderId,
      subject,
      body,
    })
    .select('ticket_no')
    .single();

  if (error || !data?.ticket_no) {
    // 원문을 화면에 흘리지 않는다. 사용자가 할 수 있는 일만 말한다.
    return {
      status: 'error',
      message: '문의를 접수하지 못했습니다. 잠시 후 다시 시도해 주십시오.',
    };
  }

  return { status: 'ok', ticketNo: data.ticket_no };
}
