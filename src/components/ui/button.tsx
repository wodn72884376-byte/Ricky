import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronRight } from './icons';

/**
 * 버튼은 두 종류뿐이다 (DESIGN.md §4).
 *
 *   ghost    흰 배경 · 1px #c4c4c4 · 4px 반경 · 14px/700 · 52px — 주력
 *   inverted 검정 배경 · 흰 텍스트 · 2px 반경 — **화면당 하나**
 *
 * 세 번째 변형을 만들고 싶으면 DESIGN.md §4를 먼저 고친다.
 * 반전 블랙은 비싸다 — 홈·목록에는 두지 않는다(BRIEF §6).
 */

type Variant = 'ghost' | 'inverted' | 'on-image';
type Size = 'lg' | 'md' | 'sm';

const BASE =
  'inline-flex items-center justify-center gap-2 font-sans select-none ' +
  'transition-colors duration-[var(--motion-quick)] ease-out ' +
  'disabled:opacity-40 disabled:pointer-events-none';

const VARIANT: Record<Variant, string> = {
  // 호버는 채움이 아니라 보더가 검게 어두워진다 — 변화는 선언되지 않고 감지된다 (§15-3)
  ghost:
    'bg-paper text-ink border border-outline rounded-ghost ' +
    'hover:border-ink',
  // 배경이 4% 밝아진다. 변형도, 그림자 추가도 없다 (§15-4)
  inverted:
    'bg-ink text-paper rounded-inverted ' +
    'hover:bg-[#0a0a0a]',
  // 사진 위 스크림에 얹는 고스트의 거울상. 흰 보더·흰 글자·투명 배경.
  // 호버 시 흰색으로 채워지고 글자가 검게 반전된다 (§6 Inverted의 같은 원리).
  'on-image':
    'bg-transparent text-paper border border-paper rounded-ghost ' +
    'hover:bg-paper hover:text-ink',
};

const SIZE: Record<Size, string> = {
  // 52px — 고스트 CTA·구매 CTA·박스형 입력이 공유하는 컨트롤 높이
  lg: 'h-13 px-5 text-cta font-bold',
  // 44px — 52px 헤더 안에 들어가는 컴팩트 컨트롤. 탭 타깃 하한과 같은 값이라
  // 별도 히트영역 확장이 필요 없다 (회원가입 등).
  md: 'h-11 px-4 text-cta font-bold',
  // 31px는 그려지는 높이다. 히트 영역은 의사요소로 상하 7px씩 확장해 44px를 확보한다 —
  // 보이는 높이를 키우지 않으면서 탭 타깃만 넓히는 방법 (DESIGN.md §5 size-control-sm).
  sm:
    'relative h-[31px] px-3.5 text-body font-normal ' +
    "after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-['']",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  /** 고스트 버튼의 후행 셰브런. 마케팅 surface에서 체계적으로 쓰는 유일한 아이콘 */
  chevron?: boolean;
  children: ReactNode;
  className?: string;
};

function classes({ variant = 'ghost', size = 'lg', className }: BaseProps) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export function Button({
  variant = 'ghost',
  size = 'lg',
  chevron,
  children,
  className,
  ...props
}: BaseProps & Omit<ComponentProps<'button'>, 'children' | 'className'>) {
  return (
    <button className={classes({ variant, size, children, className })} {...props}>
      {children}
      {chevron && <ChevronRight />}
    </button>
  );
}

export function ButtonLink({
  variant = 'ghost',
  size = 'lg',
  chevron,
  children,
  className,
  ...props
}: BaseProps & Omit<ComponentProps<typeof Link>, 'children' | 'className'>) {
  return (
    <Link className={classes({ variant, size, children, className })} {...props}>
      {children}
      {chevron && <ChevronRight />}
    </Link>
  );
}
