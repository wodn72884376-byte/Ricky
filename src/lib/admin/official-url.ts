/**
 * 관리자 표에 공식몰 주소를 줄여 보여준다.
 *
 * 전체 URL 은 열을 통째로 밀어낸다
 * (`https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868`).
 * 그렇다고 호스트만 남기면 상품이 구분되지 않는다 — 같은 브랜드 행이 전부 같아진다.
 *
 * **호스트와 마지막 조각만 남긴다.** 마지막 조각이 상품을 가리키는 부분이다.
 * 전체 주소는 `title` 로 붙여 두면 마우스를 올려 확인할 수 있다.
 */
export function shortUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // 주소가 아니면 손대지 않는다. 잘라내면 뭐가 잘못됐는지 알 수 없다.
    return raw;
  }

  const host = url.host.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts.length === 0) return host;
  if (parts.length === 1) return `${host}/${parts[0]}`;
  return `${host}/…/${parts.at(-1)}`;
}
