/**
 * 크롬 확장 매니페스트.
 *
 * 북마클릿이 하는 일을 **같은 브라우저 안에서 타이머로** 돌린다. 세션도, 권한 상황도,
 * 읽는 페이지도 북마클릿과 같고 클릭만 없어진다.
 *
 * 봇 방어를 지나는 것은 코드가 영리해서가 아니라 **사용자의 진짜 브라우저 세션**이기
 * 때문이다(실측: 새 프로필 Playwright 는 헤드리스를 벗어도 폴로 두 번째 요청에서
 * PerimeterX 에 막혔고 룰루레몬은 즉시 막혔다). 그래서 자동화는 이 안에서만 성립한다.
 *
 * 권한은 필요한 최소로 둔다 — 호스트는 카탈로그에 등록된 브랜드 공식몰만 적는다.
 * `<all_urls>` 를 요구하면 사용자가 확장에 브라우저 전체를 내주게 된다.
 */
export type ManifestInput = {
  hosts: string[];
  version: string;
};

export function manifest({ hosts, version }: ManifestInput): string {
  return JSON.stringify(
    {
      manifest_version: 3,
      name: 'RICKY 재고수집',
      version,
      description: '등록 상품의 캐나다 공식몰 재고를 주기적으로 읽어 파일로 저장한다.',
      permissions: ['alarms', 'downloads', 'scripting', 'tabs', 'storage'],
      host_permissions: hosts,
      background: { service_worker: 'background.js', type: 'module' },
      action: { default_popup: 'popup.html', default_title: 'RICKY 재고수집' },
    },
    null,
    2,
  );
}
