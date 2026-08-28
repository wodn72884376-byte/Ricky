/**
 * 색상명 → 컬러칩 색.
 *
 * 카탈로그의 색상은 브랜드가 붙인 마케팅 이름이라(`Atmos Solitude`, `Sea Salt Blue Heather`)
 * 값이 함께 오지 않는다. 그래서 이름에 들어 있는 색 토큰을 찾아 근사값을 쓴다.
 *
 * **이 값은 근사다.** 칩은 "어떤 색 계열인지"를 알리는 장치이고,
 * 실제 색은 상품 사진이 보여준다 — 그래서 칩만으로 색을 판단하게 두지 않고
 * 항상 색상명을 함께 노출한다(툴팁·sr-only).
 *
 * 매칭은 **긴 키워드 우선**이다. `sea salt blue`가 `blue`보다 먼저 걸려야 한다.
 */

const SWATCHES: [pattern: string, hex: string][] = [
  // 복합어 — 짧은 토큰보다 먼저 본다
  ['dark chocolate', '#3f2a20'],
  ['blush pink', '#e7b3bd'],
  ['pink pearl', '#efc3c9'],
  ['pink parfait', '#f2c3cf'],
  ['pink flare', '#e88ea3'],
  ['pink peony', '#e58fa8'],
  ['carmel pink', '#e2a3ac'],
  ['sea salt blue', '#aebecb'],
  ['sea salt', '#dfe3e4'],
  ['arctic silk', '#dee2e0'],
  ['andover cream', '#efe6d4'],
  ['authentic cream', '#eee4d1'],
  ['light ivory', '#f2ece0'],
  ['hunter navy', '#1f2a44'],
  ['litchfield blue', '#6f8fbf'],
  ['alpine blue', '#4a7fb5'],
  ['borage', '#7f93b8'],
  ['polo black', '#141414'],
  ['graphite', '#3a3a3a'],
  ['french press', '#4c342a'],
  ['burnt caramel', '#8a5a34'],
  ['camel melange', '#c19a6b'],
  ['fawn grey', '#a49b92'],
  ['flannel grey', '#96999b'],
  ['dark fuchsia', '#a3277a'],
  ['candy cloud', '#f0c2d6'],
  ['foam cloud', '#dfe4e2'],
  ['cloud void', '#6d7378'],
  ['void cloud', '#6d7378'],
  ['sweet sorbet', '#f3b7a1'],
  ['sassy sage', '#a8b493'],
  ['cypress forest', '#3f5240'],
  ['alpine rose', '#c98495'],
  ['lilac play', '#b9a3d1'],
  ['flamingo', '#ef8fa2'],
  ['warm brown', '#6f4a33'],
  ['tan brown', '#a9805a'],
  ['headwaters', '#2f5d6b'],
  ['solitude', '#8ea3b0'],
  ['renegade', '#8b6b4f'],
  ['mongoose', '#7d6a56'],
  ['habitat', '#6f7b5f'],
  ['atmos', '#b9c2c7'],
  ['walnut', '#6b4a32'],
  ['maple', '#9d5b32'],
  ['chalk', '#ece7df'],
  ['ivory', '#f2ece0'],
  ['cream', '#efe6d4'],
  ['heather', '#a3a3a3'],
  ['melange', '#c19a6b'],
  ['camel', '#c19a6b'],
  ['caramel', '#8a5a34'],
  ['chocolate', '#3f2a20'],
  ['brown', '#6f4a33'],
  ['navy', '#1f2a44'],
  ['forest', '#3f5240'],
  ['sage', '#a8b493'],
  ['lilac', '#b9a3d1'],
  ['fuchsia', '#a3277a'],
  ['peony', '#e58fa8'],
  ['parfait', '#f2c3cf'],
  ['sorbet', '#f3b7a1'],
  ['rose', '#c98495'],
  ['pink', '#e8a0b0'],
  ['silk', '#dee2e0'],
  ['cloud', '#d9dcdf'],
  ['void', '#212529'],
  ['grey', '#9a9a9a'],
  ['gray', '#9a9a9a'],
  ['blue', '#4a7fb5'],
  ['green', '#4a7a55'],
  ['tan', '#b98d5f'],
  ['white', '#ffffff'],
  ['black', '#141414'],
];

/** 소재 접두사. 색이 아니라 소재이므로 매칭에서 빼야 `suede`가 색으로 읽히지 않는다. */
const MATERIAL_WORDS = [
  'polished pebble leather', 'natural grain leather', 'signature canvas',
  'crinkle leather', 'pebbled leather', 'smooth leather', 'nappa leather',
  'pebble leather', 'suede', 'straw', 'leather', 'canvas',
];

/**
 * 색상명에서 칩 색을 고른다. 아무것도 못 찾으면 `null` —
 * 모르는 색을 회색으로 칠해 "회색 상품"처럼 보이게 만들지 않는다.
 */
export function swatchHex(colorName: string): string | null {
  let s = colorName.toLowerCase();
  for (const w of MATERIAL_WORDS) s = s.replaceAll(w, ' ');
  // `A / B`처럼 두 색이면 앞의 것을 대표로 본다
  s = s.split('/')[0]!;

  for (const [pattern, hex] of SWATCHES) {
    if (s.includes(pattern)) return hex;
  }
  return null;
}
