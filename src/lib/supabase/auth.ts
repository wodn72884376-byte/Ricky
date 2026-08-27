import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';

export type SessionUser = {
  id: string;
  email: string | null;
  isAdmin: boolean;
};

/** 현재 로그인 사용자와 관리자 여부. 비로그인 시 null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // 미설정 상태에서는 비로그인으로 취급한다. 예외를 던지면 레이아웃이 통째로 깨진다.
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: isAdmin } = await supabase.rpc('is_admin');

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAdmin: isAdmin === true,
  };
}
