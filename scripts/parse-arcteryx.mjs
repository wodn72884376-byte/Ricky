/**
 * 아크테릭스 상품 폴더 + 가격표를 읽어 카탈로그 구조로 파싱한다.
 * 기본은 드라이런 — `--write`를 줘야 파일을 만든다.
 *
 * 폴더 구조:  아크테릭스/{남성|여성}/{상품명}/  또는  아크테릭스/ACC_{상품명}/
 * 파일명:     F26-{SKU}-{상품명 슬러그}-{색상}[-Women-s]-{뷰}.{avif|jpg|png|webp}
 * 가격:       「가격표 비교.xlsx」가 1순위. 행이 없으면 폴더의 `가격.txt`
 *             (`770CAD` 또는 `색상: 588CAD`) — 아울렛처럼 엑셀에 없는 상품용이다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, '아크테릭스');

/** 상품 이미지로 인정하는 확장자. 손으로 받은 avif 와 `npm run intake` 가 받은 jpg 가 섞인다. */
const IMAGE_RE = /\.(avif|jpe?g|png|webp)$/i;

/** 색상 표기 차이(공백·슬래시·대소문자)만 걷어낸 대조 키. */
export const colourKey = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** 파일명 끝에 붙는 뷰 종류. 긴 것부터 매칭해야 `Front-View`가 `View`로 잘리지 않는다. */
const VIEWS = [
  'Fabric-Detail', 'Full-Body', 'Front-View', 'Back-View', 'Side-View',
  'Detail-1', 'Detail-2', 'Detail-3', 'Body-1', 'Body-2',
  'Front', 'Back', 'Hover', 'Hood', 'Detail', 'Body',
];

/** 대표 이미지 우선순위. 카드에는 Front-View를 쓴다. */
const HERO_ORDER = ['Front-View', 'Front', 'Hover', 'Side-View', 'Back-View'];

