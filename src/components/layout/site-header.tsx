'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useCondensedHeader } from '@/lib/use-condensed-header';
import { createPortal } from 'react-dom';
import { Container } from './container';
import { Bag, ChevronDown, Search } from '@/components/ui/icons';
import { AccountMenu } from './account-menu';
import { MegaMenu, type GenderMenus } from './mega-menu';
import { SearchBar } from './search-bar';
import { BRAND_COLUMNS, PRIMARY_NAV, brandHref, brandShort } from '@/lib/nav';
import { getLines, getLinesOnServer, subscribe } from '@/lib/cart-store';
import { cn } from '@/lib/utils/cn';

/**
 * 글로벌 헤더 (docs/IA.md §2).
 *
 * 브랜드 3개를 **상시 노출**한다. 홈이 브랜드 3분할 관문 구조라, 사이즈를 찾아온 사람이
 * 관문 3개를 스크롤하지 않고 목록으로 갈 수 있어야 한다 (BRIEF §6 경로 B).
 *
 * 주문 확인은 `주문 내역`뿐이다 — 회원 전용 전환(2026-08-29)으로 비회원 조회 경로가 없어졌다.
 *
 * 로고는 중앙, 유틸리티는 16px/weight 200. 활성 항목만 800 (DESIGN.md §4 Navigation).
 */

// 모바일 시트에만 남기는 항목. 헤더 우측은 아이콘 셋으로 줄였다 (아래 Utilities).
const UTILITY = [{ label: '주문 내역', href: '/account/orders' }];

/**
 * 헤더 우측 유틸리티.
 *
 * **아이콘만 둔다** — 계정과 장바구니 둘뿐이다 (2026-08-28 레퍼런스).
 * 라벨을 붙이면 우측이 문장처럼 읽혀서 2행 편집 메뉴와 무게를 다툰다.
 *
 * 여기서 뺀 것들이 사라진 건 아니다:
 *   검색   → 2행 우측 입력 상자 (§ SearchBar). 축약·모바일에서만 아이콘으로 돌아온다
 *   주문 내역 → 계정 드롭다운 · 푸터 · 모바일 시트. 회원 전용이라 계정 메뉴가 제자리다
 *   찜     → 없앴다. 담아 두는 곳은 장바구니 하나다
 */
function Utilities({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {/* 2행 검색 상자가 없는 축약·모바일에서만 아이콘으로 대체한다 */}
      {compact && (
        <Link href="/search" className="flex size-11 items-center justify-center text-ink">
          <Search />
          <span className="sr-only">검색</span>
        </Link>
      )}
      {/*
        결제는 스마트스토어에서 상품 하나씩 일어나지만 장바구니는 남는다 —
        배송비가 상품마다 정해져 있으니 담아 두면 합계를 알 수 있다 (2026-08-28 운영자 지적).
      */}
      <AccountMenu iconsOnly />
      <Link href="/cart" className="relative flex size-11 items-center justify-center text-ink">
        <Bag />
        <span className="sr-only">장바구니</span>
        <CartCount />
      </Link>
    </div>
  );
}

/**
 * 장바구니 개수. 저장소가 localStorage라 **서버에서는 0이다** —
 * 헤더 전체를 클라이언트 상태에 묶지 않고 이 숫자만 구독한다.
 */
function CartCount() {
  const lines = useSyncExternalStore(subscribe, getLines, getLinesOnServer);
  const n = lines.reduce((s, l) => s + l.qty, 0);
  if (n === 0) return null;
  /* 아이콘만 남은 줄이라 개수는 배지로 붙인다. 0이면 아예 그리지 않는다 */
  return (
    <span
      data-numeric
      className="absolute right-1.5 top-1.5 min-w-[15px] rounded-full bg-ink px-1 text-center
                 text-[10px] font-bold leading-[15px] text-paper"
    >
      {n}
    </span>
  );
}

/** 현재 경로에서 활성 내비 키를 고른다. */
function activeKey(pathname: string): string | undefined {
  if (pathname.startsWith('/best')) return 'best';
  return undefined;
}

