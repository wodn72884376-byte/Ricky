/**
 * 카탈로그 임포터 — 아크테릭스 · 코치 · 폴로 · 룰루레몬.
 *
 *   1. 브랜드별 폴더(+아크테릭스 가격표)를 파싱한다
 *   2. 원본 이미지를 카드용(4:5)·상세용 webp 두 크기로 변환해 public/images/products/에 넣는다
 *   3. src/lib/catalog.generated.ts 를 만든다
 *
 * 사용: npm run catalog:import
 * 원본 폴더는 읽기만 한다. 재실행하면 결과물만 다시 만든다.
 *
 * **가격 공식은 src/lib/pricing 과 같아야 한다.** 여기 상수를 고치면 거기도 고친다.
 */
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { colourKey, parseAll } from './parse-arcteryx.mjs';
import { parseNewBrands, parseWarnings } from './parse-brands.mjs';
import { coachSpecs } from './coach-specs.mjs';
import { loadArcteryxDetails } from './arcteryx-details.mjs';


const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * 재고 수집기가 해석해 둔 상품별 공식몰 URL.
 *
 * 브랜드 홈이 아니라 **그 상품의 페이지**다. 운영자가 원가·재고를 대조할 때 쓴다.
 * 없는 브랜드(캐나다구스)는 null 로 둔다 — 브랜드 홈으로 대신 채우면
 * "이 상품 페이지"와 "그냥 브랜드 홈"이 구분되지 않는다.
 */
async function loadOfficialUrls(warn) {
  const out = {};

  try {
    const raw = await readFile(join(ROOT, '스크래핑/data/supplier-urls.json'), 'utf8');
    for (const [slug, v] of Object.entries(JSON.parse(raw))) {
      const url = v.urls?.[0] ?? v.url ?? null;
      if (url) out[slug] = url;
    }
  } catch {
    warn('스크래핑/data/supplier-urls.json 이 없다 — 수집기가 해석한 URL 없이 진행한다');
  }

  /*
   * 손으로 넣은 값이 **이긴다.** 수집기가 다시 돌아도 남아야 하기 때문이다 —
   * 수집기가 못 찾은 상품을 메우는 것이 이 파일의 존재 이유다.
   */
  const manual = await loadManualUrls('scripts/official-urls.json', warn);
  Object.assign(out, manual.byProduct);

  return { byProduct: out, byColor: manual.byColor };
}

/**
 * 손으로 채우는 URL 파일을 읽는다. `official-urls.json` 과 `smartstore-urls.json` 이
 * 같은 모양을 쓴다 — 한쪽은 "원본이 어디 있나", 다른 쪽은 "어디서 사나"일 뿐 구조가 같다.
 *
 *   { "<슬러그>": { "url": "..." } }                       상품 하나에 페이지 하나
 *   { "<슬러그>": { "byColor": { "Black": "..." } } }       색상마다 페이지가 다를 때
 *
 * 파일이 없으면 조용히 빈 값을 준다 — 아직 안 만들었을 수 있고, 그것은 오류가 아니다.
 * 반대로 **있는데 못 읽으면 시끄럽게 경고한다.** JSON 이 깨진 채로 지나가면 채워 넣은
 * 값이 통째로 사라지는데, 화면에는 그냥 "URL 없음"으로 보여서 알아채기 어렵다.
 */
async function loadManualUrls(relPath, warn) {
  const byProduct = {};
  const byColor = {};

  let raw;
  try {
    raw = await readFile(join(ROOT, relPath), 'utf8');
  } catch {
    return { byProduct, byColor };   // 파일이 없는 것은 정상이다
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    warn(`${relPath} 이 올바른 JSON 이 아니다 (${e.message}) — 이 파일의 URL 을 전부 버린다`);
    return { byProduct, byColor };
  }

  for (const [slug, v] of Object.entries(parsed)) {
    if (slug.startsWith('_')) continue;
    if (v.url) byProduct[slug] = v.url;
    // 빈 문자열은 "아직 안 채웠다"는 뜻이다. 값으로 취급하면 빈 링크가 화면에 뜬다.
    if (v.byColor) {
      const filled = Object.entries(v.byColor).filter(([, url]) => url);
      if (filled.length > 0) byColor[slug] = Object.fromEntries(filled);
    }
  }

  return { byProduct, byColor };
}
const OUT_IMG = join(ROOT, 'public/images/products');
const CARD_W = 900;
const DETAIL_W = 1600;

/** src/lib/pricing/index.ts 의 DEFAULT_PRICING_CONFIG 와 같은 값이어야 한다 */
const GST = 1.05;
const CAD_KRW = 1000;          // TODO(fx): fx_rates에서 읽는다
const FX_BUFFER = 1.02;
const MARGIN = 1.28;
const HANDLING_CAD = 6;        // 배대지 검수·재포장 건당
const ceil100 = (n) => Math.ceil(n / 100) * 100;

