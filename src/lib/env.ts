import { z } from 'zod';

/**
 * 환경변수 검증.
 *
 * **import 시점에 검증하지 않는다.** 빌드는 시크릿 없이도 통과해야 한다 —
 * 환경변수는 런타임에 필요한 것이지 빌드 타임에 필요한 게 아니다.
 * 최상위에서 `parse()`를 돌리면 페이지 데이터 수집 단계에서 빌드가 통째로 터진다.
 *
 * 대신 **처음 쓸 때** 검증하고 결과를 캐시한다. 값이 없으면 그 시점에 명확히 실패한다.
 *
 * 서버 전용 키는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
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

export type PublicEnv = z.infer<typeof publicSchema>;

/**
 * `process.env.X`를 직접 참조해야 Next가 클라이언트 번들에 인라인한다.
 * 객체를 통째로 넘기면 인라인이 안 된다.
 */
function readPublic() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

let cached: PublicEnv | null = null;

/** 공개 환경변수. 없으면 여기서 실패한다 — import가 아니라 사용 시점에. */
export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const parsed = publicSchema.safeParse(readPublic());
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(
      `환경변수가 설정되지 않았어요: ${missing}. .env.example을 참고해 .env.local을 채우거나 ` +
        '배포 환경의 환경변수를 설정해 주세요.',
    );
  }
  cached = parsed.data;
  return cached;
}

/**
 * Supabase를 쓸 수 있는지. 없으면 화면이 "연결되지 않았어요"로 우아하게 degrade한다.
 * 이걸로 먼저 걸러야 try/catch로 예외를 삼키지 않는다.
 */
export function hasSupabaseEnv(): boolean {
  return publicSchema.safeParse(readPublic()).success;
}

/** 서버 전용. 클라이언트 컴포넌트에서 import 금지. */
export function serverEnv() {
  return serverSchema.parse(process.env);
}
