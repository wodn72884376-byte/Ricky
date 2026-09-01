import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 소셜 로그인 콜백. 코드를 세션으로 교환한 뒤 원래 목적지로 보낸다.
 *
 * 제공자(구글·네이버·카카오)가 동의를 거절당하면 코드 대신 `error` 를 붙여 돌아온다.
 * 이때 "코드가 없다"로 뭉뚱그리면 사용자가 왜 실패했는지 알 수 없다 — 취소인지 장애인지
 * 구분해서 로그인 화면에 넘긴다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const nextParam = searchParams.get('next') ?? '/';
  // 오픈 리다이렉트 방지: 같은 오리진의 경로만 허용한다.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  const back = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${reason}&next=${encodeURIComponent(next)}`);

  // 사용자가 동의 화면에서 취소한 경우. 장애가 아니므로 다르게 안내한다.
  const oauthError = searchParams.get('error');
  if (oauthError) {
    return back(oauthError === 'access_denied' ? 'cancelled' : 'provider');
  }

  const code = searchParams.get('code');
  if (!code) return back('missing_code');

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return back('exchange_failed');

  return NextResponse.redirect(`${origin}${next}`);
}
