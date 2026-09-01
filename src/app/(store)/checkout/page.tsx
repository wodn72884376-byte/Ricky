import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/auth';
import { CheckoutView } from './checkout-view';

export const metadata = { title: '주문' };

/**
 * 로그인 벽은 **서버에서** 세운다. 클라이언트에서 막으면 폼이 한 번 그려졌다 사라지고,
 * 그 사이에 입력한 값이 날아간다.
 *
 * 계정 이메일을 연락처 기본값으로 넘긴다. 네이버 계정은 이메일이 없을 수 있어
 * (`20260829000008_members_only.sql` B) 빈 문자열이 되는데, 그때는 사용자가 직접 적는다 —
 * `orders.contact_email` 은 not null 이므로 이 값은 주문마다 반드시 확정된다.
 */
export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent('/checkout')}`);

  return <CheckoutView defaultEmail={user.email ?? ''} />;
}
