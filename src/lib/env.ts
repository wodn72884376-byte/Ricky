import { z } from 'zod';

/**
 * 환경변수 검증. 서버 전용 키는 절대 NEXT_PUBLIC_ 접두사를 붙이지 않는다.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

/** 클라이언트/서버 공용. 빌드 타임에 인라인되도록 프로퍼티를 직접 참조한다. */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

/** 서버 전용. 클라이언트 컴포넌트에서 import 금지. */
export function serverEnv() {
  return serverSchema.parse(process.env);
}
