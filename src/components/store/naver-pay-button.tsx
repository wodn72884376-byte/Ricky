/**
 * 네이버페이 구매 버튼.
 *
 * RICKY는 자체 결제를 두지 않는다. 결제·정산·개인통관고유부호 수집·주문 관리는
 * 스마트스토어가 하고, 이 버튼은 그 상품 페이지로 보내는 유일한 경로다
 * (2026-08-28 운영자 결정).
 *
 * **이 초록(`#03C75A`)은 DESIGN.md §2의 "브랜드 컬러 없음"에 대한 유일한 예외다.**
 * 네이버페이 버튼은 색·비율·표기가 정해진 외부 브랜드 자산이라 우리 팔레트로 다시 칠할 수 없다.
 * 예외를 좁게 유지하는 방법은 하나뿐이다 — **이 컴포넌트 밖에서 이 색을 쓰지 않는다.**
 *
 * 새 탭으로 연다. 같은 탭이면 상세 페이지가 사라져서 사이즈·검수 사진을 다시 볼 수 없다.
 * `rel="noopener"`는 필수다 — 없으면 열린 페이지가 `window.opener`로 이 창을 조작할 수 있다.
 */
export function NaverPayButton({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-pressable
      className={
        'flex h-13 w-full items-center justify-center gap-2 rounded-inverted ' +
        'bg-[#03C75A] text-cta font-bold text-white no-underline ' +
        'transition-colors duration-[var(--motion-quick)] hover:bg-[#02B151] ' +
        (className ?? '')
      }
    >
      {/* 네이버 워드마크 자리의 대문자 N — 네이버페이 버튼의 고정 표기다 */}
      <span aria-hidden="true" className="text-[17px] font-extrabold leading-none">
        N
      </span>
      <span>Pay로 구매하기</span>
      {/* 새 탭으로 열린다는 사실을 스크린리더에도 알린다 */}
      <span className="sr-only">(스마트스토어 새 창)</span>
    </a>
  );
}
