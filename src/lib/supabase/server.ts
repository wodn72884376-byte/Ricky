import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

/**
 * 서버 컴포넌트 / Route Handler / Server Action 용.
 * Next 16에서 cookies()는 비동기이므로 await 후 사용한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // 서버 컴포넌트에서는 쿠키 쓰기가 불가능하다.
            // 세션 갱신은 proxy.ts가 담당하므로 여기서는 무시해도 안전하다.
          }
        },
      },
    },
  );
}
