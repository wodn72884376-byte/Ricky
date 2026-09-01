'use client';

import { useState } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { createClientIfConfigured } from '@/lib/supabase/client';
import { GoogleMark, KakaoMark, NaverMark } from '@/components/ui/brand-marks';
import { cn } from '@/lib/utils/cn';

/**
 * 소셜 로그인. 구글 · 네이버 · 카카오 셋뿐이다.
 *
 * 이메일 입력이 없다. 비밀번호도, 매직링크도 없다 — 우리가 비밀번호를 저장하지 않고
 * 이메일 인증도 대행하지 않는다는 뜻이다. 폼이 버튼 셋인 게 결함이 아니라 이 방식의 결과다.
 *
 * **버튼 색을 우리 팔레트로 바꾸지 않는다.** DESIGN.md §2가 브랜드 컬러를 금지하지만
 * 이건 우리 색이 아니라 각 사가 정한 자산이다 — 네이버페이 버튼과 같은 예외이며
 * (`scripts/check-contrast.mjs` 의 외부 브랜드 자산 절), 임의로 칠하면 각 사의
 * 로그인 버튼 가이드 위반이다.
 *
 * 대신 규칙이 하나 붙는다: **이 버튼들 위에 설명 문구를 얹지 않는다.**
 * 네이버 초록 위 흰 글자는 2.25:1 이라 라벨 한 단어까지가 한계다.
 */

/** 네이버는 Supabase 기본 제공자가 아니라 커스텀 OIDC다. 대시보드의 식별자와 같아야 한다. */
const NAVER: Provider = 'custom:naver';

const PROVIDERS: {
  id: Provider;
  label: string;
  mark: React.ComponentType<{ size?: number }>;
  className: string;
}[] = [
  {
    id: 'google',
    label: '구글로 계속하기',
    mark: GoogleMark,
    // 구글 가이드의 라이트 테마: 흰 배경 · #747775 보더 · #1f1f1f 라벨
    className: 'bg-white text-[#1f1f1f] border border-[#747775] hover:bg-[#f8f8f8]',
  },
  {
    id: NAVER,
    label: '네이버로 계속하기',
    mark: NaverMark,
    className: 'bg-[#03c75a] text-white hover:bg-[#02b351]',
  },
  {
    id: 'kakao',
    label: '카카오로 계속하기',
    mark: KakaoMark,
    // 카카오 가이드: #fee500 바탕에 검정 라벨(85% 불투명도)
    className: 'bg-[#fee500] text-[rgba(0,0,0,0.85)] hover:bg-[#f2da00]',
  },
];

export function LoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  async function signIn(provider: Provider) {
    setBusy(provider);
    setError('');

    const supabase = createClientIfConfigured();
    if (!supabase) {
      setBusy(null);
      setError('로그인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주십시오.');
      return;
    }

    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    });

    // 성공하면 이 줄에 오지 않는다 — 브라우저가 제공자 화면으로 떠난다.
    if (err) {
      setBusy(null);
      setError('로그인 화면을 열지 못했습니다. 잠시 후 다시 시도해 주십시오.');
    }
  }

  return (
    <>
      <div className="mt-10 flex flex-col gap-3">
        {PROVIDERS.map(({ id, label, mark: Mark, className }) => (
          <button
            key={id}
            type="button"
            onClick={() => signIn(id)}
            disabled={busy !== null}
            className={cn(
              'inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-ghost',
              'text-cta font-bold select-none',
              'transition-colors duration-[var(--motion-quick)] ease-out',
              'disabled:opacity-40 disabled:pointer-events-none',
              className,
            )}
          >
            <Mark />
            {busy === id ? '이동 중' : label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-5 text-body text-error">
          {error}
        </p>
      )}
    </>
  );
}
