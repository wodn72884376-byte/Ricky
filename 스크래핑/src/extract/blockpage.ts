/**
 * 봇 차단·캡차 페이지 판별 — 순수 함수.
 *
 * 차단 페이지도 HTTP 200 과 그럴듯한 HTML 로 돌아온다. 바이트가 왔다는 이유로
 * "수집 성공"으로 처리하면 진단이 통째로 거짓이 된다(실제로 랄프로렌 CA 를
 * "브라우저 ok" 로 오보한 적이 있다). 그래서 내용을 보고 판정한다.
 */

export type BlockKind =
  | 'perimeterx'
  | 'kasada'
  | 'akamai'
  | 'cloudflare'
  | 'datadome'
  | 'generic'
  | null;

/** 차단 벤더별 지문. 페이지 본문에 그대로 남는 문자열들이다. */
const SIGNATURES: Array<[BlockKind, RegExp]> = [
  ['perimeterx', /px-captcha|_pxVid|_pxhd|PerimeterX|window\._pxAppId/i],
  ['kasada', /KPSDK|kasada|x-kpsdk/i],
  ['datadome', /datadome|dd_cookie|geo\.captcha-delivery/i],
  ['cloudflare', /cf-browser-verification|cf_chl_|Just a moment\.\.\.|Attention Required!/i],
  ['akamai', /Access Denied.{0,200}Reference\s*#|akamai.{0,40}reference|ak_bmsc/i],
  ['generic', /Access to this page has been denied|Are you a robot|Please enable JavaScript and cookies|verify you are a human/i],
];

/**
 * 차단 페이지면 벤더명을, 아니면 null 을 돌려준다.
 *
 * 짧은 페이지에만 적용한다 — 정상 상품 페이지는 대개 수십 KB 이상이고,
 * 본문에 "captcha" 같은 단어가 우연히 들어 있을 수 있기 때문이다.
 */
export function detectBlockPage(html: string): BlockKind {
  // 정상 PDP 는 이보다 훨씬 크다. 큰 페이지는 지문이 있어도 본문 텍스트일 가능성이 높다.
  const SUSPICIOUS_MAX_BYTES = 60_000;
  if (html.length > SUSPICIOUS_MAX_BYTES) return null;

  for (const [kind, rx] of SIGNATURES) {
    if (rx.test(html)) return kind;
  }
  return null;
}

/**
 * 상품 페이지로서 쓸모가 있는지.
 * 차단 페이지가 아니고, 상품 마크업의 최소 흔적이라도 있어야 한다.
 */
export function looksUsable(html: string): boolean {
  if (detectBlockPage(html) !== null) return false;
  if (html.length < 2_000) return false;
  return true;
}

/** 사람이 읽는 차단 사유 문구. doctor 표에 그대로 들어간다. */
export function blockLabel(kind: BlockKind): string {
  switch (kind) {
    case 'perimeterx':
      return '차단(PerimeterX)';
    case 'kasada':
      return '차단(Kasada)';
    case 'akamai':
      return '차단(Akamai)';
    case 'cloudflare':
      return '차단(Cloudflare)';
    case 'datadome':
      return '차단(DataDome)';
    case 'generic':
      return '차단(캡차)';
    default:
      return '정상';
  }
}
