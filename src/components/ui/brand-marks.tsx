/**
 * 소셜 로그인 제공자의 브랜드 마크.
 *
 * **`icons.tsx` 와 분리한다.** 우리 아이콘은 선으로만 그리고 채우지 않으며 획 두께가
 * 1.5로 통일돼 있다 (DESIGN.md §4 Navigation). 여기 있는 것들은 우리 자산이 아니라
 * 구글·네이버·카카오가 정한 자산이라 그 규칙을 적용할 수 없다 — 색도, 형태도, 비율도
 * 그쪽이 정한다. 같은 파일에 두면 다음 사람이 이걸 우리 아이콘 규칙에 맞춰 "고친다".
 *
 * 대비 수치는 `npm run design:contrast` 의 외부 브랜드 자산 절에 계속 노출된다.
 */

/** 구글 G. 4색 고정 — 단색 변형은 구글 브랜드 가이드가 금지한다. */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

/** 네이버 N. 초록 바탕 위 흰 마크로만 쓴다. */
export function NaverMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path fill="#ffffff" d="M13.5615 10.6842 6.1627 0H0v20h6.4385V9.3148L13.8373 20H20V0h-6.4385z" />
    </svg>
  );
}

/** 카카오 말풍선. 노랑 바탕 위 검정 마크로만 쓴다. */
export function KakaoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#000000"
        d="M12 3C6.9 3 3 6.3 3 10.3c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.5.1 1.1.1 1.6.1 5.1 0 9-3.3 9-7.3S17.1 3 12 3z"
      />
    </svg>
  );
}
