/**
 * 코치 · 폴로 · 룰루레몬 상품 폴더 파서.
 *
 * 아크테릭스와 달리 이 셋은 **가격표 엑셀이 없다.** 가격은 폴더 안 텍스트 파일 끝에
 * `279CAD` 형태로 들어 있고, 코치는 색상(소재)마다 값이 다르다.
 *
 * 폴더 구조
 *   코치/{상품}/{소재,하드웨어,색상}/{Details.txt, *.webp}        + 상품 레벨 note.txt
 *   폴로/{남성|여성}/{상품}/{색상}/*.avif                          + 상품 레벨 details.txt
 *   룰루레몬/{상품}/{색상}/*.webp                                  + 상품 레벨 details.txt
 *
 * 원본은 읽기만 한다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * 파서가 조용히 버린 것들.
 *
 * 폴더가 규칙에서 벗어나면 `continue` 로 넘어가는데, 아무 말도 안 하면
 * 원본에 14개가 있어도 카탈로그에 11개만 생기고 아무도 눈치채지 못한다
 * (실측: 폴로 옥스퍼드 셔츠 2건이 색상 폴더가 없어 통째로 사라져 있었다).
 * 임포터가 이 배열을 그대로 경고로 찍는다.
 */
export const parseWarnings = [];

/**
 * 원본 폴더명에 콤마·띄어쓰기가 빠진 것들. 소스를 고칠 수 없으니 여기서 바로잡는다.
 * **없는 색을 만들지 않는다** — 이미 있는 이름을 읽을 수 있게 띄우는 것뿐이다.
 */
const FOLDER_FIX = {
  'Sweet SorbetPink Pearl': 'Sweet Sorbet,Pink Pearl',
  'LilacPlay,White': 'Lilac Play,White',
  'French,PressBurnt Caramel': 'French Press,Burnt Caramel',
  'Polo BlackWhite': 'Polo Black,White',
  'Collection Camel Melang': 'Collection Camel Melange',
};
const fixFolder = (name) => FOLDER_FIX[name] ?? name;

/** WSL이 남기는 NTFS 대체 스트림. 실제 이미지가 아니다. */
const isImage = (f) => /\.(webp|avif|jpe?g|png)$/i.test(f) && !f.includes(':');

