/**
 * 상품명 정규화 — 순수 함수.
 *
 * 한국 쇼핑몰 상품명은 노이즈가 심하다.
 *   "[해외배송] 아크테릭스 베타 LT 자켓 남성 블랙 정품 24FW 무료배송"
 * 여기서 매칭에 쓸 토큰은 {arcteryx, beta, lt, jacket} 뿐이다.
 */

/** 판매자가 붙이는 마케팅 수식어. 매칭 전에 제거한다. */
const NOISE_KO = [
  '무료배송', '정품', '해외배송', '국내배송', '당일발송', '빠른배송', 'single',
  '병행수입', '관부가세포함', '관부가세', '免税', '특가', '할인', '세일', '최저가',
  '신상', '신상품', '새상품', '정식수입', '공식', '직수입', '직구', '리퍼',
  '남성', '여성', '남녀공용', '공용', '남자', '여자', '키즈', '아동',
  '사은품', '선물포장', '당일출고', '재입고', '한정',
];

const NOISE_EN = [
  'free', 'shipping', 'authentic', 'genuine', 'new', 'sale', 'official',
  'mens', 'men', 'womens', 'women', 'unisex', 'kids', 'youth',
];

/** 시즌 코드: 24FW, 25SS, F26, SS25 등 */
const SEASON_RX = /\b(?:[0-9]{2}\s?(?:fw|ss|aw|sp)|(?:fw|ss|aw|sp)\s?[0-9]{2}|[fs][0-9]{2})\b/gi;

/** 대괄호/소괄호 안의 판촉 문구 */
const BRACKET_RX = /[[(【〔<]{1}[^\])】〕>]*[\])】〕>]{1}/g;

/**
 * 색상어. 같은 모델의 색상 차이는 매칭을 막으면 안 되므로 토큰에서 뺀다.
 * (색상별 재고·가격은 variant 레벨에서 따로 다룬다.)
 */
const COLORS_KO = [
  '블랙', '화이트', '네이비', '그레이', '베이지', '카키', '브라운', '레드', '블루',
  '그린', '핑크', '퍼플', '옐로우', '오렌지', '아이보리', '차콜', '버건디', '민트',
  '검정', '흰색', '남색', '회색', '갈색', '빨강', '파랑', '초록',
];

const COLORS_EN = [
  'black', 'white', 'navy', 'grey', 'gray', 'beige', 'khaki', 'brown', 'red',
  'blue', 'green', 'pink', 'purple', 'yellow', 'orange', 'ivory', 'charcoal',
  'burgundy', 'mint', 'olive', 'cream', 'tan', 'silver', 'gold',
];

const STOPWORDS = new Set([...NOISE_KO, ...NOISE_EN, ...COLORS_KO, ...COLORS_EN]);

/**
 * 브랜드명에서 버릴 토큰을 만든다.
 *
 * 같은 브랜드 안에서만 비교하므로 브랜드명은 변별력이 0이면서
 * 모든 쌍의 유사도를 똑같이 올려 임계값 판정을 무디게 만든다. 그래서 아예 뺀다.
 */
export function brandDropTokens(...labels: string[]): string[] {
  return labels.flatMap((label) =>
    label
      .toLowerCase()
      .replace(/['’`]/g, '')
      .split(/[^0-9a-z가-힣]+/)
      .filter(Boolean),
  );
}

/**
 * 문자열을 매칭용 토큰 배열로 바꾼다.
 * @param aliases 한글 라인명 → 영문 정식명 사전 (BRANDS[x].aliases)
 * @param drop    추가로 제거할 토큰 (브랜드명 등)
 */
export function tokenize(
  input: string,
  aliases: Record<string, string> = {},
  drop: string[] = [],
): string[] {
  // 아포스트로피를 먼저 없앤다. Arc'teryx 가 arc+teryx 로 쪼개지면 한글 아크테릭스와 영영 만나지 못한다.
  let s = input.toLowerCase().replace(/['’`]/g, '');

  s = s.replace(BRACKET_RX, ' ').replace(SEASON_RX, ' ');

  // 한글 별칭을 영문으로 치환한다. 긴 별칭부터 적용해야 부분 치환 사고가 없다.
  for (const [ko, en] of Object.entries(aliases).sort((a, b) => b[0].length - a[0].length)) {
    if (!ko) continue;
    s = s.split(ko.toLowerCase()).join(` ${en.toLowerCase()} `);
  }

  // 한글·영문·숫자만 남긴다
  s = s.replace(/[^0-9a-z가-힣]+/g, ' ');

  const dropSet = new Set(drop.map((d) => d.toLowerCase()));

  return s
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOPWORDS.has(t) && !dropSet.has(t))
    // 1글자 영문 토큰은 변별력이 없다. 한글 1글자도 마찬가지.
    .filter((t) => t.length > 1 || /[0-9]/.test(t));
}

/** 비교용 정규화 문자열. 공백 제거 후 소문자. */
export function normalizeName(
  input: string,
  aliases: Record<string, string> = {},
  drop: string[] = [],
): string {
  return tokenize(input, aliases, drop).join(' ');
}

/**
 * 상품명 안에 박힌 스타일/모델 코드를 뽑는다.
 * 브랜드 공통 코드(TUMI 1171581041, Coach CH194, Canada Goose 4660M 등)를 잡는다.
 */
export function extractStyleCodes(input: string): string[] {
  const out = new Set<string>();
  const s = input.toUpperCase();

  for (const m of s.matchAll(/\b([A-Z]{1,3}\d{3,6}[A-Z]?)\b/g)) if (m[1]) out.add(m[1]);
  for (const m of s.matchAll(/\b(\d{9,12})\b/g)) if (m[1]) out.add(m[1]);
  for (const m of s.matchAll(/\b(X\d{9})\b/g)) if (m[1]) out.add(m[1]);

  return [...out];
}

/**
 * 자카드 유사도. 0~1.
 * 토큰 집합 비교라 어순 차이("Beta LT Jacket" vs "자켓 베타 LT")에 강하다.
 */
export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * 포함률 가중 유사도.
 *
 * 한국 상품명은 CA 상품명보다 토큰이 훨씬 많다("아크테릭스 베타 LT 자켓 남성 고어텍스 등산 자켓").
 * 순수 자카드는 이 비대칭 때문에 점수가 부당하게 낮게 나오므로,
 * "CA 토큰이 KR 상품명에 얼마나 담겼는가"(containment)를 함께 본다.
 */
export function similarity(caTokens: string[], krTokens: string[]): number {
  if (caTokens.length === 0 || krTokens.length === 0) return 0;
  const krSet = new Set(krTokens);
  let hit = 0;
  for (const t of new Set(caTokens)) if (krSet.has(t)) hit += 1;
  const containment = hit / new Set(caTokens).size;
  return 0.4 * jaccard(caTokens, krTokens) + 0.6 * containment;
}
