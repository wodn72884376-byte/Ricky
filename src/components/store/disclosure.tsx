'use client';

import { useId, useState } from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

/**
 * 접이식 섹션 (배송 정보 · 교환 반품 등).
 *
 * `<details>`를 쓰지 않는 이유는 열림 상태에 모션을 주고 셰브런을 회전시키기 위함이다.
 * 대신 aria-expanded / aria-controls로 같은 의미를 만든다.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className="border-b border-outline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-util font-bold text-ink">{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-muted-text transition-transform duration-[var(--motion-quick)]',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div id={id} className="pb-6 text-util leading-relaxed text-ink">
          {children}
        </div>
      )}
    </div>
  );
}
