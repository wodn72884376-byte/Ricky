/**
 * 원산지 코드 → 한국어 국가명.
 *
 * 고시 표의 `제조국`은 **고객이 읽는 항목**이다. `ID`라고 적어 두면 아무 뜻도 전달되지 않는다.
 * 저장은 ISO 3166-1 alpha-2로 하고(관세 판정·CKFTA가 코드로 돌아간다) 표시할 때만 옮긴다.
 *
 * 표에 없는 코드는 **코드를 그대로 보여준다.** 지어낸 국가명을 띄우는 것보다
 * 낯선 코드가 보이는 편이 낫다 — 원산지는 관세를 가르는 값이다 (CLAUDE.md 규칙 5).
 */
const COUNTRY_KO: Record<string, string> = {
  CA: '캐나다',
  CN: '중국',
  VN: '베트남',
  ID: '인도네시아',
  BD: '방글라데시',
  KH: '캄보디아',
  MM: '미얀마',
  PH: '필리핀',
  LK: '스리랑카',
  IN: '인도',
  TH: '태국',
  TR: '튀르키예',
  SV: '엘살바도르',
  HN: '온두라스',
  MX: '멕시코',
  IT: '이탈리아',
  PT: '포르투갈',
  RO: '루마니아',
  BG: '불가리아',
  LA: '라오스',
  US: '미국',
  TW: '대만',
  KR: '대한민국',
  JP: '일본',
};

/** `ID` → `인도네시아 (ID)`. 코드를 함께 남겨 통관 서류와 대조할 수 있게 한다. */
export function countryLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  const ko = COUNTRY_KO[upper];
  return ko ? `${ko} (${upper})` : upper;
}
