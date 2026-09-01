import Link from 'next/link';

/**
 * 지면 최상단 고지 바.
 *
 * 검정 지면에 흰 글자 한 줄. 헤더 **위**에 있고 스티키가 아니다 — 스크롤하면 흘러가고
 * 붙어 있는 것은 헤더뿐이다. 상시로 붙어 있으면 44px을 매 화면에서 빼앗는다.
 *
 * 반전 블랙이지만 §4의 "화면당 하나"와 다투지 않는다. 그 규칙은 **구매 CTA 경쟁**에
 * 대한 것이고, 이건 지면이 시작되기 전의 고지다 (플로팅 컨트롤과 같은 범주).
 *
 * 느낌표도, 카운트다운도, 이모지도 없다 (§10). 혜택을 숫자로 한 번 말하고 끝낸다.
 *
 * TODO(points): **적립금 기능이 아직 없다.** `customers` 에 포인트 잔액도, 적립·차감
 *               이력 테이블도 없고 스마트스토어 결제라 사용처도 없다. 지금 이 문장은
 *               지키지 못하는 약속이므로, 적립금을 붙이기 전이라면 이 바를 내리거나
 *               문구를 실제로 줄 수 있는 것으로 바꿔야 한다 (DESIGN.md §12-8).
 */
export function AnnouncementBar() {
  return (
    <aside className="flex h-11 w-full items-center justify-center gap-3 bg-ink px-[var(--gutter-mobile)] text-paper md:px-[var(--gutter-tablet)] lg:px-[var(--gutter-desktop)]">
      <p className="text-meta">회원가입하시면 1,000P를 드립니다</p>
      {/*
        가입과 로그인이 같은 문이다 — 소셜 로그인뿐이라 별도 가입 화면이 없다
        (.omd/preferences.md #5). 처음 온 사람에게는 `회원가입` 이 맞는 이름이다.

        탭 타깃은 바 높이(44px)를 다 쓴다. 문장 안 인라인 링크가 아니라 독립 컨트롤이다.
      */}
      <Link
        href="/login?next=%2F"
        className="flex h-11 items-center text-meta font-bold text-paper underline underline-offset-4"
      >
        회원가입
      </Link>
    </aside>
  );
}
