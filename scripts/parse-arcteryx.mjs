/**
 * 아크테릭스 상품 폴더 + 가격표를 읽어 카탈로그 구조로 파싱한다.
 * 기본은 드라이런 — `--write`를 줘야 파일을 만든다.
 *
 * 폴더 구조:  아크테릭스/{남성|여성}/{상품명}/  또는  아크테릭스/ACC_{상품명}/
 * 파일명:     F26-{SKU}-{상품명 슬러그}-{색상}[-Women-s]-{뷰}.avif
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, '아크테릭스');

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
  const base = fileName.replace(/\.avif$/i, '').replace(/\s*\(\d+\)$/, '');
  // 시즌 접두사는 F26·S26·F25처럼 F/S 둘 다 온다
  const m = base.match(/^[FS]\d{2}-(X\d+)-(.+)$/);
  if (!m) return null;
  const [, sku, rest0] = m;

  // 상품명 슬러그를 앞에서 떼어낸다 (폴더명이 정답을 준다)
  const nameSlug = slugifyName(productName.replace(/\s+(Men|Women)'s$/i, ''));
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
    const files = (await readdir(g.dir)).filter((f) => /\.avif$/i.test(f));
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
        hero: HERO_ORDER.map((v) => imgs.find((i) => i.view === v)).find(Boolean) ?? imgs[0],
      })),
      price,
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
    const price = p.price ? `CAD ${p.price.cad} → ${p.price.priceKrw?.toLocaleString() ?? '?'}원` : '⚠ 가격 없음';
    if (!p.price) missing++;
    if (p.colors.some((c) => !c.hero)) noHero++;
    console.log(`${p.gender.padEnd(7)} ${p.name}`);
    console.log(`  ${p.sku} · ${price}`);
    console.log(`  색상: ${cols}`);
  }
  console.log(`\n가격 없음 ${missing}개 · 대표이미지 없음 ${noHero}개`);
}