function slug(s) {
  return String(s).toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** 가격표가 없는 브랜드의 판매가. computeSalePrice()와 같은 순서로 계산한다. */
function priceFromCad(cad) {
  const landedCad = cad * GST + HANDLING_CAD;
  const costKrw = Math.round(landedCad * CAD_KRW * FX_BUFFER);
  return { costKrw, priceKrw: ceil100(costKrw * MARGIN) };
}

/** 색상·소재 한국어 표기. 없으면 영문 그대로 둔다 — 지어내지 않는다. */
const KO = {
  // Arc'teryx
  Black: '블랙', 'Graphite Black': '그래파이트 블랙', '24K Black': '24K 블랙',
  'Sea Salt': '씨솔트', 'Cloud Void': '클라우드 보이드', Cloud: '클라우드',
  Void: '보이드', 'Void Cloud': '보이드 클라우드', Headwaters: '헤드워터스',
  Habitat: '해비탯', Mongoose: '몽구스', Tatsu: '타츠', 'Alpine Rose': '알파인 로즈',
  'Alpine Blue': '알파인 블루', 'Arctic Silk': '아틱 실크', 'Atmos Solitude': '아트모스 솔리튜드',
  'Lt Renegade': '라이트 레니게이드', 'Arctic Silk Sea Salt': '아틱 실크 씨솔트',
  'Mongoose Sea Salt': '몽구스 씨솔트',
  // 소재 (코치)
  'pebbled leather': '페블 레더', 'polished pebble leather': '폴리시드 페블 레더',
  'natural grain leather': '내추럴 그레인 레더', 'smooth leather': '스무스 레더',
  'nappa leather': '나파 레더', 'crinkle leather': '크링클 레더',
  'signature canvas': '시그니처 캔버스', suede: '스웨이드', straw: '스트로',
  // 색상 (코치)
  Maple: '메이플', Chalk: '초크', Walnut: '월넛', Tan: '탄', Brown: '브라운',
  'Walnut Black': '월넛 블랙', 'Tan Brown': '탄 브라운', 'Dark Chocolate': '다크 초콜릿',
  'Warm Brown': '웜 브라운', 'Blush Pink': '블러쉬 핑크', 'Dark Fuchsia': '다크 푸시아',
  'Dark Stone': '다크 스톤',
  // 색상 (폴로)
  'Polo Black': '폴로 블랙', 'Hunter Navy': '헌터 네이비', 'Andover Cream': '앤도버 크림',
  'Authentic Cream': '어센틱 크림', 'Fawn Grey Heather': '폰 그레이 헤더',
  'Flannel Grey Heather': '플란넬 그레이 헤더', 'Blue Borage Heather': '블루 보리지 헤더',
  'Sea Salt Blue Heather': '씨솔트 블루 헤더', 'Dockside Blue Heather': '독사이드 블루 헤더',
  'New Litchfield Blue': '뉴 리치필드 블루', 'Camel Melange': '카멜 멜란지',
  'Collection Camel Melange': '컬렉션 카멜 멜란지', 'Damson Melange': '댐슨 멜란지',
  'Carmel Pink': '카멜 핑크', White: '화이트', white: '화이트', cream: '크림',
  'Polo Black / White': '폴로 블랙 / 화이트',
  // 색상 (룰루레몬)
  black: '블랙', blue: '블루', 'Pink Flare': '핑크 플레어', 'Candy Cloud': '캔디 클라우드',
  'Pink Pearl': '핑크 펄', 'Lilac Play': '릴락 플레이', 'Foam Cloud': '폼 클라우드',
  'Flamingo Fun': '플라밍고 펀', 'Sassy Sage / Cypress Forest': '새시 세이지 / 사이프러스 포레스트',
  'Sweet Sorbet / Pink Pearl': '스위트 소르베 / 핑크 펄',
  'Light Ivory / Black': '라이트 아이보리 / 블랙',
  'Light Ivory / White': '라이트 아이보리 / 화이트',
  'Lilac Play / White': '릴락 플레이 / 화이트',
  'French Press / Burnt Caramel': '프렌치 프레스 / 번트 카라멜',
  'Pink Parfait / Pink Peony': '핑크 파르페 / 핑크 피오니',
  'Beach Ball Blue': '비치볼 블루',
  // 색상 (캐나다구스) — 디스크 표기는 `디스크 / 색상` 조각으로 갈려 번역된다
  'Classic Disc': '클래식 디스크', 'Black Disc': '블랙 디스크', 'Tonal Disc': '토널 디스크',
  'Atlantic Navy': '애틀랜틱 네이비', 'Bloom Pink': '블룸 핑크', 'Carmine Red': '카민 레드',
  'Coastal Grey': '코스탈 그레이', 'Early Frost': '얼리 프로스트', 'Future Dusk': '퓨처 더스크',
  'Granite Grey': '그래나이트 그레이', Graphite: '그래파이트', Limestone: '라임스톤',
  'Military Tan': '밀리터리 탄', Nocturne: '녹턴', 'North Star White': '노스 스타 화이트',
  'Oxford Navy': '옥스퍼드 네이비', 'Ozone Blue': '오존 블루', 'Pink Lemonade': '핑크 레모네이드',
  Sagebrush: '세이지브러시', 'Taupe Grey': '토프 그레이', Terra: '테라',
  'Vireo Green': '비레오 그린', Volcano: '볼케이노',
};

/**
 * 상품 슬러그. 성별을 뒤에 붙여 같은 모델의 남녀 상품을 가른다.
 *
 * **이름이 이미 성별을 말하면 붙이지 않는다.** `Kids Vanier Vest` 에 `-kids` 를 더하면
 * `canada-goose-kids-vanier-vest-kids` 가 된다 — 캐나다구스 아동 라인은 이름이
 * `Kids ...` / `Youth ...` 로 시작해서 그것만으로 이미 갈린다.
 * 이름이 성별을 말하지 않는 아동 상품(`Crofton Hoodie`)에는 그대로 붙는다 —
 * 성인 라인에 같은 이름이 있을 수 있기 때문이다.
 */
function productSlugOf(p) {
  const nameSaysIt = p.gender === 'kids' && /^(kids|youth)\b/i.test(p.name);
  return slug(`${p.brandSlug} ${p.name} ${p.gender === 'unisex' || nameSaysIt ? '' : p.gender}`);
}

/** 조각 단위로 번역한다. `suede Warm Brown` → `스웨이드 웜 브라운` */
function koLabel(label) {
  if (KO[label]) return KO[label];

  /*
    `A / B` 는 조각마다 번역한다. 캐나다구스 색상이 전부 `Classic Disc / Atlantic Navy` 모양인데,
    아래 접두사 규칙만으로는 `클래식 디스크 / Atlantic Navy` 처럼 반만 번역된다.
    통짜 항목(`Sassy Sage / Cypress Forest`)은 위에서 이미 걸러졌으므로 여기 오지 않는다.
  */
  if (label.includes(' / ')) {
    return label.split(' / ').map((part) => koLabel(part.trim())).join(' / ');
  }

  for (const [en, ko] of Object.entries(KO).sort((a, b) => b[0].length - a[0].length)) {
    if (label.startsWith(en + ' ')) {
      const rest = label.slice(en.length + 1);
      return `${ko} ${KO[rest] ?? rest}`;
    }
  }
  return label;
}

/** 케어 라벨 어휘. 고시 표에 영문을 그대로 두지 않기 위한 최소 사전이다. */
const FABRIC_KO = [
  // 부정형이 먼저다. `dry clean`을 먼저 치환하면 `Do Not Dry Clean`이 반만 번역된다.
  [/do not dry ?clean/gi, '드라이클리닝 금지'], [/do not bleach/gi, '표백 금지'],
  [/do not iron/gi, '다림질 금지'], [/do not tumble dry/gi, '건조기 사용 금지'],
  [/dry clean only/gi, '드라이클리닝 전용'], [/dry ?clean/gi, '드라이클리닝'],
  [/machine washable/gi, '기계 세탁 가능'], [/machine wash cold/gi, '찬물 세탁'],
  [/machine wash/gi, '기계 세탁'], [/hand wash/gi, '손세탁'],
  [/tumble dry low/gi, '낮은 온도 건조기'], [/lay flat to dry/gi, '뉘어서 건조'],
  [/wash with like colors/gi, '같은 색끼리 세탁'], [/wash separately/gi, '단독 세탁'],
  [/\bgentle\b/gi, '약하게'], [/\bimported\b/gi, ''],
  [/exclusive of decoration/gi, '장식 제외'],

  // 소재
  [/\bcotton\b/gi, '면'], [/\bwool\b/gi, '울'], [/\bcashmere\b/gi, '캐시미어'],
  [/\bpolyester\b/gi, '폴리에스터'], [/\bnylon\b/gi, '나일론'], [/\bpolyamide\b/gi, '폴리아미드'],
  [/\belastane\b/gi, '엘라스테인'], [/\belastomultiester\b/gi, '엘라스토멀티에스터'],
  [/\blycra\b/gi, '라이크라'], [/\bleather\b/gi, '가죽'], [/\bsuede\b/gi, '스웨이드'],
  [/\bcanvas\b/gi, '캔버스'], [/\bstraw\b/gi, '스트로'], [/\blinen\b/gi, '린넨'],
  [/\bsilk\b/gi, '실크'], [/\bviscose\b/gi, '비스코스'], [/\bacrylic\b/gi, '아크릴'],
  [/\brecycled\b/gi, '리사이클'], [/\bfabric\b/gi, '패브릭'],
  [/refined pebble/gi, '리파인드 페블'], [/polished pebble/gi, '폴리시드 페블'],
  [/natural grain/gi, '내추럴 그레인'], [/\bpebbled?\b/gi, '페블'],
  [/\bshiny smooth\b/gi, '샤이니 스무스'], [/\bsmooth\b/gi, '스무스'],
  [/\bnappa\b/gi, '나파'], [/\bcrinkle\b/gi, '크링클'], [/\bwoven\b/gi, '우븐'],
  [/\bsignature\b/gi, '시그니처'], [/\bpolished\b/gi, '폴리시드'],
  [/\bshiny\b/gi, '샤이니'], [/\bsoft\b/gi, '소프트'],

  // 부위
  [/\blining\b/gi, '안감'], [/\bbody\b/gi, '겉감'], [/\bshell\b/gi, '겉감'],
  [/\bmesh\b/gi, '메시'], [/\bpanel\b/gi, '패널'], [/\bfront\b/gi, '앞면'],
  [/\bback\b/gi, '뒷면'], [/\bpocket\b/gi, '포켓'], [/\bhem band\b/gi, '밑단 밴드'],
  [/\bxtra life\b/gi, 'Xtra Life'],

  // 접속사는 마지막에 — 앞선 구문 매칭을 깨뜨리지 않도록
  [/\bor\b/gi, '또는'], [/\band\b/gi, '및'],
];

function ko(text) {
  if (!text) return null;
  let out = text;
  for (const [re, to] of FABRIC_KO) out = out.replace(re, to);
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim() || null;
}

// ── 고시 항목 추출 ────────────────────────────────────────────────

/** 코치: `Materials\n<줄들>` 블록 */
function coachMaterial(text) {
  const m = text?.match(/^Materials\s*\n([\s\S]*?)(?:\n\s*\n|\n[A-Z][a-z]+\s*\n)/m);
  return m ? m[1].trim().split('\n').map((l) => l.trim()).filter(Boolean).join(', ') : null;
}

/** 폴로: `100% cotton.` 같은 혼용률 줄 */
function poloMaterial(text) {
  const m = text?.match(/^\s*((?:\d{1,3}%\s*[A-Za-z][^.\n]*?)(?:,\s*\d{1,3}%[^.\n]*?)*)\.\s*$/m);
  return m ? m[1].trim() : null;
}

/** 폴로: 세탁 안내 줄 */
function poloCare(text) {
  const m = text?.match(/^\s*((?:Hand wash|Machine wash|Dry clean)[^\n]*)$/im);
  return m ? m[1].replace(/\s*Imported\.?/i, '').trim() : null;
}

/** 룰루레몬: `Materials` ~ `Care` ~ 끝 */
function lululemonMaterialCare(text) {
  const mat = text?.match(/^Materials\s*\n([\s\S]*?)\n\s*Care\s*\n/m);
  // `$`에 m 플래그를 함께 쓰면 줄 끝에서 끊긴다 — Care 블록 전체를 가져와야 한다
  const care = text?.match(/\n\s*Care\s*\n([\s\S]*?)(?:\n?\s*[\d.]+CAD\s*$|$)/);
  const clean = (s) =>
    s?.trim().split('\n').map((l) => l.trim()).filter((l) => l && l !== '•').join(', ') ?? null;
  return { material: clean(mat?.[1]), care: clean(care?.[1]) };
}

/** 브랜드 제조자 표기. 법인명을 지어내지 않고 브랜드 표기를 그대로 쓴다. */
const MANUFACTURER = {
  arcteryx: "Arc'teryx Equipment",
  coach: 'Coach',
  polo: 'Ralph Lauren',
  lululemon: 'lululemon athletica',
  'canada-goose': 'Canada Goose',
};

// ── 이미지 변환 ───────────────────────────────────────────────────

/**
 * 카드 컷(4:5)으로 자른다.
 *
 * **`position: 'attention'`을 쓰지 않는다.** 이미지마다 "흥미로운 영역"을 새로 찾기 때문에
 * 같은 촬영 규격의 상품인데도 어떤 카드만 다르게 잘린다 — 실측: 캐나다구스 7개 중
 * Langford만 머리가 잘리고 바닥이 들어왔다. 그리드는 리듬이 생명이라(DESIGN.md §12-1)
 * 한 장이 튀면 줄 전체가 어긋나 보인다.
 *
 * 대신 원본 비율로 가른다. 자르는 방향이 정해지기 때문이다.
 *   4:5보다 세로로 긴 원본(인물 전신 컷)  → 세로가 잘린다. 위를 고정해 얼굴을 남긴다.
 *   그 외(가방·액세서리 정사각 컷)        → 가로가 잘리거나 안 잘린다. 가운데가 맞다.
 */
async function toCard(srcPath, destBase) {
  const buf = await readFile(srcPath);
  const { width, height } = await sharp(buf).metadata();
  const position = width / height < 4 / 5 ? 'north' : 'centre';

  await sharp(buf)
    .resize(CARD_W, Math.round(CARD_W * 1.25), { fit: 'cover', position })
    .webp({ quality: 78 })
    .toFile(`${destBase}-card.webp`);
}

async function toDetail(srcPath, destBase) {
  await sharp(await readFile(srcPath))
    .resize(DETAIL_W, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${destBase}.webp`);
}

// ── 실행 ─────────────────────────────────────────────────────────

const arcteryx = await parseAll();
const others = await parseNewBrands();

await rm(OUT_IMG, { recursive: true, force: true });
await mkdir(OUT_IMG, { recursive: true });

const catalog = [];
// 파서가 규칙에서 벗어난 원본 폴더를 건너뛴 기록. 조용히 사라지면 아무도 모른다.
const warnings = [...parseWarnings];

/*
  스크래핑 프로젝트가 모아 둔 공식몰 상품 상세. 없으면 빈 객체이고 임포트는 그대로 돈다 —
  상세는 있으면 좋은 값이지 카탈로그를 만드는 전제가 아니다.
*/
const arcteryxDetails = await loadArcteryxDetails((w) => warnings.push(w));
const officialUrls = await loadOfficialUrls((w) => warnings.push(w));

/*
  구매 경로. 결제는 스마트스토어가 하므로(20260828000007) 여기 값이 없으면 살 방법이 없다.

  **색상별 값이 있으면 그것이 이긴다.** 스마트스토어에 색상마다 상품을 따로 등록하면
  고객이 우리 화면에서 고른 색을 거기서 다시 고르지 않아도 된다 — 그게 이 파일의 존재 이유다.
*/
const smartstoreUrls = await loadManualUrls('scripts/smartstore-urls.json', (w) => warnings.push(w));

/**
 * 옵션 하나의 공식몰 주소. 색상별 값이 있으면 그것이 정확하다.
 * 없으면 null 이다 — 상품 주소로 떨어뜨리는 판단은 읽는 쪽이 한다.
 */
const colorUrl = (productSlug, color) => officialUrls.byColor[productSlug]?.[color] ?? null;

/** 채워 넣은 색상 중 카탈로그에 없는 것. 색상명을 고치면 조용히 버려지므로 경고한다. */
function warnStrayColors(productSlug, colors) {
  for (const [label, map] of [['공식몰', officialUrls.byColor], ['스마트스토어', smartstoreUrls.byColor]]) {
    const known = map[productSlug];
    if (!known) continue;
    for (const c of Object.keys(known)) {
      if (!colors.includes(c)) warnings.push(`${label} URL: ${productSlug} 의 색상 "${c}" 이 카탈로그에 없다`);
    }
  }
}

/** 옵션 하나의 구매 경로. 없으면 null 이고, 상품 주소로 떨어뜨리는 판단은 읽는 쪽이 한다. */
const smartstoreOf = (productSlug, color) => smartstoreUrls.byColor[productSlug]?.[color] ?? null;
let converted = 0;

function categoryOfArcteryx(name) {
  if (/Backpack/i.test(name)) return 'bag';
  if (/Toque|Beanie|Cap|Hat/i.test(name)) return 'accessory';
  if (/Hoody|Hoodie/i.test(name)) return 'top';
  return 'outerwear';
}

// ── 아크테릭스 (가격표 + 폴더 가격) ───────────────────────────────
for (const p of arcteryx) {
  const folderName = p.name.replace(/\s+(Men|Women)'s$/i, '').trim();
  /*
    `(Outlet)` 은 우리가 폴더명에 붙인 구분표지다. 같은 이름의 상품이 정가·아울렛으로
    따로 팔릴 때 슬러그를 가르기 위한 것이고(`…-jacket-outlet-men`), 고객에게는
    한국어로 보여 준다 — 화면 문구는 전부 한국어다 (CLAUDE.md 코드 컨벤션).
  */
  const baseName = folderName.replace(/\s*\(Outlet\)/i, ' (아울렛)').replace(/\s{2,}/g, ' ').trim();
  const productSlug = slug(`arcteryx ${folderName} ${p.gender === 'unisex' ? '' : p.gender}`);

  /*
    가격표가 1순위, 폴더의 `가격.txt` 가 2순위다.

    엑셀은 원가·한국 정발가·마진까지 사람이 정해 둔 값이라 언제나 이긴다. 아울렛처럼
    수시로 들고 나는 상품까지 엑셀에 손으로 넣게 하면 그게 병목이 되므로, 행이 없으면
    다른 브랜드가 이미 쓰는 공식(priceFromCad)으로 떨어뜨린다.
  */
  const sheet = p.price?.priceKrw ? p.price : null;
  /*
    `가격.txt` 가 색상별로만 적혀 있으면(합치기로 받은 폴더) 상품 대표가는 그중 최저가로
    잡는다. 목록에 뜨는 값이 실제로 살 수 있는 가장 싼 값이어야 한다.
  */
  const colourCads = Object.values(p.priceFile?.byColour ?? {});
  const folderCad = p.priceFile?.cad ?? (colourCads.length ? Math.min(...colourCads) : null);
  if (!sheet && folderCad === null) {
    warnings.push(`Arc'teryx ${p.name}: 가격표에도 가격.txt 에도 값이 없음 — 건너뜀`);
    continue;
  }

  const auto = sheet ? null : priceFromCad(folderCad);
  const productCad = sheet ? sheet.cad : folderCad;
  const productPriceKrw = sheet ? sheet.priceKrw : auto.priceKrw;
  // 엑셀 상품은 예전부터 배대지·버퍼 없이 원가를 잡아 왔다. 그 값을 여기서 바꾸지 않는다.
  const productCostKrw = sheet ? Math.round(sheet.cad * GST * CAD_KRW) : auto.costKrw;

  const category = categoryOfArcteryx(baseName);
  const variants = [];

  for (const c of p.colors) {
    if (!c.hero) continue;
    const colorSlug = slug(c.color);
    const destBase = join(OUT_IMG, `${productSlug}-${colorSlug}`);
    await toCard(join(p.dir, c.hero.file), destBase);
    await toDetail(join(p.dir, c.hero.file), destBase);
    converted += 2;

    const extras = [];
    for (const img of c.images.filter((i) => i !== c.hero)) {
      const b = `${productSlug}-${colorSlug}-${slug(img.view ?? 'view')}`;
      await toDetail(join(p.dir, img.file), join(OUT_IMG, b));
      extras.push(`/images/products/${b}.webp`);
      converted++;
    }

    /*
      색상마다 값이 다를 수 있다. 아울렛은 한 상품 안에서도 색마다 값이 갈린다
      (실측: Beta AR — Olive Moss 420, 나머지 588). 상품 하나에 가격 하나로 뭉치면
      절반은 틀린 값으로 판다.
    */
    const colourCad = p.priceFile?.byColour?.[colourKey(c.color)] ?? null;
    const colourPrice = colourCad === null ? null : priceFromCad(colourCad);

    variants.push({
      color: c.color,
      colorKo: koLabel(c.color),
      // 색상마다 상품코드가 다를 수 있다 — 한 폴더에 세대가 섞이면 그렇다.
      sku: `${c.sku ?? p.sku ?? 'X'}-${colorSlug.toUpperCase()}`,
      cardImage: `/images/products/${productSlug}-${colorSlug}-card.webp`,
      detailImages: [`/images/products/${productSlug}-${colorSlug}.webp`, ...extras],
      officialUrl: colorUrl(productSlug, c.color),
      smartstoreUrl: smartstoreOf(productSlug, c.color),
      ...(colourPrice
        ? {
            cadCents: Math.round(colourCad * 100),
            costKrw: colourPrice.costKrw,
            priceKrw: colourPrice.priceKrw,
          }
        : {}),
    });
  }

  if (variants.length === 0) {
    warnings.push(`Arc'teryx ${p.name}: 이미지 없음 — 건너뜀`);
    continue;
  }

  const detail = arcteryxDetails[productSlug] ?? null;
  warnStrayColors(productSlug, variants.map((v) => v.color));

  catalog.push({
    slug: productSlug,
    brand: "Arc'teryx",
    brandSlug: 'arcteryx',
    name: baseName,
    gender: p.gender,
    category,
    /*
      공식몰 `Materials & Care` 에서 읽은 값이다. 못 읽었으면 null로 둔다 —
      원산지는 관세(CKFTA)를 가르므로 추정해서 채우지 않는다 (CLAUDE.md 규칙 5).
      실측: 아크테릭스는 베트남·방글라데시·중국·인도네시아 생산이라 **캐나다산이 아니다.**
    */
    originCountry: detail?.originCountry ?? null,
    material: detail?.materials.join(' / ') || null,
    care: detail?.care.join(', ') || null,
    manufacturer: MANUFACTURER.arcteryx,
    /** 공식몰 표기 무게. 없으면 카테고리 추정값으로 배송비를 잡는다 */
    weightG: detail?.weightG ?? null,
    details: detail
      ? {
          description: detail.description,
          productTip: detail.productTip,
          fit: detail.fit,
          groups: detail.groups,
          sourceUrl: detail.sourceUrl,
        }
      : null,
    cadCents: Math.round(productCad * 100),
    costKrw: productCostKrw,
    priceKrw: productPriceKrw,
    krRetailKrw: sheet?.krRetailKrw ?? null,
    // TODO(data): 상품마다 운영자가 정한다. 넣기 전까지는 무게 기준 계산값을 쓴다.
    shippingKrw: null,
    // TODO(data): 스마트스토어에 상품을 올리고 URL을 넣는다. 없으면 구매 버튼이 안 뜬다.
    smartstoreUrl: smartstoreUrls.byProduct[productSlug] ?? null,
    // 상세 수집분과 재고 수집분이 같은 주소를 준다(24/24 대조 확인). 수집기 쪽을 먼저 본다.
    officialUrl: officialUrls.byProduct[productSlug] ?? detail?.sourceUrl ?? null,
    sizes: category === 'accessory' || category === 'bag' ? ['ONE SIZE'] : ['XS', 'S', 'M', 'L', 'XL'],
    variants,
  });
}

// ── 코치 · 폴로 · 룰루레몬 (폴더 텍스트 기반) ─────────────────────
for (const p of others) {
  const productSlug = productSlugOf(p);
  const priced = p.colors.filter((c) => c.priceCad);

  if (priced.length === 0) {
    warnings.push(`${p.brand} ${p.name}: 가격 정보 없음 — 건너뜀 (색상 ${p.colors.length}개)`);
    continue;
  }
  if (priced.length < p.colors.length) {
    warnings.push(
      `${p.brand} ${p.name}: 색상 ${p.colors.length - priced.length}개에 가격이 없어 제외 ` +
        `(${p.colors.filter((c) => !c.priceCad).map((c) => c.label).join(', ')})`,
    );
  }

  const variants = [];
  for (const c of priced) {
    const colorSlug = slug(c.key);
    const base = `${productSlug}-${colorSlug}`;
    const hero = c.images[0];

    await toCard(join(c.dir, hero), join(OUT_IMG, base));
    await toDetail(join(c.dir, hero), join(OUT_IMG, base));
    converted += 2;

    const extras = [];
    for (const [i, file] of c.images.slice(1).entries()) {
      const b = `${base}-${i + 2}`;
      await toDetail(join(c.dir, file), join(OUT_IMG, b));
      extras.push(`/images/products/${b}.webp`);
      converted++;
    }

    const { costKrw, priceKrw } = priceFromCad(c.priceCad);
    variants.push({
      color: c.label,
      colorKo: koLabel(c.label),
      sku: c.styleNo ? `${c.styleNo}-${colorSlug.toUpperCase()}` : `${slug(p.brandSlug).toUpperCase()}-${colorSlug.toUpperCase()}`,
      cardImage: `/images/products/${base}-card.webp`,
      detailImages: [`/images/products/${base}.webp`, ...extras],
      // 캐나다구스는 색상(·디스크)마다 PDP 가 따로다. 있으면 그것이 정확하다.
      officialUrl: colorUrl(productSlug, c.label),
      smartstoreUrl: smartstoreOf(productSlug, c.label),
      // 코치는 소재가 다르면 값이 다르다. 상품 하나에 가격 하나로 뭉치지 않는다.
      cadCents: Math.round(c.priceCad * 100),
      costKrw,
      priceKrw,
      /*
        치수·소재·손잡이·스트랩·특징. **색상마다 다르다** — 코치는 한 상품 폴더에
        스타일이 다른 제품을 묶어 두어서 Brooklyn 28만 해도 색상별로 치수가 다르다.
        그래서 상품이 아니라 variant에 붙인다 (scripts/coach-specs.mjs 참고).
      */
      specs: p.brandSlug === 'coach'
        ? coachSpecs(c.detailsText, (w) => warnings.push(`Coach ${p.name} / ${c.label}: ${w}`))
        : undefined,
    });
  }

  // 대표 가격은 첫 색상의 값이다 — 카드에 쓰는 이미지와 같은 색상이어야 한다
  const lead = variants[0];
  warnStrayColors(productSlug, variants.map((v) => v.color));
  const material =
    p.brandSlug === 'coach' ? ko(coachMaterial(priced[0].detailsText))
    : p.brandSlug === 'polo' ? ko(poloMaterial(p.detailsText))
    : ko(lululemonMaterialCare(p.detailsText).material);
  const care =
    p.brandSlug === 'polo' ? ko(poloCare(p.detailsText))
    : p.brandSlug === 'lululemon' ? ko(lululemonMaterialCare(p.detailsText).care)
    : null;

  catalog.push({
    slug: productSlug,
    brand: p.brand,
    brandSlug: p.brandSlug,
    name: p.name,
    gender: p.gender,
    category: p.category,
    /*
      실물 라벨을 봐야 안다. 브랜드 국적으로 추정하지 않는다 (PROJECT.md §3.3).
      파서가 details.txt의 `ORIGIN / Made in …` 문장을 읽어 준 경우에만 채운다 —
      캐나다구스는 문서에 적혀 있고, 나머지 브랜드는 아직 null이다.
      CA면 CKFTA로 관세가 0%가 되지만 **부가세 10%는 그대로 부과된다.**
    */
    originCountry: p.originCountry ?? null,
    material,
    care,
    manufacturer: MANUFACTURER[p.brandSlug] ?? null,
    cadCents: lead.cadCents,
    costKrw: lead.costKrw,
    priceKrw: lead.priceKrw,
    // 한국 정발가는 확인된 것만 넣는다. 추정치를 넣지 않는다.
    krRetailKrw: null,
    // TODO(data): 상품마다 운영자가 정한다. 넣기 전까지는 무게 기준 계산값을 쓴다.
    shippingKrw: null,
    // TODO(data): 스마트스토어에 상품을 올리고 URL을 넣는다. 없으면 구매 버튼이 안 뜬다.
    smartstoreUrl: smartstoreUrls.byProduct[productSlug] ?? null,
    officialUrl: officialUrls.byProduct[productSlug] ?? null,
    sizes: p.sizes,
    variants,
  });
}

const header = `/**
 * ⚠️ 생성 파일 — 직접 수정하지 말 것. \`npm run catalog:import\`로 재생성한다.
 *
 * 원본: 아크테릭스/(+가격표 비교.xlsx) · 코치/ · 폴로/ · 룰루레몬/
 * 생성: ${new Date().toISOString().slice(0, 10)}
 *
 * 아직 채워야 하는 값:
 *   - originCountry: 전부 null이다. **실물 라벨을 보고** 채운다. 브랜드 국적으로 추정 금지.
 *     캐나다산이 아니면 CKFTA 관세 면제를 받을 수 없다 (PROJECT.md §3.3).
 *   - weightG: 배송비 산정에 필요하다. 실측하거나 공식몰 스펙에서 가져온다.
 *   - krRetailKrw: 아크테릭스만 있다. 나머지는 한국 정발가 확인 후 채운다.
 *   - shippingKrw: 전부 null이다. 관리자 상품 등록 화면에서 상품마다 입력한다.
 *   - smartstoreUrl: scripts/smartstore-urls.json 에 채운다. 없으면 구매 버튼 대신 안내가 뜬다.
 *     색상마다 스토어 상품을 따로 등록했으면 byColor 로 적는다 — 그러면 고객이 색을 다시 안 고른다.
 */
`;

const types = `export type CatalogVariant = {
  color: string;
  colorKo: string;
  sku: string;
  cardImage: string;
  detailImages: string[];
  /**
   * 이 색상의 공식몰 페이지. 색상마다 PDP 가 다른 브랜드(캐나다구스)에서만 채워진다.
   * null 이면 상품 단위 officialUrl 로 떨어진다 — 그 판단은 읽는 쪽이 한다.
   */
  officialUrl: string | null;
  /**
   * 이 색상만의 스마트스토어 상품 페이지. 색상마다 상품을 따로 등록했을 때 채워진다.
   * 있으면 고객이 우리 화면에서 고른 색을 스마트스토어에서 다시 고르지 않아도 된다.
   * null 이면 상품 단위 smartstoreUrl 로 떨어진다 — 그 판단은 읽는 쪽이 한다.
   */
  smartstoreUrl: string | null;
  /** 색상마다 값이 다른 경우에만 있다 (코치 — 소재가 다르면 가격이 다르다) */
  cadCents?: number;
  costKrw?: number;
  priceKrw?: number;
  /**
   * 상품 상세에 그대로 띄우는 스펙. 공식몰 표기를 옮긴 것이고 지어낸 값이 아니다.
   * 코치만 있다 — 다른 브랜드는 원본에 이만한 구조가 없다.
   */
  specs?: { label: string; values: string[] }[];
};

export type CatalogProduct = {
  slug: string;
  brand: string;
  brandSlug: string;
  name: string;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  category: string;
  /** 실물 라벨 기준. 미확인이면 null */
  originCountry: string | null;
  /** 공식몰 표기 무게(g). 없으면 카테고리 추정값을 쓴다 (weightGOf) */
  weightG?: number | null;
  /**
   * 공식몰 상품 상세. 아크테릭스만 있다 — 다른 브랜드는 원본에 이만한 구조가 없다.
   * 값(영문 스펙 문장)은 제조사 표기 그대로다. 라벨만 한국어로 옮겼다.
   */
  details?: {
    description: string | null;
    productTip: string | null;
    fit: { label: string; text: string | null } | null;
    groups: { label: string; values: string[] }[];
    sourceUrl: string | null;
  } | null;
  /** 상품 정보 제공 고시 — 케어 라벨에서 옮긴 값. 없으면 null */
  material: string | null;
  care: string | null;
  manufacturer: string | null;
  cadCents: number;
  costKrw: number;
  /** 대표 판매가. 색상별로 다르면 variant.priceKrw가 우선한다 */
  priceKrw: number;
  /** 한국 정발가. 비교 표시용 */
  krRetailKrw: number | null;
  /**
   * 이 상품 한 점의 국제 배송비(원). 관리자 상품 등록 화면에서 직접 넣는다.
   * null이면 무게·부피 기반 계산값을 쓴다 — 0은 무료배송이므로 null과 다르다.
   */
  shippingKrw: number | null;
  /**
   * 네이버 스마트스토어 상품 URL. 결제는 전부 여기서 일어난다.
   * 없으면 살 수 있는 경로가 없으므로 PDP가 구매 버튼 대신 안내를 띄운다.
   */
  smartstoreUrl: string | null;
  /**
   * 이 상품의 브랜드 공식몰 페이지. 브랜드 홈이 아니라 상품 페이지다.
   * 없으면 null — 브랜드 홈 주소로 대신 채우지 않는다.
   */
  officialUrl: string | null;
  sizes: string[];
  variants: CatalogVariant[];
};
`;

await writeFile(
  join(ROOT, 'src/lib/catalog.generated.ts'),
  `${header}\n${types}\nexport const CATALOG: CatalogProduct[] = ${JSON.stringify(catalog, null, 2)};

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}
`,
);

const byBrand = {};
for (const p of catalog) byBrand[p.brandSlug] = (byBrand[p.brandSlug] ?? 0) + 1;

console.log(
  `상품 ${catalog.length}개 · 옵션 ${catalog.reduce((s, p) => s + p.variants.length, 0)}개 · 이미지 ${converted}장 변환`,
);
console.log('브랜드별: ' + Object.entries(byBrand).map(([b, n]) => `${b} ${n}`).join(' · '));
if (warnings.length) {
  console.log('\n확인이 필요한 것:');
  for (const w of warnings) console.log('  ' + w);
}
