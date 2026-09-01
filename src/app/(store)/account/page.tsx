import Link from 'next/link';
import { Container, NarrowShell } from '@/components/layout/container';
import { Button, ButtonLink } from '@/components/ui/button';
import { formatKoDate } from '@/lib/date';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '내 정보' };

/**
 * 내 정보.
 *
 * 로그인 확인은 `layout.tsx` 가 끝냈다.
 *
 * **프로필 편집 폼을 두지 않는다.** 배송지·연락처는 계정이 아니라 **주문마다** 받기
 * 때문이다 (`orders.contact_email` not null · 20260829000008 B). 여기에 연락처 칸을
 * 만들면 고쳐도 다음 주문에 아무 영향이 없는 죽은 입력이 된다 — 화면은 그 사실을 밝힌다.
 *
 * 이 화면이 실제로 답하는 질문은 하나다: **나는 지금 어떤 계정으로 들어와 있나.**
 * 이메일이 없는 계정이 있어서(네이버·카카오) 그 답이 자명하지 않다.
 */

/** 계정 메뉴(`account-menu.tsx`)의 표기와 같아야 한다 — 같은 계정이 화면마다 다르게 불리면 안 된다 */
const PROVIDER_KO: Record<string, string> = {
  google: '구글',
  kakao: '카카오',
  'custom:naver': '네이버',
};

async function loadProfile() {
  try {
    const supabase = await createClient();
    // RLS `customers_self` 가 본인 행만 통과시킨다. id 를 따로 비교하지 않는다.
    const { data } = await supabase
      .from('customers')
      .select('name, created_at')
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  // 레이아웃이 이미 막았으므로 여기서 null 이면 세션이 방금 끊긴 것이다.
  const user = (await getSessionUser())!;
  const profile = await loadProfile();
  const providerKo = user.provider ? (PROVIDER_KO[user.provider] ?? user.provider) : null;

  return (
    <Container as="section" className="py-12 lg:py-16">
      <NarrowShell width="prose">
        <h1 className="text-headline font-bold">내 정보</h1>

        <dl className="mt-10 border-t border-outline">
          <Row term="로그인 계정">
            {providerKo ? `${providerKo} 계정` : '소셜 계정'}
          </Row>
          <Row term="이메일">
            {user.email ?? (
              /*
                네이버는 `openid`·`profile` 만 주므로 이메일이 없는 회원이 생긴다.
                빈칸으로 두면 "안 불러와졌나" 싶어진다 — 없는 이유를 적는다 (§12-8).
              */
              <span className="text-muted-text">
                {providerKo ?? '이 '} 계정은 이메일을 알려주지 않습니다. 주문하실 때 받을 곳을 적어 주십시오.
              </span>
            )}
          </Row>
          {profile?.name && <Row term="이름">{profile.name}</Row>}
          {profile?.created_at && <Row term="가입일">{formatKoDate(profile.created_at)}</Row>}
        </dl>

        <p className="mt-6 text-meta leading-relaxed text-muted-text">
          받는 분과 연락처, 개인통관고유부호는 계정이 아니라 주문할 때마다 받습니다. 배송지가
          매번 같지 않고, 통관부호는 실제 수령인의 것이어야 하기 때문입니다.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/account/orders" chevron>주문 내역</ButtonLink>
          <ButtonLink href="/support#inquiry">1:1 문의</ButtonLink>
        </div>

        <div className="mt-12 border-t border-outline pt-8">
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="md">로그아웃</Button>
          </form>
          <p className="mt-4 text-meta leading-relaxed text-muted-text">
            계정을 지우시려면{' '}
            <Link href="/support#inquiry" className="text-ink underline underline-offset-4">
              1:1 문의
            </Link>
            로 알려 주십시오. 주문 기록은 전자상거래법에 따라 보관 기간이 지난 뒤에 지웁니다.
          </p>
        </div>
      </NarrowShell>
    </Container>
  );
}

/** 정의 목록 한 줄. 라벨 폭을 고정해 값이 세로로 정렬된다 */
function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline py-5 md:flex-row md:gap-6">
      <dt className="w-28 shrink-0 text-util text-muted-text">{term}</dt>
      <dd className="text-util leading-relaxed text-ink">{children}</dd>
    </div>
  );
}
