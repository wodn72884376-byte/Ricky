'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Container } from './container';
import { PRIMARY_NAV, brandHref, type Gender } from '@/lib/nav';
import type { MenuBrand } from '@/lib/catalog';
import { cn } from '@/lib/utils/cn';

/**
 * 상단 카테고리 행 + 메가 드롭다운 (docs/IA.md §2).
 *
 * 브랜드 목록에 들어가 필터를 다시 거는 대신 한 번에 `코치 가방`까지 닿게 한다 —
 * 메가 메뉴가 실제로 값을 하는 몇 안 되는 경우다.
 *
 * **패널 내용은 성별마다 다르다.** 목록은 서버가 카탈로그를 보고 만들어 넘긴다 —
 * 상품이 없는 브랜드·카테고리를 띄우면 눌렀을 때 빈 목록이 나온다 (DESIGN.md §12-8).
 *
 * 패널은 그림자 없이 하단 1px 보더로만 지면과 분리한다 (DESIGN.md §6).
 */
export type GenderMenus = Record<Gender, MenuBrand[]>;

export function MegaMenu({
  activeKey,
  menus,
  condensed = false,
}: {
  activeKey?: string;
  /** 성별별 브랜드·카테고리. 서버에서 카탈로그를 보고 만든다 */
  menus: GenderMenus;
  /** 스크롤 축약 상태 — 편집 메뉴가 작아진다 */
  condensed?: boolean;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  // Esc로 닫고, 바깥을 누르면 닫는다.
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenKey(null);
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenKey(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openKey]);

  // 호버로 열되 잠깐의 유예를 둔다. 마우스가 항목 사이를 지나갈 때 깜빡이지 않게.
  function hoverOpen(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }
  function hoverClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 80);
  }

  const openEntry = PRIMARY_NAV.find((n) => n.key === openKey && n.hasMenu);

  return (
    <div ref={wrapRef} onMouseLeave={hoverClose} className="static">
      <nav aria-label="카테고리" className={cn('flex items-center', condensed ? 'gap-5' : 'gap-7')}>
        {PRIMARY_NAV.map((entry) => {
          const active = activeKey === entry.key;
          const isOpen = openKey === entry.key;

          if (!entry.hasMenu) {
            return (
              <Link
                key={entry.key}
                href={entry.href}
                onMouseEnter={hoverClose}
                className={cn(
                  'flex items-center',
                  condensed ? 'h-11 text-subhead' : 'h-[var(--size-tap-nav)] text-navlead',
                  active ? 'font-extrabold text-ink' : 'font-bold text-ink',
                  /* 호버는 크기로 알린다. 굵기를 바꾸면 글자 폭이 변해 옆 항목이 밀린다 —
                     transform은 레이아웃을 건드리지 않는다 (2026-08-28 운영자 요청) */
                  'origin-bottom-left transition-transform duration-[var(--motion-quick)] ease-out hover:scale-[1.06] motion-reduce:hover:scale-100',
                )}
              >
                {entry.label}
              </Link>
            );
          }

          /*
            트리거는 **링크다.** 버튼으로 두고 클릭에 토글을 걸면, 마우스 사용자는
            호버로 이미 열린 패널을 클릭으로 닫게 된다 — 눌러도 아무 일이 없어 보인다.
            여기서 클릭은 목록으로 가는 동작이고, 패널은 호버·포커스로 연다.
            (이 행은 lg 이상에서만 보인다. 터치 환경은 햄버거 시트를 쓴다.)
          */
          return (
            <Link
              key={entry.key}
              href={entry.href}
              onMouseEnter={() => hoverOpen(entry.key)}
              onFocus={() => hoverOpen(entry.key)}
              onClick={() => setOpenKey(null)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={isOpen ? panelId : undefined}
              className={cn(
                'flex items-center',
                condensed ? 'h-11 text-subhead' : 'h-[var(--size-tap-nav)] text-navlead',
                active || isOpen ? 'font-extrabold text-ink' : 'font-bold text-ink',
                'origin-bottom-left transition-transform duration-[var(--motion-quick)] ease-out hover:scale-[1.06] motion-reduce:hover:scale-100',
              )}
            >
              {entry.label}
            </Link>
          );
        })}
      </nav>

      {openEntry?.hasMenu && (
        <MegaPanel
          /*
            key에 gender를 준다. Men's → Women's로 옮길 때 React가 같은 노드를 재사용하면
            내용만 조용히 바뀌어서 **바뀐 줄을 모른다** (2026-08-28 운영자 지적).
            키가 달라지면 노드가 새로 만들어지고 등장 모션이 다시 돈다.
          */
          key={openEntry.gender}
          id={panelId}
          gender={openEntry.gender}
          brands={menus[openEntry.gender]}
          label={openEntry.label}
          onNavigate={() => setOpenKey(null)}
          onMouseEnter={() => hoverOpen(openEntry.key)}
        />
      )}
    </div>
  );
}

function MegaPanel({
  id,
  gender,
  brands,
  label,
  onNavigate,
  onMouseEnter,
}: {
  id: string;
  gender: Gender;
  brands: MenuBrand[];
  label: string;
  onNavigate: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <div
      id={id}
      onMouseEnter={onMouseEnter}
      aria-label={`${label} 카테고리`}
      /* 헤더 전체 폭을 쓰되 안쪽은 지면 그리드에 정렬한다. 그림자 없이 하단 보더만. */
      className="absolute inset-x-0 top-full z-[var(--z-dropdown)] animate-panel-in border-y border-outline bg-paper"
    >
      <Container className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 md:grid-cols-3 lg:grid-cols-4">
        {brands.map((brand, i) => (
          <div
            key={brand.slug}
            className="animate-panel-in"
            style={{ animationDelay: `calc(${i} * var(--motion-stagger) / 2)` }}
          >
            {/* 컬럼 헤더 = 브랜드. 라틴 표기를 그대로 쓴다 (DESIGN.md §3) */}
            <Link
              href={brandHref(brand.slug, gender)}
              onClick={onNavigate}
              className="flex min-h-11 items-center text-subhead font-bold text-ink"
            >
              {brand.label}
            </Link>
            <hr className="mb-2 border-outline" />
            <ul>
              {brand.categories.map((cat) => (
                <li key={cat.label}>
                  <Link
                    href={brandHref(brand.slug, gender, cat.value)}
                    onClick={onNavigate}
                    className="flex min-h-11 items-center text-body text-ink hover:underline"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </div>
  );
}