async function dirs(path) {
  try {
    return (await readdir(path, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
}

async function readText(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** 텍스트 끝의 `279CAD` → 279. 없으면 null (가격 없는 상품은 등록하지 않는다) */
function priceCadOf(text) {
  if (!text) return null;
  const all = [...text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*CAD/gi)];
  return all.length ? Number(all[all.length - 1][1]) : null;
}

/** `Style Number\nCV934` / `Style Number: 650001` 둘 다 받는다 */
function styleNoOf(text) {
  if (!text) return null;
  const m = text.match(/Style\s*Number[:\s]*\n?\s*([A-Za-z0-9-]+)/i);
  return m ? m[1] : null;
}

// ── 이미지 정렬 ───────────────────────────────────────────────────
// 파일명 끝의 숫자로 정렬한다. 브랜드마다 접미사 규칙이 달라 자연 정렬만으로는 어긋난다.
const trailingNum = (f) => {
  const m = f.match(/(\d+)\.[a-z]+$/i);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
};

function sortCoach(files) {
  // cv934_imblk_a0 · a3 · a8 · a10 … a0이 정면 컷이다
  return [...files].sort((a, b) => trailingNum(a) - trailingNum(b));
}

function sortPolo(files) {
  // alternate1 → alternate10 순으로 두고 lifestyle(모델 착용)은 뒤로 보낸다
  const rank = (f) => (/lifestyle/i.test(f) ? 1 : 0);
  return [...files].sort((a, b) => rank(a) - rank(b) || trailingNum(a) - trailingNum(b));
}

// ── 코치 ─────────────────────────────────────────────────────────

/** 하드웨어 표기. 색상이 아니므로 색상명에서 뺀다. */
const COACH_HARDWARE = new Set(['gold', 'brass', 'silver', 'gunmetal', 'goldwalnut']);

/**
 * 폴더명 `signature canvas,Gold,Walnut,Black` 을 소재/색상으로 나눈다.
 * 첫 조각이 소재, 하드웨어는 버리고, 남는 조각을 이어 색상으로 쓴다.
 */
function splitCoachFolder(folder) {
  const parts = folder.split(',').map((s) => s.trim()).filter(Boolean);
  let material = null;
  const rest = [];
  for (const [i, part] of parts.entries()) {
    const key = part.toLowerCase().replace(/\s+/g, '');
    if (COACH_HARDWARE.has(key)) continue;
    if (i === 0 && /leather|canvas|suede|straw|nylon|denim/i.test(part)) {
      material = part;
      continue;
    }
    rest.push(part);
  }
  return { material, color: rest.join(' ') || '기본' };
}

/**
 * 코치 가방은 전부 여성 라인으로 둔다 — 운영자 확인(2026-08-28).
 * 스테이션 캐리올처럼 공용으로 보이는 모델도 여기서는 여성으로 취급한다.
 */
export async function parseCoach() {
  const src = join(ROOT, '코치');
  const out = [];

  for (const name of await dirs(src)) {
    const productDir = join(src, name);
    const note = await readText(join(productDir, 'note.txt'));
    const colors = [];

    for (const folder of await dirs(productDir)) {
      const colorDir = join(productDir, folder);
      const files = (await readdir(colorDir)).filter(isImage);
      if (files.length === 0) continue;

      const details = await readText(join(colorDir, 'Details.txt'));
      const priceCad = priceCadOf(details);
      const { material, color } = splitCoachFolder(folder);

      colors.push({
        key: folder,
        color,
        material,
        priceCad,
        styleNo: styleNoOf(details),
        detailsText: details,
        dir: colorDir,
        images: sortCoach(files),
      });
    }

    if (colors.length === 0) continue;

    // 소재가 둘 이상이면 색상명만으로 구분이 안 된다 — 코치가 실제로 그렇게 표기한다
    const materials = new Set(colors.map((c) => c.material).filter(Boolean));
    for (const c of colors) {
      c.label = materials.size > 1 && c.material ? `${c.material} ${c.color}` : c.color;
    }

    out.push({
      brand: 'Coach',
      brandSlug: 'coach',
      name,
      gender: 'women',
      category: 'bag',
      sizes: ['ONE SIZE'],
      note,
      colors,
    });
  }
  return out;
}

// ── 폴로 ─────────────────────────────────────────────────────────

function poloCategory(name) {
  if (/Shirt/i.test(name)) return 'top';
  if (/Sweater|Cardigan|Pullover|Hoodie/i.test(name)) return 'top';
  if (/Jacket|Coat|Vest/i.test(name)) return 'outerwear';
  if (/Pant|Chino|Short|Jean/i.test(name)) return 'bottom';
  return 'top';
}

const POLO_SIZES = {
  men: ['S', 'M', 'L', 'XL', 'XXL'],
  women: ['XS', 'S', 'M', 'L', 'XL'],
};

export async function parsePolo() {
  const src = join(ROOT, '폴로');
  const out = [];

  for (const genderDir of await dirs(src)) {
    const gender = genderDir === '남성' ? 'men' : genderDir === '여성' ? 'women' : null;
    if (!gender) continue;

    for (const name of await dirs(join(src, genderDir))) {
      const productDir = join(src, genderDir, name);
      const details = await readText(join(productDir, 'details.txt'));
      const priceCad = priceCadOf(details);
      const colors = [];

      for (const folder of await dirs(productDir)) {
        const colorDir = join(productDir, folder);
        const files = (await readdir(colorDir)).filter(isImage);
        if (files.length === 0) continue;
        const fixed = fixFolder(folder);
        colors.push({
          key: folder,
          color: fixed.replace(/,/g, ' / '),
          label: fixed.replace(/,/g, ' / '),
          material: null,
          priceCad,
          styleNo: styleNoOf(details),
          dir: colorDir,
          images: sortPolo(files),
        });
      }

      if (colors.length === 0) {
        const loose = (await readdir(productDir)).filter(isImage).length;
        parseWarnings.push(
          `폴로 ${genderDir}/${name}: 색상 폴더가 없어 건너뜀` +
            (loose > 0
              ? ` — 이미지 ${loose}장이 상품 폴더에 바로 있다. 색상명 폴더를 만들어 옮겨라`
              : ' — 이미지가 없다'),
        );
        continue;
      }
      if (!styleNoOf(details)) {
        parseWarnings.push(
          `폴로 ${genderDir}/${name}: details.txt 에 Style Number 가 없다 — ` +
            '상품코드가 없으면 캐나다 공식몰 재고 조회 대상에서 빠진다',
        );
      }

      out.push({
        brand: 'Polo Ralph Lauren',
        brandSlug: 'polo',
        name,
        gender,
        category: poloCategory(name),
        sizes: POLO_SIZES[gender],
        detailsText: details,
        colors,
      });
    }
  }
  return out;
}

// ── 룰루레몬 ──────────────────────────────────────────────────────

/**
 * 상품명이 성별을 말해 준다. 헤어 클립은 룰루레몬이 여성 액세서리로 분류한다 —
 * 공용으로 두면 `Men's` 목록에 집게핀이 뜬다.
 */
function lululemonGender(name) {
  if (/^Men's/i.test(name)) return 'men';
  if (/^Women's/i.test(name)) return 'women';
  if (/Claw|Hair Clip|Scrunchie/i.test(name)) return 'women';
  return 'unisex';
}

function lululemonCategory(name) {
  if (/Claw|Hair Clip|Bag|Belt|Vest|Pack/i.test(name)) return 'accessory';
  if (/Jacket|Coat/i.test(name)) return 'outerwear';
  if (/Pant|Legging|Short|Tight/i.test(name)) return 'bottom';
  return 'top';
}

/** 상세 텍스트의 Chest Measurements 블록에서 사이즈 라벨을 뽑는다 (`S/M: 83.8cm…`) */
function lululemonSizes(text, category) {
  if (!text) return category === 'accessory' ? ['ONE SIZE'] : ['XS', 'S', 'M', 'L', 'XL'];
  const found = [...text.matchAll(/^\s*([A-Z]{1,3}(?:\/[A-Z]{1,3})?)\s*:\s*[\d.]+cm/gim)].map((m) => m[1]);
  if (found.length > 0) return [...new Set(found)];
  return category === 'accessory' ? ['ONE SIZE'] : ['XS', 'S', 'M', 'L', 'XL'];
}

export async function parseLululemon() {
  const src = join(ROOT, '룰루레몬');
  const out = [];

  for (const name of await dirs(src)) {
    const productDir = join(src, name);
    const details = await readText(join(productDir, 'details.txt'));
    const priceCad = priceCadOf(details);
    const category = lululemonCategory(name);
    const colors = [];

    for (const folder of await dirs(productDir)) {
      const colorDir = join(productDir, folder);
      const files = (await readdir(colorDir)).filter(isImage);
      if (files.length === 0) continue;
      // `Sweet Sorbet,Pink Pearl` 처럼 두 색이 콤마로 붙어 온다
      const color = fixFolder(folder).split(',').map((s) => s.trim()).filter(Boolean).join(' / ');
      colors.push({
        key: folder,
        color,
        label: color,
        material: null,
        priceCad,
        styleNo: null,
        dir: colorDir,
        images: [...files].sort((a, b) => trailingNum(a) - trailingNum(b)),
      });
    }

    if (colors.length === 0) continue;

    out.push({
      brand: 'lululemon',
      brandSlug: 'lululemon',
      // 상품명의 성별 접두사는 목록에서 중복이라 뗀다 — 성별은 필터가 말해 준다
      name: name.replace(/^(Men's|Women's)\s+/i, ''),
      gender: lululemonGender(name),
      category,
      sizes: lululemonSizes(details, category),
      detailsText: details,
      colors,
    });
  }
  return out;
}

export async function parseNewBrands() {
  parseWarnings.length = 0;
  const [coach, polo, lulu] = await Promise.all([parseCoach(), parsePolo(), parseLululemon()]);
  return [...coach, ...polo, ...lulu];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const products = await parseNewBrands();
  let noPrice = 0;
  for (const p of products) {
    console.log(`${p.brandSlug.padEnd(10)} ${p.gender.padEnd(7)} ${p.name}  [${p.category}] ${p.sizes.join('/')}`);
    for (const c of p.colors) {
      const price = c.priceCad ? `CA$${c.priceCad}` : '⚠ 가격 없음';
      if (!c.priceCad) noPrice++;
      console.log(`   ${String(c.label).padEnd(40)} ${String(price).padEnd(12)} 이미지 ${c.images.length}장`);
    }
  }
  console.log(`\n상품 ${products.length}개 · 색상 ${products.reduce((s, p) => s + p.colors.length, 0)}개 · 가격 없음 ${noPrice}개`);
  for (const w of parseWarnings) console.log(`⚠ ${w}`);
}
