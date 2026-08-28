/**
 * 사이트 절대 주소.
 *
 * `publicEnv()`를 쓰지 않는다 — 그건 Supabase 키가 없으면 던지는데,
 * sitemap·robots·OG 이미지는 데이터베이스와 무관하게 항상 나와야 한다.
 * 시크릿 없이도 빌드가 통과해야 한다는 규칙과 같은 이유다.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    // Netlify가 배포마다 넣어 주는 값. 프로덕션 도메인이 여기로 온다.
    process.env.URL ||
    'http://localhost:3000';
  // 뒤 슬래시를 남기면 `${base}/path`가 `//path`가 된다
  return raw.replace(/\/+$/, '');
}

/** `siteUrl()` 기준 절대 URL */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
