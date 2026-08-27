'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Heart } from '@/components/ui/icons';
import { isSaved, isSavedOnServer, subscribe, toggle } from '@/lib/wishlist-store';
import { cn } from '@/lib/utils/cn';

/**
 * 찜 토글.
 *
 * 저장은 `src/lib/wishlist-store.ts`가 맡는다 — localStorage는 React 바깥의 외부 스토어이므로
 * `useSyncExternalStore`로 읽는다.
 *
 * 활성 표시는 색이 아니라 **반전**이다 (DESIGN.md §14 Success 인라인).
 * 흰 칩 위 검은 하트 → 검은 칩 위 흰 하트.
 */

export function WishlistButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  /** 스크린리더가 어떤 상품인지 알 수 있게 한다 */
  productName: string;
  className?: string;
}) {
  const saved = useSyncExternalStore(
    subscribe,
    useCallback(() => isSaved(productId), [productId]),
    isSavedOnServer,
  );

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={saved}
      className={cn(
        // z-raised — 카드 전체를 덮는 stretched link 위에 떠 있어야 누를 수 있다
        'absolute bottom-2 right-2 z-[var(--z-raised)] flex size-11 items-center justify-center',
        className,
      )}
    >
      <span className="sr-only">
        {productName} {saved ? '찜 해제' : '찜하기'}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 items-center justify-center rounded-inverted',
          'transition-colors duration-[var(--motion-quick)]',
          saved ? 'bg-ink text-paper' : 'bg-paper text-ink',
        )}
      >
        <Heart filled={saved} />
      </span>
    </button>
  );
}
