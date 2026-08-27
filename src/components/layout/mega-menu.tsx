'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Container } from './container';
import { BRAND_COLUMNS, PRIMARY_NAV, brandHref, type Gender } from '@/lib/nav';
import { cn } from '@/lib/utils/cn';

/**
 * 상단 카테고리 행 + 메가 드롭다운 (docs/IA.md §2).
 *
 * 3브랜드 × 5카테고리 = 최대 15개 조합이다. 브랜드 목록에 들어가 필터를 다시 거는 대신
 * 한 번에 `코치 가방`까지 닿게 한다 — 메가 메뉴가 실제로 값을 하는 몇 안 되는 경우다.
 *
 * 패널은 그림자 없이 하단 1px 보더로만 지면과 분리한다 (DESIGN.md §6).
 */
export function MegaMenu({
  activeKey,
  condensed = false,
}: {
  activeKey?: string;
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
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
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
                )}
              >
                {entry.label}
              </Link>
            );
          }

          return (
            <button
              key={entry.key}
              type="button"
              onMouseEnter={() => hoverOpen(entry.key)}
              onClick={() => setOpenKey(isOpen ? null : entry.key)}
              onFocus={() => hoverOpen(entry.key)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={isOpen ? panelId : undefined}
              className={cn(
                'flex items-center',
                condensed ? 'h-11 text-subhead' : 'h-[var(--size-tap-nav)] text-navlead',
                active || isOpen ? 'font-extrabold text-ink' : 'font-bold text-ink',
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </nav>

      {openEntry?.hasMenu && (
        <MegaPanel
          id={panelId}
          gender={openEntry.gender}
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
  label,
  onNavigate,
  onMouseEnter,
}: {
  id: string;
  gender: Gender;
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
      className="absolute inset-x-0 top-full z-[var(--z-dropdown)] border-y border-outline bg-paper"
    >
      <Container className="grid grid-cols-3 gap-8 py-10">
        {BRAND_COLUMNS.map((brand) => (
          <div key={brand.slug}>
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
