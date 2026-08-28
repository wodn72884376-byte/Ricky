'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { createClientIfConfigured } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/env';
import { ChevronDown, Lock, PersonOutline } from '@/components/ui/icons';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * 헤더 우측 계정 영역.
 *
 * 비로그인: `로그인` 고스트 버튼 하나
 * 로그인:   프로필 아이콘 → 드롭다운 (내 정보 / 주문 내역 / 1:1 문의 / 로그아웃)
 *
 * 세션은 클라이언트에서 구독한다. 레이아웃에서 서버로 읽으면 홈이 정적 렌더를 잃는다.
 * `onAuthStateChange`는 외부 시스템 구독이므로 effect의 정당한 용도다.
 */

const MENU = [
  { label: '내 정보', href: '/account' },
  { label: '주문 내역', href: '/account/orders' },
  { label: '1:1 문의', href: '/support' },
];

export function AccountMenu({ iconsOnly = false }: { iconsOnly?: boolean } = {}) {
  // 환경 설정 여부는 렌더 시점에 이미 안다(빌드 때 인라인된다).
  // effect에서 setState로 알릴 일이 아니라 초기값이다.
  const configured = hasSupabaseEnv();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(!configured);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Supabase 미설정이면 구독할 것이 없다. 여기서 던지면 헤더가 모든 페이지에
    // 있으므로 사이트 전체 하이드레이션이 죽는다 — 실제로 그렇게 배포가 깨졌다.
    const supabase = createClientIfConfigured();
    if (!supabase) return;

    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setReady(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 바깥 클릭 · Esc로 닫는다. 열려 있을 때만 구독한다.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    await createClientIfConfigured()?.auth.signOut();
    setOpen(false);
  }

  // 세션 확인 전에는 자리만 잡아둔다. 로그인/로그아웃 상태가 깜빡이지 않게.
  if (!ready) return <div aria-hidden="true" className="h-11 w-24" />;
  if (!email) return <SignedOutActions iconsOnly={iconsOnly} />;

  return (
    <AccountDropdown
      email={email}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
      onSignOut={signOut}
      wrapRef={wrapRef}
      firstItemRef={firstItemRef}
      menuId={menuId}
    />
  );
}

/**
 * 비로그인 상태의 어포던스. **하나다** (2026-08-28 운영자 요청).
 *
 * 로그인이 매직링크라 가입과 로그인이 같은 동작이다 — 버튼 두 개는 같은 곳으로 가는
 * 두 개의 문이었고, 고르게 만들 이유가 없었다. 반전 블랙을 쓰지 않는다: 그건 구매 CTA의 몫이다.
 */
export function SignedOutActions({ iconsOnly = false }: { iconsOnly?: boolean }) {
  if (iconsOnly) {
    /* 자물쇠가 아니라 사람 아이콘이다 — 우측 줄은 로그인 여부와 무관하게 "계정" 자리다 */
    return (
      <Link href="/login" className="flex size-11 items-center justify-center text-ink">
        <PersonOutline />
        <span className="sr-only">로그인 · 회원가입</span>
      </Link>
    );
  }

  return (
    <ButtonLink href="/login" variant="ghost" size="md" className="gap-1.5">
      <Lock />
      로그인
    </ButtonLink>
  );
}

/**
 * 표현 전용. 세션을 모르므로 프리뷰에서 열린 상태로 그대로 렌더할 수 있다.
 */
export function AccountDropdown({
  email,
  open,
  onToggle,
  onClose,
  onSignOut,
  wrapRef,
  firstItemRef,
  menuId,
}: {
  email: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
  wrapRef?: React.RefObject<HTMLDivElement | null>;
  firstItemRef?: React.RefObject<HTMLAnchorElement | null>;
  menuId: string;
}) {
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) onToggle();
            requestAnimationFrame(() => firstItemRef?.current?.focus());
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        className="flex size-11 items-center justify-center gap-1 text-ink"
      >
        <span className="sr-only">계정 메뉴{email ? ` (${email})` : ''}</span>
        <PersonOutline />
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-[var(--motion-quick)]',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="계정 메뉴"
          // z-dropdown(100). 스티키 헤더(200)보다 낮지만 헤더 안에 있으므로 쌓임 맥락이 같다.
          className={cn(
            'absolute right-0 top-full z-[var(--z-dropdown)] mt-1 min-w-[200px]',
            'border border-outline bg-paper py-2',
          )}
        >
          {/* 누구로 로그인했는지 먼저 밝힌다 */}
          <p className="truncate px-4 pb-2 text-meta text-muted-text">{email}</p>

          {MENU.map((item, i) => (
            <Link
              key={item.href}
              ref={i === 0 ? firstItemRef : undefined}
              href={item.href}
              role="menuitem"
              onClick={onClose}
              className="flex min-h-11 items-center px-4 text-body text-ink hover:bg-skeleton"
            >
              {item.label}
            </Link>
          ))}

          <hr className="my-2 border-outline" />

          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex min-h-11 w-full items-center px-4 text-left text-body text-muted-text hover:bg-skeleton"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
