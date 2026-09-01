'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

/**
 * 상품 섹션의 필터 · 정렬 바.
 *
 * 좌: 카테고리 탭. 우: 정렬 드롭다운. 레퍼런스와 같은 배치다.
 * 탭은 색이 아니라 **웨이트와 밑줄**로 활성을 표시한다 (DESIGN.md §2 — 브랜드 컬러는 흑백).
 *
 * 실제 목록 페이지에서는 이 상태가 URL 검색 파라미터로 나가야 한다 (docs/IA.md §4).
 * 홈에서는 지역 상태로만 동작한다 — 홈은 정적 렌더를 유지해야 하기 때문이다.
 */

export type SortKey = 'recommended' | 'newest' | 'price_low' | 'price_high' | 'discount';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: '추천순' },
  { key: 'newest', label: '신상품순' },
  { key: 'price_low', label: '낮은가격순' },
  { key: 'price_high', label: '높은가격순' },
  { key: 'discount', label: '높은할인순' },
];

export type CategoryTab = { value: string | null; label: string };

export function ProductFilterBar({
  tabs,
  activeTab,
  onTabChange,
  sort,
  onSortChange,
  className,
}: {
  tabs: CategoryTab[];
  activeTab: string | null;
  onTabChange: (value: string | null) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0]!;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-y border-outline',
        className,
      )}
    >
      {/* 카테고리 탭 — 모바일에서는 가로 스크롤 (§8) */}
      <div className="-mx-1 flex flex-1 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onTabChange(tab.value)}
              aria-pressed={active}
              className={cn(
                // 16px (2026-08-31 운영자 요청). 22px(`text-nav`)는 이 바를 헤더 2행처럼
                // 읽히게 만들어서 아래 상품 이름(15px)보다 무거웠다.
                'flex h-12 shrink-0 items-center px-3 text-body whitespace-nowrap',
                active
                  ? 'font-extrabold text-ink underline decoration-2 underline-offset-[14px]'
                  : 'font-normal text-muted-text hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div ref={wrapRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? menuId : undefined}
          // 탭과 같은 바에 있으므로 같은 크기여야 한다 — 한쪽만 바꾸면 바가 기울어 보인다
          className="flex h-12 items-center gap-2 pl-3 text-body text-ink"
        >
          {current.label}
          <ChevronDown
            size={14}
            className={cn('transition-transform duration-[var(--motion-quick)]', open && 'rotate-180')}
          />
        </button>

        {open && (
          <ul
            id={menuId}
            role="listbox"
            aria-label="정렬"
            className="absolute right-0 top-full z-[var(--z-dropdown)] mt-1 min-w-[160px] border border-outline bg-paper py-1"
          >
            {SORT_OPTIONS.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.key === sort}
                  onClick={() => {
                    onSortChange(option.key);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex min-h-11 w-full items-center px-4 text-left text-body hover:bg-skeleton',
                    option.key === sort ? 'font-bold text-ink' : 'font-normal text-ink',
                  )}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
