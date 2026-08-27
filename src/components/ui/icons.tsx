/**
 * 아이콘은 **기능 컨트롤에만** 쓴다 (DESIGN.md §4 Decorative Elements).
 * 히어로·편집 surface의 장식 아이콘 금지는 여전히 유효하다.
 * 유니코드 `>`나 이모지를 아이콘 자리에 쓰지 않는다 — 폰트마다 모양과 두께가 달라진다.
 *
 * 마케팅 surface의 장식 아이콘은 여전히 금지다. 여기 있는 것은 전부 **기능 컨트롤**이며,
 * 셰브런(더보기·드롭다운)과 계정 메뉴 트리거뿐이다.
 * 새 아이콘을 추가하려면 DESIGN.md를 먼저 고친다. 획 두께는 1.5로 통일한다.
 */

type IconProps = {
  className?: string;
  /** 픽셀 크기. 기본 16 */
  size?: number;
};

export function ChevronRight({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

export function ChevronDown({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M3.5 6 8 10.5 12.5 6" />
    </svg>
  );
}

/** 계정 메뉴 트리거. 채우지 않고 선으로만 그린다 — 셰브런과 같은 획 두께. */
export function PersonOutline({ className, size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="10" cy="6.75" r="3.25" />
      <path d="M3.75 16.5c0-2.9 2.8-4.75 6.25-4.75s6.25 1.85 6.25 4.75" />
    </svg>
  );
}

/** 찜 — 상품 카드 · 유틸리티. `filled`로 활성 상태를 표시한다. */
export function Heart({ className, size = 20, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      <path d="M10 16.5S3.25 12.5 3.25 7.9a3.4 3.4 0 0 1 6.75-.6 3.4 3.4 0 0 1 6.75.6c0 4.6-6.75 8.6-6.75 8.6Z" />
    </svg>
  );
}

/** 장바구니 */
export function Bag({ className, size = 20 }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      <path d="M4.5 6.5h11l-.9 10.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8L4.5 6.5Z" />
      <path d="M7.25 8.25v-2a2.75 2.75 0 0 1 5.5 0v2" />
    </svg>
  );
}

/** 로그인 — 자물쇠 */
export function Lock({ className, size = 20 }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      <rect x="4.25" y="8.75" width="11.5" height="7.5" rx="1.25" />
      <path d="M6.75 8.75V6.5a3.25 3.25 0 0 1 6.5 0v2.25" />
    </svg>
  );
}

/** 검색 */
export function Search({ className, size = 20 }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      <circle cx="9" cy="9" r="5.25" />
      <path d="m12.9 12.9 3.35 3.35" />
    </svg>
  );
}

/** 주문조회 — 상자 */
export function Box({ className, size = 20 }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      <path d="M10 3.25 16.25 6.5v7L10 16.75 3.75 13.5v-7L10 3.25Z" />
      <path d="M3.75 6.5 10 9.75l6.25-3.25M10 9.75v7" />
    </svg>
  );
}

/* ── 관리자 사이드바 ──
   접힌 상태에서는 아이콘만 남으므로 라벨 없이도 구분돼야 한다.
   전부 획 1.5, 20×20 뷰박스로 통일한다. */

export function Grid({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="3.25" y="3.25" width="5.5" height="5.5" rx="1" />
      <rect x="11.25" y="3.25" width="5.5" height="5.5" rx="1" />
      <rect x="3.25" y="11.25" width="5.5" height="5.5" rx="1" />
      <rect x="11.25" y="11.25" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

export function Tag({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3.25 3.25h5.4l8.1 8.1-5.4 5.4-8.1-8.1V3.25Z" />
      <circle cx="6.4" cy="6.4" r="1.1" />
    </svg>
  );
}

export function Layers({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="m10 2.75 7 3.5-7 3.5-7-3.5 7-3.5Z" />
      <path d="m3 10 7 3.5L17 10M3 13.75l7 3.5 7-3.5" />
    </svg>
  );
}

export function Receipt({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M4.75 2.75h10.5v14.5l-2.6-1.5-2.65 1.5-2.65-1.5-2.6 1.5V2.75Z" />
      <path d="M7.5 6.75h5M7.5 9.75h5" />
    </svg>
  );
}

export function Radar({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 10 14.5 5.5" />
    </svg>
  );
}

export function Chart({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3.25 16.75h13.5" />
      <path d="M6 13.5V9M10 13.5V4.5M14 13.5v-6" />
    </svg>
  );
}

export function Gear({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.75v2M10 15.25v2M4.87 4.87l1.42 1.42M13.71 13.71l1.42 1.42M2.75 10h2M15.25 10h2M4.87 15.13l1.42-1.42M13.71 6.29l1.42-1.42" />
    </svg>
  );
}

export function Chat({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3.25 5.5A1.75 1.75 0 0 1 5 3.75h10A1.75 1.75 0 0 1 16.75 5.5v6A1.75 1.75 0 0 1 15 13.25H8l-4.75 3.5V5.5Z" />
    </svg>
  );
}

export function PanelLeft({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="1.5" />
      <path d="M7.75 3.75v12.5" />
    </svg>
  );
}