export function SiteHeader({ menus }: {
  /** 성별별 브랜드·카테고리. 서버가 카탈로그를 보고 만든다 (§ MegaMenu) */
  menus: GenderMenus;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // 시트가 열려 있는 동안 뒤 지면이 스크롤되지 않게 한다
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  // Esc로 닫는다 — 시트에 갇히지 않게
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const condensed = useCondensedHeader();

  // 브랜드가 7개다. 좁은 데스크톱에서는 줄바꿈 대신 가로 스크롤로 흘린다 —
  // 내비 행이 두 줄이 되면 헤더 높이가 흔들리고 스티키 계산이 깨진다.
  const brandRow = (
    <div className="flex min-w-0 items-center gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {BRAND_COLUMNS.map((brand) => (
        <Link
          key={brand.slug}
          href={brandHref(brand.slug)}
          className={cn(
            'flex shrink-0 items-center',
            condensed ? 'h-9 text-util' : 'h-11 text-nav',
            pathname.startsWith(`/brands/${brand.slug}`)
              ? 'font-extrabold text-ink'
              : 'font-semibold text-ink',
            /* 2행과 같은 호버 규칙 — 크기로만 알린다 (§ MegaMenu) */
            'origin-bottom-left transition-transform duration-[var(--motion-quick)] ease-out hover:scale-[1.06] motion-reduce:hover:scale-100',
          )}
        >
          {brandShort(brand)}
        </Link>
      ))}
      <span aria-hidden="true" className="h-3 w-px shrink-0 bg-outline" />
      <Link href="/guide/sizing" className={cn('flex shrink-0 items-center font-semibold text-ink', condensed ? 'h-9 text-util' : 'h-11 text-nav', 'origin-bottom-left transition-transform duration-[var(--motion-quick)] ease-out hover:scale-[1.06] motion-reduce:hover:scale-100',)}>
        Sizing
      </Link>
      <Link href="/guide/customs" className={cn('flex shrink-0 items-center font-semibold text-ink', condensed ? 'h-9 text-util' : 'h-11 text-nav', 'origin-bottom-left transition-transform duration-[var(--motion-quick)] ease-out hover:scale-[1.06] motion-reduce:hover:scale-100',)}>
        Customs
      </Link>
    </div>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] border-b border-outline bg-paper',
        'transition-[height] duration-[var(--motion-standard)] ease-out',
      )}
    >
      {/* 축약 — 로고가 좌측으로 이동하고 두 행이 그 옆에 붙는다. 유틸리티는 아이콘만 남는다. */}
      {condensed ? (
        <Container className="hidden h-[106px] items-center gap-10 lg:flex">
          <Link href="/" className="flex min-h-11 shrink-0 items-center text-nav font-extrabold tracking-tight text-ink">
            RICKY
          </Link>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <MegaMenu activeKey={activeKey(pathname)} menus={menus} condensed />
            {brandRow}
          </div>
          <Utilities compact />
        </Container>
      ) : (
        <>
          {/* 1행 — 워드마크(좌) + 유틸리티(우) */}
          <Container className="hidden h-20 items-center justify-between gap-4 pt-6 lg:flex">
            <Link href="/" className="flex min-h-11 items-center text-subhead font-extrabold tracking-tight text-ink">
              RICKY
            </Link>
            <Utilities />
          </Container>

          {/* 2행 — 편집형 대형 메뉴(좌) + 검색(우) */}
          <div className="hidden lg:block">
            <Container className="flex h-24 items-center justify-between gap-10">
              <MegaMenu activeKey={activeKey(pathname)} menus={menus} />
              <SearchBar className="shrink-0" />
            </Container>
          </div>

          {/* 3행 — 브랜드 */}
          <Container className="hidden h-14 items-center pb-2 lg:flex">{brandRow}</Container>
        </>
      )}

      {/* 모바일 — 축약과 무관하게 한 행 */}
      <Container className="flex h-16 items-center justify-between gap-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-expanded={sheetOpen}
          aria-controls="nav-sheet"
          className="-ml-2 flex size-11 items-center justify-center"
        >
          <span className="sr-only">메뉴 열기</span>
          <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
            <span className="h-px bg-ink" />
            <span className="h-px bg-ink" />
            <span className="h-px bg-ink" />
          </span>
        </button>
        <Link href="/" className="flex min-h-11 items-center text-nav font-extrabold tracking-tight text-ink">
          RICKY
        </Link>
        <Utilities compact />
      </Container>

      {sheetOpen && (
        <MobileSheet utility={UTILITY} menus={menus} onClose={() => setSheetOpen(false)} />
      )}
    </header>
  );
}

