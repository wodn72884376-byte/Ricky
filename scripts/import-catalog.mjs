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
import { parseAll } from './parse-arcteryx.mjs';
import { parseNewBrands, parseWarnings } from './parse-brands.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
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
};

/** 조각 단위로 번역한다. `suede Warm Brown` → `스웨이드 웜 브라운` */
function koLabel(label) {
  if (KO[label]) return KO[label];
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
};

// ── 이미지 변환 ───────────────────────────────────────────────────

async function toCard(srcPath, destBase) {
  await sharp(await readFile(srcPath))
    .resize(CARD_W, Math.round(CARD_W * 1.25), { fit: 'cover', position: 'attention' })
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
let converted = 0;

function categoryOfArcteryx(name) {
  if (/Backpack/i.test(name)) return 'bag';
  if (/Toque|Beanie|Cap|Hat/i.test(name)) return 'accessory';
  if (/Hoody|Hoodie/i.test(name)) return 'top';
  return 'outerwear';
}

// ── 아크테릭스 (가격표 기반) ───────────────────────────────────────
for (const p of arcteryx) {
  const baseName = p.name.replace(/\s+(Men|Women)'s$/i, '').trim();
  const productSlug = slug(`arcteryx ${baseName} ${p.gender === 'unisex' ? '' : p.gender}`);

  if (!p.price?.priceKrw) {
    warnings.push(`Arc'teryx ${p.name}: 가격표에 없음 — 건너뜀`);
    continue;
  }

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

    variants.push({
      color: c.color,
      colorKo: koLabel(c.color),
      sku: `${p.sku ?? 'X'}-${colorSlug.toUpperCase()}`,
      cardImage: `/images/products/${productSlug}-${colorSlug}-card.webp`,
      detailImages: [`/images/products/${productSlug}-${colorSlug}.webp`, ...extras],
    });
  }

  if (variants.length === 0) {
    warnings.push(`Arc'teryx ${p.name}: 이미지 없음 — 건너뜀`);
    continue;
  }

  catalog.push({
    slug: productSlug,
    brand: "Arc'teryx",
    brandSlug: 'arcteryx',
    name: baseName,
    gender: p.gender,
    category,
    originCountry: null,
    material: null,
    care: null,
    manufacturer: MANUFACTURER.arcteryx,
    cadCents: Math.round(p.price.cad * 100),
    costKrw: Math.round(p.price.cad * GST * CAD_KRW),
    priceKrw: p.price.priceKrw,
    krRetailKrw: p.price.krRetailKrw ?? null,
    // TODO(data): 상품마다 운영자가 정한다. 넣기 전까지는 무게 기준 계산값을 쓴다.
    shippingKrw: null,
    // TODO(data): 스마트스토어에 상품을 올리고 URL을 넣는다. 없으면 구매 버튼이 안 뜬다.
    smartstoreUrl: null,
    sizes: category === 'accessory' || category === 'bag' ? ['ONE SIZE'] : ['XS', 'S', 'M', 'L', 'XL'],
    variants,
  });
}

// ── 코치 · 폴로 · 룰루레몬 (폴더 텍스트 기반) ─────────────────────
for (const p of others) {
  const productSlug = slug(`${p.brandSlug} ${p.name} ${p.gender === 'unisex' ? '' : p.gender}`);
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
      // 코치는 소재가 다르면 값이 다르다. 상품 하나에 가격 하나로 뭉치지 않는다.
      cadCents: Math.round(c.priceCad * 100),
      costKrw,
      priceKrw,
    });
  }

  // 대표 가격은 첫 색상의 값이다 — 카드에 쓰는 이미지와 같은 색상이어야 한다
  const lead = variants[0];
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
    // 실물 라벨을 봐야 안다. 브랜드 국적으로 추정하지 않는다 (PROJECT.md §3.3)
    originCountry: null,
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
    smartstoreUrl: null,
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
 *   - smartstoreUrl: 전부 null이다. 스마트스토어 상품 URL을 넣어야 구매 버튼이 뜬다.
 */
`;

const types = `export type CatalogVariant = {
  color: string;
  colorKo: string;
  sku: string;
  cardImage: string;
  detailImages: string[];
  /** 색상마다 값이 다른 경우에만 있다 (코치 — 소재가 다르면 가격이 다르다) */
  cadCents?: number;
  costKrw?: number;
  priceKrw?: number;
};

export type CatalogProduct = {
  slug: string;
  brand: string;
  brandSlug: string;
  name: string;
  gender: 'men' | 'women' | 'unisex';
  category: string;
  /** 실물 라벨 기준. 미확인이면 null */
  originCountry: string | null;
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
