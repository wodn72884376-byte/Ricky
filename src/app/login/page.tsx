import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { ChevronRight } from '@/components/ui/icons';

/**
 * 로그인 · 회원가입.
 *
 * 레퍼런스의 **분할 화면**을 가져왔다 — 왼쪽 전면 사진, 오른쪽 폼. 이 브랜드는 사진이
 * 무게를 지므로 인증 화면에서도 사진을 버리지 않는다.
 *
 * 가져오지 않은 것: 그라디언트 배경, 12px 반경, 파란 링크, 소셜 로그인 버튼.
 * 소셜 로그인은 Supabase provider 설정이 선행돼야 한다 — 눌러도 안 되는 버튼을 두지 않는다.
 *
 * 비밀번호가 없으므로 `비밀번호 찾기`·`로그인 유지`도 없다.
 * 로그인과 회원가입은 **같은 동작**이다. `mode=signup`은 문구만 바꾼다.
 */
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const signup = (await searchParams).mode === 'signup';

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* 왼쪽 — 사진. 모바일에서는 짧은 배너로 접힌다. */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-skeleton lg:h-auto lg:w-1/2 lg:flex-1">
        <Image
          src="/images/gateways/arcteryx.webp"
          alt="큰 배낭을 멘 사람이 아침 안개가 걸린 능선에 서서 골짜기를 내려다보고 있다"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>

      {/* 오른쪽 — 폼 */}
      <div className="flex flex-1 items-center justify-center px-5 py-16 lg:px-12">
        <div className="w-full max-w-[400px]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-cta font-bold text-ink"
          >
            <ChevronRight className="rotate-180" />
            RICKY
          </Link>

          <h1 className="mt-8 text-headline font-bold">{signup ? '회원가입' : '로그인'}</h1>
          <p className="mt-3 text-body text-muted-text">
            {signup
              ? '이메일만 있으면 돼요. 비밀번호는 만들지 않아요.'
              : '비밀번호 없이 이메일로 로그인 링크를 보내드려요.'}
          </p>

          <LoginForm signup={signup} />

          <hr className="my-10 border-outline" />

          <p className="text-body text-muted-text">
            {signup ? '이미 계정이 있으세요? ' : '아직 계정이 없으세요? '}
            <Link
              href={signup ? '/login' : '/login?mode=signup'}
              className="font-bold text-ink underline underline-offset-4"
            >
              {signup ? '로그인' : '회원가입'}
            </Link>
          </p>
          {/* 매직링크는 계정 유무를 구분하지 않는다. 그 사실을 숨기지 않는다. */}
          <p className="mt-3 text-meta text-muted-text">
            {signup
              ? '이미 가입한 이메일이면 그대로 로그인돼요.'
              : '처음 보는 이메일이면 계정이 함께 만들어져요.'}
          </p>

          <p className="mt-10 text-meta text-muted-text">
            가입하면{' '}
            <Link href="/policy/terms" className="text-ink underline underline-offset-4">
              이용약관
            </Link>
            {' '}과{' '}
            <Link href="/policy/privacy" className="text-ink underline underline-offset-4">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 봐요.
          </p>
        </div>
      </div>
    </div>
  );
}