/**
 * 전체화면 시트.
 *
 * **body로 포털한다.** 헤더가 `sticky z-sticky(200)`이라 자체 쌓임 맥락을 만들고,
 * 그 안에서는 `z-sheet(500)`을 줘도 헤더 밖의 `z-floating(300)`을 못 넘는다.
 * 그러면 시트 위에 문의 버튼이 떠서 §5의 "두 어포던스가 동시에 떠 있으면 안 된다"가 깨진다.
 * z-index 값의 문제가 아니라 맥락의 문제이므로 값을 올려도 해결되지 않는다.
 */
function MobileSheet({
  utility,
  menus,
  onClose,
}: {
  utility: typeof UTILITY;
  menus: GenderMenus;
  onClose: () => void;
}) {
  // 마운트 가드가 필요 없다 — 이 컴포넌트는 sheetOpen이 true일 때만 렌더되고,
  // 그건 사용자 클릭 이후이므로 항상 클라이언트다. SSR 중에는 렌더되지 않는다.
  return createPortal(
    <div
      id="nav-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
      className="fixed inset-0 z-[var(--z-sheet)] flex flex-col bg-paper"
    >
      <Container className="flex h-[var(--size-tap-nav)] items-center justify-end">
        <button type="button" onClick={onClose} className="flex size-11 items-center justify-center">
          <span className="sr-only">메뉴 닫기</span>
          <span aria-hidden="true" className="relative block size-4">
            <span className="absolute inset-x-0 top-1/2 h-px rotate-45 bg-ink" />
            <span className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-ink" />
          </span>
        </button>
      </Container>

      {/* 데스크톱과 같은 위계를 유지한다 — 모바일이라고 항목을 줄이지 않는다 (§4) */}
      <Container className="flex flex-col gap-1 overflow-y-auto pb-16 pt-4">
        {PRIMARY_NAV.filter((n) => !n.hasMenu).map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            onClick={onClose}
            className="flex h-[var(--size-tap-nav)] items-center text-subhead font-bold text-ink"
          >
            {entry.label}
          </Link>
        ))}

        {/* 성별 축은 아코디언으로 편다. 데스크톱 메가 패널과 같은 내용이다. */}
        {PRIMARY_NAV.filter((n) => n.hasMenu).map((entry) => (
          <details key={entry.key} className="border-b border-outline last:border-b-0">
            <summary className="flex h-[var(--size-tap-nav)] cursor-pointer list-none items-center justify-between text-subhead font-bold text-ink">
              {entry.label}
              <ChevronDown />
            </summary>
            <div className="flex flex-col gap-5 pb-6 pl-1">
              {menus[entry.gender].map((brand) => (
                <div key={brand.slug}>
                  <Link
                    href={brandHref(brand.slug, entry.gender)}
                    onClick={onClose}
                    className="flex min-h-11 items-center text-body font-bold text-ink"
                  >
                    {brand.label}
                  </Link>
                  <ul className="pl-3">
                    {brand.categories.map((cat) => (
                      <li key={cat.label}>
                        <Link
                          href={brandHref(brand.slug, entry.gender, cat.value)}
                          onClick={onClose}
                          className="flex min-h-11 items-center text-body text-muted-text"
                        >
                          {cat.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}

        <hr className="my-4 border-outline" />
        {utility.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex h-[var(--size-tap-nav)] items-center text-nav font-normal text-ink"
          >
            {item.label}
          </Link>
        ))}
        {[
          { label: '내 정보', href: '/account' },
          { label: '1:1 문의', href: '/support' },
          { label: '로그인', href: '/login' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex h-[var(--size-tap-nav)] items-center text-nav font-normal text-ink"
          >
            {item.label}
          </Link>
        ))}
      </Container>
    </div>,
    document.body,
  );
}
