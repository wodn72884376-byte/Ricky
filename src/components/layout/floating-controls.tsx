import { KakaoChat } from './kakao-chat';
import { ScrollTop } from './scroll-top';

/**
 * 우하단에 상시로 떠 있는 컨트롤 묶음.
 *
 * 좌표를 **여기 한 곳에서만** 잡는다. 버튼마다 `fixed` 를 들면 하나를 옮길 때
 * 다른 하나가 따라오지 않고, 사이 간격이 두 파일에 흩어진다.
 *
 * 순서는 카카오톡 문의가 위, `맨 위로` 가 아래다 (2026-08-31 운영자 요청).
 * 엄지에 가장 가까운 자리는 목록이 길어질수록 자주 쓰는 쪽이 갖는다.
 *
 * `z-floating(300)` 이며 `z-sheet(500)` 보다 낮다: 시트가 열리면 둘 다 가려진다
 * (DESIGN.md §5) — 지면 밖 어포던스 두 개가 시트 위에 떠 있으면 안 된다.
 *
 * 모서리에서 한 칸 더 안쪽으로 둔다. 가장자리에 붙으면 스크롤바·제스처 영역과 겹친다.
 */
export function FloatingControls() {
  return (
    <div className="fixed bottom-10 right-10 z-[var(--z-floating)] flex flex-col items-center gap-3">
      <KakaoChat />
      <ScrollTop />
    </div>
  );
}
