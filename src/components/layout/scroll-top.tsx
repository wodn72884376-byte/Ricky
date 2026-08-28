'use client';

import { cn } from '@/lib/utils/cn';

/**
 * 우하단 맨 위로.
 *
 * 이 자리에는 원래 1:1 문의가 있었다. 상시 문의는 헤더 계정 메뉴·푸터·고객센터에 있으므로
 * 화면에 상시로 떠 있을 필요가 없고, 목록이 길어지는 이 스토어에서는
 * 되돌아갈 방법이 더 자주 필요하다 (2026-08-28 운영자 요청).
 *
 * **상시 노출한다** (2026-08-28 운영자 요청). 나타났다 사라지면 필요할 때 그 자리에 있는지
 * 확신할 수 없다 — 위치가 고정된 컨트롤은 찾는 데 시간이 들지 않는다.
 *
 * 반전 블랙이다. 흰 배경에 회색 보더로는 사진 위에서 사라졌다.
 * §4가 반전 블랙을 "화면당 하나"로 제한하지만 그건 **구매 CTA 경쟁**에 대한 규칙이고,
 * 이건 지면 밖에 떠 있는 유틸리티다 — 상품 상세에서도 구매 CTA와 겹쳐 읽히지 않는다.
 *
 * `z-floating(300)`이며 `z-sheet(500)`보다 낮다: 시트가 열리면 가려진다 (DESIGN.md §5).
 */
export function ScrollTop() {
  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          // 모션을 줄이도록 설정한 사용자에게는 즉시 이동한다 (§15-6)
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      }
      className={cn(
        // 모서리에서 한 칸 더 안쪽으로. 가장자리에 붙으면 스크롤바·제스처 영역과 겹친다.
        'fixed bottom-10 right-10 z-[var(--z-floating)]',
        'flex size-11 items-center justify-center',
        'rounded-inverted bg-ink text-paper',
        'hover:bg-[#0a0a0a]',
      )}
    >
      <span className="sr-only">맨 위로</span>
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
      </svg>
    </button>
  );
}
