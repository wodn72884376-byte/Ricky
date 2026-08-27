import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

/**
 * 우하단 상시 문의 컨트롤. 모든 뷰포트에서 유지되는 유일한 컨트롤이다 (DESIGN.md §8).
 *
 * 시각 높이는 31px이지만 **탭 타깃은 44px 이상**이어야 한다 (PRODUCT.md 접근성).
 * 투명 히트 영역을 상하로 확장해서 확보한다 — 보이는 높이를 키우지 않는다.
 *
 * z-floating(300)이며 z-sheet(500)보다 낮다. 시트가 열리면 가려진다 —
 * 두 개의 어포던스가 동시에 떠 있으면 안 된다 (§5 Z-Index).
 */
export function FloatingInquiry({
  /** 모바일 하단 고정 구매 바가 있는 화면에서는 그 위로 띄운다 */
  liftedForBottomBar = false,
}: {
  liftedForBottomBar?: boolean;
}) {
  return (
    <Link
      href="/support"
      // TODO(channel): 상담 채널 미정 — 네이버 톡톡 / 카카오채널 / 자사 폼 (BRIEF §9)
      className={cn(
        'fixed right-6 z-[var(--z-floating)]',
        liftedForBottomBar ? 'bottom-[calc(52px+24px+24px)]' : 'bottom-6',
        // 히트 영역 44px: 시각 31px + 상하 7px 투명 패딩
        'flex h-11 items-center',
      )}
    >
      <span
        className={cn(
          'inline-flex h-[31px] items-center rounded-inverted bg-ink py-1 pl-3.5 pr-2',
          'text-body text-paper',
          'transition-colors duration-[var(--motion-quick)] hover:bg-[#0a0a0a]',
        )}
      >
        1:1 문의
      </span>
    </Link>
  );
}
