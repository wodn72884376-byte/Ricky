'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * 로그아웃.
 *
 * **서버 액션이어야 한다.** 서버 컴포넌트에서는 쿠키를 쓸 수 없어서 세션이 지워지지 않는다
 * (`supabase/server.ts` 의 setAll 주석 참조). 액션에서는 쓰기가 허용된다.
 */
export async function signOut() {
  await (await createClient()).auth.signOut();
  redirect('/');
}