function slugifyName(name) {
  return name.replace(/'/g, '').replace(/\s+/g, '-');
}

function parseFile(fileName, productName) {
  const base = fileName.replace(IMAGE_RE, '').replace(/\s*\(\d+\)$/, '');
  // 시즌 접두사는 F26·S26·F25처럼 F/S 둘 다 온다
  const m = base.match(/^[FS]\d{2}-(X\d+)-(.+)$/);
  if (!m) return null;
  const [, sku, rest0] = m;

  /*
   * 상품명 슬러그를 앞에서 떼어낸다 (폴더명이 정답을 준다).
   *
   * `(Outlet)` 은 우리가 붙인 구분표지지 브랜드 상품명이 아니다 — 같은 이름의 상품이
   * 정가·아울렛으로 따로 팔릴 때 슬러그를 가르려고 폴더명에만 넣는다. 파일명에는
   * 없으므로 여기서 떼지 않으면 상품명이 안 맞아 색상 자리에 상품명이 통째로 들어간다.
   */
  const nameSlug = slugifyName(
    productName.replace(/\s*\(Outlet\)/i, '').replace(/\s+(Men|Women)'s$/i, ''),
  );
  let rest = rest0.startsWith(nameSlug + '-') ? rest0.slice(nameSlug.length + 1) : rest0;

  // 성별 표기 제거
  rest = rest.replace(/-?Women-s-?/i, '-').replace(/-?Men-s-?/i, '-').replace(/^-|-$/g, '');

  // 끝의 뷰 종류를 떼면 남는 것이 색상
  let view = null;
  for (const v of VIEWS) {
    if (rest.endsWith('-' + v) || rest === v) {
      view = v;
      rest = rest.slice(0, rest.length - v.length).replace(/-$/, '');
      break;
    }
  }
  const color = rest.replace(/-/g, ' ').trim();
  return { sku, color: color || null, view, file: fileName };
}

async function readPriceSheet() {
  const buf = await readFile(join(SRC, '가격표 비교.xlsx'));
  // xlsx는 zip이다. 의존성 없이 중앙 디렉터리를 훑어 필요한 두 엔트리만 꺼낸다.
  const entries = {};
  for (let i = 0; i < buf.length - 4; i++) {
    if (buf.readUInt32LE(i) !== 0x04034b50) continue;
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString('utf8');
    const dataStart = i + 30 + nameLen + extraLen;
    if (!/sharedStrings\.xml$|worksheets\/sheet1\.xml$/.test(name)) continue;
    if (compSize === 0) continue;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    // zip 엔트리는 raw deflate다(zlib 헤더 없음). unzipSync가 아니라 inflateRawSync를 쓴다.
    entries[name] = method === 8 ? inflateRawSync(raw) : raw;
  }

  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const shared = [];
  const ss = entries['xl/sharedStrings.xml']?.toString('utf8') ?? '';
  for (const si of ss.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    shared.push(decode([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')));
  }

  const sheet = entries['xl/worksheets/sheet1.xml']?.toString('utf8') ?? '';
  const rows = [];
  for (const rm of sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cm of rm[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const [, col, attrs, body] = cm;
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (v === undefined) continue;
      cells[col] = /t="s"/.test(attrs) ? shared[Number(v)] : Number(v);
    }
    rows.push({ r: Number(rm[1]), cells });
  }
  return rows;
}

/**
 * 폴더의 `가격.txt` 를 읽는다. 「가격표 비교.xlsx」에 행이 없는 상품(아울렛)용이다.
 *
 *   770CAD                      상품 전체
 *   Stone Red / Dk Stone: 588CAD  색상 하나 — 아울렛은 같은 상품에서도 색마다 값이 갈린다
 *
 * 파일이 없으면 null 이고 그건 오류가 아니다. 엑셀에 행이 있는 상품이 대부분이다.
 */
async function readPriceFile(dir) {
  let text;
  try {
    text = await readFile(join(dir, '가격.txt'), 'utf8');
  } catch {
    return null;
  }

  let cad = null;
  const byColour = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const withColour = line.match(/^(.+?)\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*CAD$/i);
    if (withColour) {
      byColour[colourKey(withColour[1])] = Number(withColour[2]);
      continue;
    }
    const bare = line.match(/^([0-9]+(?:\.[0-9]+)?)\s*CAD$/i);
    if (bare) cad = Number(bare[1]);
  }

  return cad === null && Object.keys(byColour).length === 0 ? null : { cad, byColour };
}

export async function parseAll() {
  const priceRows = await readPriceSheet();
  const prices = new Map();
  for (const { cells } of priceRows) {
    const name = cells.B;
    if (typeof name !== 'string' || typeof cells.C !== 'number') continue;
    prices.set(name.trim(), {
      gender: cells.A === '여성' ? 'women' : 'men',
      cad: cells.C,
      costKrw: cells.D ?? null,
      krRetailKrw: cells.E ?? null,
      shippingKrw: cells.G ?? null,
      priceKrw: cells.I || null,
      marginKrw: cells.J ?? null,
    });
  }

  const groups = [];
  for (const top of await readdir(SRC, { withFileTypes: true })) {
    if (!top.isDirectory()) continue;
    if (top.name === '남성' || top.name === '여성') {
      const gender = top.name === '남성' ? 'men' : 'women';
      for (const d of await readdir(join(SRC, top.name), { withFileTypes: true })) {
        if (d.isDirectory()) groups.push({ dir: join(SRC, top.name, d.name), name: d.name, gender });
      }
    } else if (top.name.startsWith('ACC_')) {
      groups.push({ dir: join(SRC, top.name), name: top.name.slice(4), gender: 'unisex' });
    }
  }

  const products = [];
  for (const g of groups) {
    const files = (await readdir(g.dir)).filter((f) => IMAGE_RE.test(f));
    const parsed = files.map((f) => parseFile(f, g.name)).filter(Boolean);
    const colors = new Map();
    for (const p of parsed) {
      const key = p.color ?? '기본';
      if (!colors.has(key)) colors.set(key, []);
      colors.get(key).push(p);
    }
    const price = prices.get(g.name) ?? null;
    products.push({
      name: g.name,
      gender: g.gender,
      dir: g.dir,
      sku: parsed[0]?.sku ?? null,
      colors: [...colors.entries()].map(([color, imgs]) => ({
        color,
        images: imgs,
        /*
         * **색상마다 상품코드가 다를 수 있다.** 같은 이름의 상품이 세대별로 따로 팔리면
         * (아울렛) 한 폴더에 두 코드가 섞인다. 상품 단위 `sku`(첫 파일 값)를 모든 색상에
         * 쓰면 절반은 없는 코드가 되어 재고가 조용히 안 붙는다.
         */
        sku: imgs[0]?.sku ?? parsed[0]?.sku ?? null,
        hero: HERO_ORDER.map((v) => imgs.find((i) => i.view === v)).find(Boolean) ?? imgs[0],
      })),
      price,
      /** 엑셀에 행이 없을 때 쓰는 폴더 가격. 있으면 엑셀이 이긴다. */
      priceFile: await readPriceFile(g.dir),
    });
  }
  return products;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const products = await parseAll();
  let missing = 0, noHero = 0;
  console.log(`상품 ${products.length}개\n`);
  for (const p of products) {
    const cols = p.colors.map((c) => `${c.color}(${c.images.length})`).join(', ');
    const fallback = p.priceFile ? `CAD ${p.priceFile.cad ?? '색상별'} (가격.txt)` : null;
    const price = p.price
      ? `CAD ${p.price.cad} → ${p.price.priceKrw?.toLocaleString() ?? '?'}원`
      : (fallback ?? '⚠ 가격 없음');
    if (!p.price && !p.priceFile) missing++;
    if (p.colors.some((c) => !c.hero)) noHero++;
    console.log(`${p.gender.padEnd(7)} ${p.name}`);
    console.log(`  ${p.sku} · ${price}`);
    console.log(`  색상: ${cols}`);
  }
  console.log(`\n가격 없음 ${missing}개 · 대표이미지 없음 ${noHero}개`);
}
