/**
 * 아크테릭스 상품 임포터.
 *
 *   1. 폴더 + 가격표를 파싱한다 (parse-arcteryx.mjs)
 *   2. .avif 원본을 카드용/상세용 webp 두 크기로 변환해 public/images/products/에 넣는다
 *   3. 카탈로그 TS 파일과 seed SQL을 생성한다
 *
 * 사용: npm run catalog:import
 *
 * 원본(아크테릭스/)은 건드리지 않는다. 재실행하면 결과물만 다시 만든다.
 */
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parseAll } from './parse-arcteryx.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_IMG = join(ROOT, 'public/images/products');
const CARD_W = 900;   // 4:5 카드 · 2x 레티나
const DETAIL_W = 1600;

/** 알버타 GST 5%. 원가 = CAD × 1.05 × 환율 (PROJECT.md §5) */
const GST = 1.05;
/** 가격표가 쓴 환율. TODO(fx): fx_rates에서 읽는다 */
const CAD_KRW = 1000;

function slug(s) {
  return s.toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 색상명을 한국어 표기로. 없으면 영문 그대로 둔다 — 지어내지 않는다. */
const COLOR_KO = {
  Black: '블랙', 'Graphite Black': '그래파이트 블랙', '24K Black': '24K 블랙',
  'Sea Salt': '씨솔트', 'Cloud Void': '클라우드 보이드', Cloud: '클라우드',
  Void: '보이드', 'Void Cloud': '보이드 클라우드', Headwaters: '헤드워터스',
  Habitat: '해비탯', Mongoose: '몽구스', Tatsu: '타츠', 'Alpine Rose': '알파인 로즈',
  'Alpine Blue': '알파인 블루', 'Arctic Silk': '아틱 실크', 'Atmos Solitude': '아트모스 솔리튜드',
  'Lt Renegade': '라이트 레니게이드', 'Arctic Silk Sea Salt': '아틱 실크 씨솔트',
  'Mongoose Sea Salt': '몽구스 씨솔트',
};

/** 카테고리 추론. 이름에서 확실할 때만 정하고 애매하면 outerwear로 둔다. */
function categoryOf(name) {
  if (/Backpack/i.test(name)) return 'bag';
  if (/Toque|Beanie|Cap|Hat/i.test(name)) return 'accessory';
  if (/Hoody|Hoodie/i.test(name)) return 'top';
  return 'outerwear';
}

const SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL'];

async function convert(srcPath, destBase) {
  const buf = await readFile(srcPath);
  const img = sharp(buf);
  const meta = await img.metadata();
  // 4:5로 잘라 카드 리듬을 맞춘다. 원본이 이미 세로면 그대로 맞물린다.
  await sharp(buf).resize(CARD_W, Math.round(CARD_W * 1.25), { fit: 'cover', position: 'attention' })
    .webp({ quality: 78 }).toFile(`${destBase}-card.webp`);
  await sharp(buf).resize(DETAIL_W, null, { withoutEnlargement: true })
    .webp({ quality: 80 }).toFile(`${destBase}.webp`);
  return { width: meta.width, height: meta.height };
}

const products = await parseAll();
await rm(OUT_IMG, { recursive: true, force: true });
await mkdir(OUT_IMG, { recursive: true });

const catalog = [];
let converted = 0;
const warnings = [];

for (const p of products) {
  const baseName = p.name.replace(/\s+(Men|Women)'s$/i, '').trim();
  const productSlug = slug(`arcteryx ${baseName} ${p.gender === 'unisex' ? '' : p.gender}`);

  if (!p.price) {
    warnings.push(`${p.name}: 가격표에 없음 — 건너뜀`);
    continue;
  }

  const cad = p.price.cad;
  const costKrw = Math.round(cad * GST * CAD_KRW);
  const priceKrw = p.price.priceKrw;
  if (!priceKrw) {
    warnings.push(`${p.name}: 판매가 없음 — 건너뜀`);
    continue;
  }

  const variants = [];
  for (const c of p.colors) {
    if (!c.hero) continue;
    const colorSlug = slug(c.color);
    const destBase = join(OUT_IMG, `${productSlug}-${colorSlug}`);
    await convert(join(p.dir, c.hero.file), destBase);
    converted++;

    // 상세용 추가 컷. 레퍼런스가 2열 그리드로 6장 이상을 보여주므로 있는 대로 다 쓴다.
    const extras = [];
    for (const img of c.images.filter((i) => i !== c.hero)) {
      const b = join(OUT_IMG, `${productSlug}-${colorSlug}-${slug(img.view ?? 'view')}`);
      await sharp(await readFile(join(p.dir, img.file)))
        .resize(DETAIL_W, null, { withoutEnlargement: true })
        .webp({ quality: 80 }).toFile(`${b}.webp`);
      extras.push(`/images/products/${productSlug}-${colorSlug}-${slug(img.view ?? 'view')}.webp`);
      converted++;
    }

    variants.push({
      color: c.color,
      colorKo: COLOR_KO[c.color] ?? c.color,
      sku: `${p.sku ?? 'X'}-${colorSlug.toUpperCase()}`,
      cardImage: `/images/products/${productSlug}-${colorSlug}-card.webp`,
      detailImages: [`/images/products/${productSlug}-${colorSlug}.webp`, ...extras],
    });
  }

  if (variants.length === 0) {
    warnings.push(`${p.name}: 이미지 없음 — 건너뜀`);
    continue;
  }

  catalog.push({
    slug: productSlug,
    brand: "Arc'teryx",
    brandSlug: 'arcteryx',
    name: baseName,
    gender: p.gender,
    category: categoryOf(baseName),
    // 원산지는 실물 라벨을 봐야 안다. 브랜드 국적으로 추정하지 않는다 (PROJECT.md §3.3)
    originCountry: null,
    cadCents: Math.round(cad * 100),
    costKrw,
    priceKrw,
    krRetailKrw: p.price.krRetailKrw ?? null,
    sizes: categoryOf(baseName) === 'accessory' || categoryOf(baseName) === 'bag'
      ? ['ONE SIZE'] : SIZES_APPAREL,
    variants,
  });
}

const header = `/**
 * ⚠️ 생성 파일 — 직접 수정하지 말 것. \`npm run catalog:import\`로 재생성한다.
 *
 * 원본: 아크테릭스/ 폴더 + 가격표 비교.xlsx
 * 생성: ${new Date().toISOString().slice(0, 10)}
 *
 * 주의 — 아직 채워야 하는 값:
 *   - originCountry: 전부 null이다. **실물 라벨을 보고** 채운다. 브랜드 국적으로 추정 금지.
 *     캐나다산이 아니면 CKFTA 관세 면제를 받을 수 없다 (PROJECT.md §3.3).
 *   - weightG: 배송비 산정에 필요하다. 실측하거나 공식몰 스펙에서 가져온다.
 */
`;

await writeFile(
  join(ROOT, 'src/lib/catalog.generated.ts'),
  header + `export type CatalogVariant = {
  color: string;
  colorKo: string;
  sku: string;
  cardImage: string;
  detailImages: string[];
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
  cadCents: number;
  /** CAD × 1.05(GST) × 환율 */
  costKrw: number;
  priceKrw: number;
  /** 한국 정발가. 비교 표시용 */
  krRetailKrw: number | null;
  sizes: string[];
  variants: CatalogVariant[];
};

export const CATALOG: CatalogProduct[] = ${JSON.stringify(catalog, null, 2)};

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}
`,
);

console.log(`상품 ${catalog.length}개 · 옵션 ${catalog.reduce((s, p) => s + p.variants.length, 0)}개 · 이미지 ${converted}장 변환`);
if (warnings.length) {
  console.log('\n건너뛴 것:');
  for (const w of warnings) console.log('  ' + w);
}
