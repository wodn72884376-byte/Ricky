import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 지면. 모든 최상위 섹션이 **같은 컨테이너**를 쓴다 —
 * 섹션마다 패딩을 다르게 주면 뷰포트가 넓을 때 좌우 가장자리가 어긋난다.
 *
 * **폭 제한이 없다.** 화면 끝까지 쓰고 가터로만 여백을 만든다 (DESIGN.md §5).
 * 사진이 무게를 지는 지면에서 1280px 캡은 큰 화면에서 사진을 작게 만든다.
 *
 * 읽기 위한 텍스트는 컨테이너를 다 쓰지 않는다 — `NarrowShell`을 쓴다.
 */
export function Container({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'main' | 'nav';
}) {
  return (
    <Tag
      className={cn(
        'w-full',
        'px-[var(--gutter-mobile)] md:px-[var(--gutter-tablet)] lg:px-[var(--gutter-desktop)]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** 폼·산문은 컨테이너를 다 쓰지 않는다. 읽기 폭 640px, 좁은 폼 480px (§5). */
export function NarrowShell({
  children,
  width = 'prose',
  className,
}: {
  children: ReactNode;
  width?: 'prose' | 'form';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        width === 'prose' ? 'max-w-[var(--measure-prose)]' : 'max-w-[var(--measure-form)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
