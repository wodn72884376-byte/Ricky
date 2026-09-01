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

/**
 * `ORIGIN\nMade in Canada` → 'CA'.
 *
 * **실물 라벨 기준으로만 읽는다** (CLAUDE.md 규칙 5). 브랜드가 캐나다 회사라는 이유로
 * CA를 넣지 않는다 — 캐나다구스도 상당수 품목을 해외에서 만든다.
 * 문서에 적힌 문장이 없으면 null이고, 그러면 CKFTA를 적용하지 않는다.
 */
function originOf(text) {
  if (!text) return null;
  const m = text.match(/^ORIGIN\s*\n\s*Made in ([A-Za-z ]+)/im);
  if (!m) return null;
  const country = m[1].trim().toLowerCase();
  // 아는 것만 코드로 바꾼다. 모르면 null로 두고 사람이 채운다.
  return { canada: 'CA', italy: 'IT', vietnam: 'VN', china: 'CN', 'sri lanka': 'LK' }[country] ?? null;
}

/** 캐나다구스 `Style:\n1741M`. 값이 빈 줄인 상품이 있어 null을 돌려줄 수 있다. */
function cgStyleOf(text) {
  if (!text) return null;
  // `\s`는 줄바꿈도 먹으므로 빈 줄을 건너뛰어 엉뚱한 값을 집는다 —
  // Garson Vest는 `Style:` 다음이 빈 줄이라 그 아래 `650CAD`를 스타일로 읽었다.
  // 바로 다음 줄만 본다.
  const m = text.match(/^Style:[^\S\n]*\n[^\S\n]*([A-Za-z0-9-]+)[^\S\n]*$/im);
  return m ? m[1] : null;
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

/**
 * 캐나다구스는 `2052M_61.avif`(대표) + `2052M_61_a.avif`(부가) 형태다.
 * 접미사 없는 것이 정면 컷이므로 맨 앞에 두고 나머지는 접미사 순으로 고정한다.
 */
function sortCanadaGoose(files) {
  const suffix = (f) => f.replace(/\.[a-z]+$/i, '').match(/_([a-z])$/i)?.[1]?.toLowerCase() ?? '';
  return [...files].sort((a, b) => suffix(a).localeCompare(suffix(b)) || a.localeCompare(b));
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
          // 바로잡은 이름으로 SKU·이미지 파일명을 만든다. 원본 폴더명을 쓰면 오타가
          // SKU 에 그대로 굳는다 — 실측: `Collection Camel Melang` 폴더 탓에 SKU 가
          // `…-COLLECTION-CAMEL-MELANG` 이 되어 수집한 `Collection Camel Melange` 와
          // 대조되지 않았다. SKU 는 Supabase 조인 키라 틀리면 재고가 안 붙는다.
          key: fixed,
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
        // 폴로와 같은 이유 — 바로잡은 이름으로 SKU 를 만든다
        key: fixFolder(folder),
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

// ── 캐나다구스 ────────────────────────────────────────────────────

/**
 * 다운 아우터 브랜드다. 파카·베스트·후디 전부 아우터로 둔다 —
 * `Lodge Hoodie`는 이름만 후디이고 다운이 들어간 겉옷이다.
 */
function canadaGooseCategory(name) {
  if (/Parka|Vest|Jacket|Coat|Bomber|Hoodie|Shell/i.test(name)) return 'outerwear';
  return 'outerwear';
}

/**
 * 사이즈는 details.txt에 없다. 캐나다구스 남성 아우터의 표준 전개를 쓴다.
 * **확인이 필요한 값이다** — 상품마다 XXL이 없을 수 있다.
 */
const CANADA_GOOSE_SIZES = {
  men: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  women: ['XS', 'S', 'M', 'L', 'XL'],
};

/**
 * 최상위 폴더 → 성별과 사이즈 전개.
 *
 * 아동은 **두 라인의 사이즈 척도가 다르다.** 공식 사이즈 표를 그대로 옮긴 값이다:
 *   2~7years  나이 구간 자체가 사이즈다
 *   6+years   문자 사이즈에 나이를 괄호로 병기한다
 * 겹치는 6~7세 때문에 Vanier Vest 가 양쪽에 다 있고, 스타일 코드로 갈린다(4554K / 4554Y).
 *
 * `gender` 는 셋 다 'kids' 다 — 나이대는 성별이 아니라 사이즈의 문제다 (20260830000014).
 */
const CANADA_GOOSE_LINES = {
  '남성': { gender: 'men', sizes: CANADA_GOOSE_SIZES.men },
  '여성': { gender: 'women', sizes: CANADA_GOOSE_SIZES.women },
  'KIDS(2~7years)': { gender: 'kids', sizes: ['2-3', '4-5', '6-7'] },
  'KIDS(6+years)': {
    gender: 'kids',
    sizes: ['XS (6)', 'S (7-8)', 'M (10-12)', 'L (14-16)', 'XL (18)'],
  },
};

/** 상품명 끝의 디스크 표기. 색상 속성이지 상품 이름이 아니다. */
const stripDisc = (name) => name.replace(/\s+(Black|Classic|Tonal)?\s*Dis[ck]$/i, '').trim();

/**
 * 디스크 폴더명을 공식 표기로 모은다.
 *
 * 원본 폴더가 제각각이다 — `Disk Classic` · `Disk black` · `Classic Disk` · `Black Disk`.
 * 캐나다구스 공식 표기는 **형용사 + Disc**(`Black Disc`)이고 details.txt의 `DISC` 섹션도
 * 같은 형용사를 쓴다. 어순·대소문자·철자(Disk→Disc)를 여기서 한 번에 맞춘다.
 *
 * 없는 색을 만드는 것이 아니라 이미 있는 이름을 바로 읽는 것이다 (FOLDER_FIX와 같은 취지).
 * 아는 형태가 아니면 null을 돌려주고 폴더명을 그대로 쓴다 — 지어내지 않는다.
 */
function normalizeDisc(folder) {
  const m = folder.trim().match(/^(?:dis[ck]\s+)?(classic|black|tonal)(?:\s+dis[ck])?$/i);
  if (!m) return null;
  const word = m[1].toLowerCase();
  return `${word[0].toUpperCase()}${word.slice(1)} Disc`;
}

/**
 * 이미지 파일명 `2081MB_433_a.avif` 앞자리가 스타일 코드다.
 *
 * **details.txt보다 이 값을 우선한다.** details.txt는 디스크 폴더마다 놓여 있지 않아
 * 없으면 상품 레벨을 물려받는데, 그러면 디스크가 달라도 코드가 같아진다 —
 * 실측 13건(Lodge Hoodie·MacMillan Parka)이 그랬다. 이미지 파일은 색상 폴더 안에
 * 실제로 놓인 자산이라 물려받을 여지가 없다.
 * 나머지 폴더에서는 두 값이 일치하는 것을 확인했다.
 */
const styleFromImage = (file) => file.match(/^([0-9]+[A-Z]*)_/)?.[1] ?? null;

/**
 * 캐나다구스는 폴더 깊이가 두 가지다.
 *
 *   2단계  Murray Parka/{색상}/                    — 디스크가 하나뿐인 상품
 *   3단계  Langford Parka/{디스크}/{색상}/          — 디스크마다 스타일 코드가 다르다
 *
 * 디스크(로고 배지 마감)는 **색상 속성으로 접는다.** 상품을 셋으로 쪼개면 같은 파카의
 * PDP가 세 개가 되고, 가격도 전부 같다. 코치에서 하드웨어(Brass/Gold)를 색상 라벨에
 * 접어 넣은 것과 같은 처리다.
 *
 * `details.txt`도 상품 레벨과 색상 레벨 양쪽에 있다 — 가까운 쪽을 우선한다.
 */
export async function parseCanadaGoose() {
  const src = join(ROOT, '캐나다구스');
  const out = [];

  for (const genderDir of await dirs(src)) {
    const line = CANADA_GOOSE_LINES[genderDir];
    /*
      모르는 폴더는 **경고하고** 넘어간다. 조용히 continue 하면 새 라인을 통째로 놓친다 —
      실제로 KIDS 두 폴더가 그렇게 몇 번의 임포트를 지나갔다.
    */
    if (!line) {
      parseWarnings.push(`캐나다구스: 최상위 폴더 "${genderDir}" 를 모른다 — 통째로 건너뜀`);
      continue;
    }
    const { gender, sizes } = line;

    for (const folder of await dirs(join(src, genderDir))) {
      const productDir = join(src, genderDir, folder);
      const productDetails = await readText(join(productDir, 'details.txt'));
      const colors = [];
      const styleConflicts = [];

      for (const midName of await dirs(productDir)) {
        const midDir = join(productDir, midName);
        const midDetails = (await readText(join(midDir, 'details.txt'))) ?? productDetails;
        const midFiles = (await readdir(midDir)).filter(isImage);

        // 2단계 — 여기가 색상 폴더다
        if (midFiles.length > 0) {
          colors.push(makeColor(midName, midDir, midFiles, midDetails, styleConflicts));
          continue;
        }

        // 3단계 — 여기는 디스크 폴더이고 그 아래가 색상이다
        const disc = normalizeDisc(midName) ?? midName;
        for (const colorName of await dirs(midDir)) {
          const colorDir = join(midDir, colorName);
          const files = (await readdir(colorDir)).filter(isImage);
          if (files.length === 0) continue;
          const details = (await readText(join(colorDir, 'details.txt'))) ?? midDetails;
          const c = makeColor(colorName, colorDir, files, details, styleConflicts);
          c.disc = disc;
          colors.push(c);
        }
      }

      /*
        디스크는 **두 가지 이상일 때만** 색상명에 붙인다.
        하나뿐인데 붙이면 고를 수 없는 것을 선택지처럼 보이게 한다 —
        Murray·Garson·Crofton은 디스크가 하나라 색상만 남는다.
      */
      const discs = new Set(colors.map((c) => c.disc).filter(Boolean));
      if (discs.size > 1) {
        for (const c of colors) {
          const label = `${c.disc} / ${c.color}`;
          c.key = `${c.disc},${c.color}`;
          c.color = label;
          c.label = label;
        }
      }

      if (colors.length === 0) {
        parseWarnings.push(`캐나다구스 ${genderDir}/${folder}: 이미지가 있는 색상 폴더가 없어 건너뜀`);
        continue;
      }

      const name = stripDisc(folder);
      if (styleConflicts.length > 0) {
        // 고쳐서 쓰지만 원본이 어긋나 있다는 사실은 알린다. details.txt를 손보면 사라진다.
        parseWarnings.push(
          `캐나다구스 ${name}: details.txt의 스타일 코드가 이미지와 달라 ${styleConflicts.length}개 색상에서 ` +
            `이미지를 따랐다 — ${styleConflicts[0]}`,
        );
      }
      const noStyle = colors.filter((c) => !c.styleNo).map((c) => c.label);
      if (noStyle.length > 0) {
        parseWarnings.push(
          `캐나다구스 ${name}: 스타일 코드가 없는 색상 ${noStyle.length}개 (${noStyle[0]}…) — ` +
            '상품코드가 없으면 캐나다 공식몰 재고 조회 대상에서 빠진다',
        );
      }

      out.push({
        brand: 'Canada Goose',
        brandSlug: 'canada-goose',
        name,
        gender,
        category: canadaGooseCategory(name),
        sizes,
        detailsText: productDetails ?? colors[0]?.detailsText ?? null,
        // 원산지는 색상마다 같다 — 상품 레벨로 올린다. 없으면 null이고 CKFTA를 적용하지 않는다.
        originCountry: colors.find((c) => c.originCountry)?.originCountry ?? null,
        colors,
      });
    }
  }
  return out;

  /** `conflicts`는 호출한 상품 루프의 배열이다 — 이 함수는 상품 바깥에 있어 직접 볼 수 없다. */
  function makeColor(folderName, dir, files, details, conflicts) {
    const fixed = fixFolder(folderName);
    const sorted = sortCanadaGoose(files);
    const fromImage = styleFromImage(sorted[0] ?? '');
    const fromDetails = cgStyleOf(details);

    // 두 값이 어긋나면 이미지를 쓰되 어긋났다는 사실은 남긴다 — 원본이 부정확하다는 신호다.
    if (fromImage && fromDetails && fromImage !== fromDetails) {
      conflicts.push(`${fixed}: details=${fromDetails} → 이미지=${fromImage}`);
    }

    return {
      key: fixed,
      color: fixed.replace(/,/g, ' / '),
      label: fixed.replace(/,/g, ' / '),
      material: null,
      priceCad: priceCadOf(details),
      // 이미지 파일명이 정본이다. details.txt는 이미지가 없을 때만 쓴다 (styleFromImage 주석 참고).
      styleNo: fromImage ?? fromDetails,
      originCountry: originOf(details),
      detailsText: details,
      dir,
      images: sorted,
    };
  }
}

export async function parseNewBrands() {
  parseWarnings.length = 0;
  const [coach, polo, lulu, goose] = await Promise.all([
    parseCoach(), parsePolo(), parseLululemon(), parseCanadaGoose(),
  ]);
  return [...coach, ...polo, ...lulu, ...goose];
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
