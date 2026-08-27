import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

/**
 * service_role 클라이언트 — RLS를 우회한다.
 * 크롤러 워커, Stripe 웹훅 등 신뢰된 서버 경로에서만 사용할 것.
 * 사용자 입력을 그대로 필터로 넘기지 않는다.
 */
export function createAdminClient() {
  const env = serverEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
