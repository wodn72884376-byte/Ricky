/**
 * DESIGN.md 토큰의 WCAG 2.2 대비비를 검증한다.
 * 사용: npm run design:contrast
 *
 * 기준 — WCAG 2.2 AA (PRODUCT.md 접근성 절):
 *   1.4.3 본문 텍스트          4.5:1
 *   1.4.3 큰 텍스트(≥24px, 또는 ≥18.66px bold)  3:1
 *   1.4.11 UI 컴포넌트 경계·상태 3:1
 */
const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// [라벨, 전경, 배경, 요구 대비, 이 토큰이 실어 나르는 것]
const CHECKS = [
  ['본문 #000000 / 흰',            BLACK,                          WHITE, 4.5, '모든 본문·헤딩'],
  ['muted-text #5d5d5d / 흰',      [93, 93, 93],                   WHITE, 4.5, '관세 캡션 · 재고 상태 · 촬영 시각'],
  ['세일 레드 #e8005d / 흰',       [232, 0, 93],                   WHITE, 4.5, '할인율 배지 12px/700'],
  ['에러 레드 #ed0038 / 흰',       [237, 0, 56],                   WHITE, 4.5, '인라인 폼 에러 13px/400'],
  ['outline-strong #949494 / 흰',  [148, 148, 148],                WHITE, 3.0, '박스형 입력 경계 (SC 1.4.11)'],
  ['반전 CTA #ffffff / 검정',      WHITE,                          BLACK, 4.5, '구매 CTA · 플로팅 문의'],
  // 사진 위 스크림 — 최악의 경우(순백 사진) 기준으로 검사한다.
  // 텍스트는 불투명도 70% 이상 구간에만 놓기로 규정돼 있다 (DESIGN.md §4 Bento Scrim).
  ['스크림 70% 위 흰 글자 (최악)',  WHITE,        over(BLACK, 0.70, WHITE), 4.5, '벤토 타일 브랜드명·설명·CTA'],
  ['스크림 85% 위 흰 글자',        WHITE,        over(BLACK, 0.85, WHITE), 4.5, '벤토 타일 하단'],
];

// 정보를 싣지 않는 토큰 — AA 대상이 아니다. 용도가 새면 위 목록으로 옮겨야 한다.
const NON_TEXT = [
  ['muted-deco rgba(93,93,93,.64)', over([93, 93, 93], 0.64, WHITE), WHITE, '비활성 내비 · 카운트 배지. 문장 금지'],
  ['outline #c4c4c4',               [196, 196, 196],                WHITE, '텍스트 라벨이 있는 버튼 전용'],
  ['skeleton #f5f5f5',              [245, 245, 245],                WHITE, '로딩 플레이스홀더'],
];

/**
 * 네이버페이 버튼. 색·표기·비율이 네이버가 정한 자산이라 우리 팔레트로 다시 칠할 수 없다.
 * 흰 글자 대비가 낮으므로 **이 버튼에 안내 문구를 얹지 않는다** —
 * 설명은 버튼 밖 `#5d5d5d` 각주로 둔다 (src/components/store/naver-pay-button.tsx).
 */
const NAVER_GREEN = [3, 199, 90];
const BRAND_LOCKED = [
  ['네이버페이 흰 글자 / #03C75A', WHITE, NAVER_GREEN, '버튼 라벨. 문장을 얹지 말 것'],
  ['네이버페이 검정 대비 참고',     BLACK, NAVER_GREEN, '참고값 — 네이버 규정상 검정 라벨은 쓰지 않는다'],
];

let failed = 0;
console.log('WCAG 2.2 토큰 대비 검증\n');
for (const [label, fg, bg, need, carries] of CHECKS) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) failed++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(26)} ${r.toFixed(2).padStart(6)}:1  (필요 ${need}:1)`,
  );
  if (!ok) console.log(`      ↳ 실어 나르는 것: ${carries}`);
}

console.log('\n비정보 토큰 (AA 대상 아님 — 용도가 새면 위로 옮길 것)\n');
for (const [label, fg, bg, note] of NON_TEXT) {
  console.log(`      ${label.padEnd(31)} ${ratio(fg, bg).toFixed(2).padStart(6)}:1  — ${note}`);
}

/*
  외부 브랜드 자산은 우리가 색을 정하지 못한다. 통과/미달로 판정하지 않고
  **수치를 계속 눈에 보이게** 두어, 대비가 필요한 문구를 이 위에 얹지 않도록 한다.
*/
console.log('\n외부 브랜드 자산 (색을 우리가 정하지 못함 — 판정 대상 아님)\n');
for (const [label, fg, bg, note] of BRAND_LOCKED) {
  console.log(`      ${label.padEnd(31)} ${ratio(fg, bg).toFixed(2).padStart(6)}:1  — ${note}`);
}

if (failed) {
  console.log(`\n${failed}건 미달. DESIGN.md §2와 PRODUCT.md 접근성 절을 함께 갱신해야 한다.`);
  process.exit(1);
}
console.log('\n전부 통과.');
