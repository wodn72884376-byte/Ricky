import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseEnv, publicEnv } from '@/lib/env';

/**
 * Supabase 세션 쿠키 갱신.
 * Next 16에서 middleware는 proxy로 이름이 바뀌었고 런타임은 nodejs로 고정된다.
 */
export async function proxy(request: NextRequest) {
  /*
    `/dev`는 컴포넌트 프리뷰다. 더미 상품과 가짜 주문이 들어 있어서
    프로덕션에 열려 있으면 검색에 가짜 상품이 뜨고, 실제 화면과 헷갈린다.
    robots로도 막지만 그건 요청이지 차단이 아니다 — 여기서 실제로 막는다.
  */
  if (process.env.NODE_ENV === 'production' && request.nextUrl.pathname.startsWith('/dev')) {
    return new NextResponse(null, { status: 404 });
  }

  let response = NextResponse.next({ request });

  // Supabase가 설정되지 않았으면 세션 갱신할 것도 없다.
  // 모든 요청을 지나는 코드라 여기서 던지면 사이트 전체가 죽는다.
  if (!hasSupabaseEnv()) return response;

  const supabase = createServerClient(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // 토큰 갱신을 트리거한다. 권한 판정은 각 라우트(RLS + is_admin)에서 수행한다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 정적 자산과 이미지 최적화 요청은 제외
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
