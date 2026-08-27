import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 빈 상태 · 로딩 · 경보. DESIGN.md §14의 규칙을 그대로 옮긴 것이다.
 * 일러스트도, 마스코트도, 초록 체크마크도 없다.
 */

/**
 * 부재를 설명하는 한국어 한 줄 + 고스트 CTA 하나.
 * `데이터가 없습니다`를 쓰지 않는다 (§10).
 */
export function EmptyState({
  message,
  action,
  className,
}: {
  message: string;
  /** 찜·장바구니처럼 갈 곳이 있을 때만. 검색·필터 결과에는 버튼을 두지 않는다 */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-6 py-16', className)}>
      <p className="text-body text-ink">{message}</p>
      {action}
    </div>
  );
}

/** 필터·검색 결과 없음. 버튼 없음 — 사용자가 직접 필터를 조정한다 (§14) */
export function EmptyResult({ message = '검색 결과가 없어요' }: { message?: string }) {
  return (
    <p role="status" className="py-12 text-body text-muted-text">
      {message}
    </p>
  );
}

/**
 * 목록 하단 3점 로더. 오버레이도, 스켈레톤도 없다 — 기존 목록은 계속 보인다 (§14).
 */
export function DotsLoader({ label = '불러오는 중' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-1.5 py-8">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="size-1.5 animate-dots rounded-full bg-ink"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * 대시보드 경보. 새 색을 도입하지 않고 `#e8005d` 텍스트 한 줄과
 * 마지막 성공 시각을 `#5d5d5d`로 병기한다 (§14 대시보드 — 수집 실패 경보).
 */
export function AlertLine({ message, detail }: { message: string; detail?: string }) {
  return (
    <p className="text-meta">
      <span className="font-bold text-sale">{message}</span>
      {detail && <span className="text-muted-text"> · {detail}</span>}
    </p>
  );
}

/**
 * 승인 대기 칩. 색이 아니라 반전으로 주의를 끈다 (§14 대시보드 — 승인 대기).
 */
export function InvertedChip({ children }: { children: ReactNode }) {
  return (
    <span
      data-numeric
      className="inline-flex items-center rounded-inverted bg-ink px-2 py-0.5 text-meta font-bold text-paper"
    >
      {children}
    </span>
  );
}
