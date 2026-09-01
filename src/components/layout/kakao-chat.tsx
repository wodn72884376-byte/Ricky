import { KakaoMark } from '@/components/ui/brand-marks';

/**
 * 카카오톡 1:1 채팅.
 *
 * **SDK 를 쓰지 않는다.** `Kakao.Channel.createChatButton()` 은 (1) 카카오 JS 키로
 * `Kakao.init()` 을 먼저 해야 하고, (2) 모든 화면에 외부 스크립트를 얹으며,
 * (3) 카카오가 정한 크기의 버튼 이미지를 주입해서 옆의 `맨 위로` 와 크기가 맞지 않는다.
 * 그 함수가 실제로 하는 일은 채널 채팅 주소로 가는 링크를 그리는 것뿐이고,
 * 그 주소는 카카오가 공식으로 안내하는 값이다 — 그래서 링크로 직접 건다.
 *
 * 색은 `#FEE500` 고정이다. 우리 색이 아니라 카카오가 정한 자산이라 다시 칠할 수 없다
 * (.omd/preferences.md #13 — 네이버·카카오 로그인 버튼과 같은 범주).
 * 노란 원반 자체는 흰 지면 위에서 1.35:1 이지만, 이 컨트롤을 식별하는 것은 그 안의
 * 검은 말풍선(16.42:1)이다 — 그래서 마크를 지우거나 흰색으로 바꾸지 않는다.
 *
 * 대비 수치는 `npm run design:contrast` 의 외부 브랜드 자산 절에 계속 노출된다.
 */

/**
 * 채널 공개 ID. 운영자가 준 채널 주소 `pf.kakao.com/_vuDxaX/chat` 에서 가져왔다.
 * (같이 받은 코드의 `_ZeUTxl` 은 카카오 문서의 예제값이라 쓰지 않는다.)
 */
const CHANNEL_ID = '_vuDxaX';

export function KakaoChat() {
  return (
    <a
      href={`https://pf.kakao.com/${CHANNEL_ID}/chat`}
      // 카카오톡 앱(모바일)·채널 웹챗(데스크톱)으로 나간다. 스토어를 덮지 않는다.
      target="_blank"
      rel="noreferrer noopener"
      data-pressable
      className="flex size-11 items-center justify-center rounded-inverted bg-[#FEE500] hover:brightness-[0.96]"
    >
      <span className="sr-only">카카오톡으로 문의하기</span>
      <KakaoMark size={22} />
    </a>
  );
}
