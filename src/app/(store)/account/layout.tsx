import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/auth';

/**
 * 계정 영역의 로그인 벽.
 *
 * **서버에서 막는다.** 클라이언트에서 막으면 빈 목록이 한 번 그려졌다 사라져서
 * "주문이 없다"와 "볼 수 없다"가 같은 화면으로 보인다.
 *
 * RLS(`orders_self_read`)가 이미 남의 주문을 막지만, 그것만으로는 비로그인 방문자에게
 * **빈 주문 내역**을 보여주게 된다 — 없는 게 아니라 볼 수 없는 것이므로 그렇게 쓴다
 * (DESIGN.md §12-8).
 *
 * 레이아웃은 자기 경로를 모른다. `proxy.ts` 가 넣어 준 `x-pathname` 으로 원래 가려던 곳을
 * 알아내 로그인 후 되돌린다 — 없으면 계정 첫 화면으로 보낸다.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (user) return children;

  const path = (await headers()).get('x-pathname');
  // 오픈 리다이렉트 방지: 우리 경로만 통과시킨다 (`/login` 의 next 검사와 같은 규칙)
  const next = path?.startsWith('/') && !path.startsWith('//') ? path : '/account';
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
