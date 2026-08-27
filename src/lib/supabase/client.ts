'use client';

import { createBrowserClient } from '@supabase/ssr';
import { hasSupabaseEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

/** 브라우저(클라이언트 컴포넌트)용. anon key만 사용하며 RLS가 접근을 통제한다. */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * 환경변수가 없으면 `null`을 준다.
 *
 * 헤더의 계정 메뉴처럼 **모든 페이지에 있는 컴포넌트**가 이걸 쓴다.
 * 거기서 예외가 나면 하이드레이션이 통째로 죽어서 서버가 200을 줘도 화면이 빈다 —
 * 실제로 그렇게 배포가 깨졌다. 인증은 부가 기능이므로 없으면 없는 대로 동작해야 한다.
 */
export function createClientIfConfigured() {
  return hasSupabaseEnv() ? createClient() : null;
}
