/**
 * 아크테릭스 원본 이미지를 고화질로 다시 받는다.
 *
 * 문제: `아크테릭스/` 안의 avif 279장 중 255장이 **512×683**이다. 공식몰 목록에서
 * 축소본을 저장한 것이라 카드(900px)로 키우면 뭉개지고 PDP 확대(1.9배)는 더 심하다.
 *
 * 해결: 공식몰 PDP가 쓰는 imgix CDN에서 같은 파일을 원본 크기로 다시 받는다.
 * 파일명이 그대로 CDN 키다 —
 *
 *   로컬  아크테릭스/남성/Beta Jacket Men's/F26-X000010878-Beta-Jacket-Black-Hood.avif
 *   CDN   https://images-dynamic-arcteryx.imgix.net/details/1350x1710/F26-X000010878-Beta-Jacket-Black-Hood.jpg
 *
 * 경로의 `1350x1710`은 자산 폴더 이름이고 실제 마스터는 **1500×2000**이다.
 * 그보다 크게 요청하면 imgix가 업스케일만 하므로 1500에서 멈춘다.
 *
 * 받은 파일은 원본 자리에 avif로 덮어쓴다. 파일명·폴더가 그대로라
 * `parse-arcteryx.mjs`와 `import-catalog.mjs`는 손대지 않아도 된다.
 * 되돌리려면 `git checkout -- 아크테릭스/` 하면 된다 (이 폴더는 git에 있다).
 *
 * 정중하게 (CLAUDE.md §8): 동시 2건, 요청 간 지연, 429·5xx에 지수 백오프.
 * 로그인·결제 영역은 건드리지 않는다 — 이미지 CDN만 쓴다.
 *
 * 사용:
 *   node scripts/refetch-arcteryx-images.mjs           # 드라이런 (기본)
 *   node scripts/refetch-arcteryx-images.mjs --write   # 실제로 덮어쓰기
 *   node scripts/refetch-arcteryx-images.mjs --write --force   # 이미 고화질인 것도 다시
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, '아크테릭스');

const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');

/** 마스터 크기. 이보다 크게 요청하면 imgix가 없는 화소를 만들어낸다. */
const TARGET_W = 1500;
/** 이미 이 폭 이상이면 건너뛴다 */
const GOOD_ENOUGH_W = 1400;

const CDN = 'https://images-dynamic-arcteryx.imgix.net/details/1350x1710';
const PARAMS = `fm=avif&w=${TARGET_W}&q=88`;

const CONCURRENCY = 2;
const DELAY_MS = 600;
const MAX_RETRY = 4;

/** 상품 이미지 파일명 규칙. 시즌-SKU로 시작하지 않으면 CDN 키가 아니다. */
const PRODUCT_FILE = /^[FS]\d{2}-X\d+-.+\.avif$/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 브라우저가 아닌 클라이언트를 막는 CDN이 있어 일반적인 UA를 밝힌다. */
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
};

/** 폴더를 재귀로 훑어 상품 이미지 경로를 모은다. */
async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.includes(':')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, out);
    else if (PRODUCT_FILE.test(entry.name)) out.push(full);
  }
  return out;
}

/** `... (1).avif` 같은 중복 저장 접미사를 떼야 CDN 키가 된다. */
function cdnKey(fileName) {
  return fileName.replace(/\.avif$/i, '').replace(/\s*\(\d+\)$/, '');
}

async function fetchImage(url) {
  for (let attempt = 0; attempt <= MAX_RETRY; attempt += 1) {
    let res;
    try {
      res = await fetch(url, { headers: HEADERS });
    } catch (err) {
      if (attempt === MAX_RETRY) throw err;
      await sleep(DELAY_MS * 2 ** attempt);
      continue;
    }
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // 404는 재시도해도 같다. 429·5xx만 물러섰다가 다시 시도한다.
    if (res.status === 404) return null;
    if (attempt === MAX_RETRY) throw new Error(`HTTP ${res.status}`);
    await sleep(DELAY_MS * 2 ** attempt);
  }
  return null;
}

const files = (await collect(SRC)).sort();
console.log(`상품 이미지 ${files.length}장`);

const stats = { skipped: 0, upgraded: 0, notFound: [], failed: [], smaller: [] };
let cursor = 0;

async function worker(id) {
  while (cursor < files.length) {
    const path = files[cursor];
    cursor += 1;
    const index = cursor;
    const name = path.slice(SRC.length + 1);

    let before;
    try {
      before = await sharp(await readFile(path)).metadata();
    } catch {
      stats.failed.push(`${name} — 기존 파일을 읽지 못함`);
      continue;
    }

    if (!FORCE && before.width >= GOOD_ENOUGH_W) {
      stats.skipped += 1;
      continue;
    }

    const url = `${CDN}/${encodeURIComponent(cdnKey(path.split('/').pop()))}.jpg?${PARAMS}`;

    let buf;
    try {
      buf = await fetchImage(url);
    } catch (err) {
      stats.failed.push(`${name} — ${err.message}`);
      await sleep(DELAY_MS);
      continue;
    }

    if (!buf) {
      stats.notFound.push(name);
      await sleep(DELAY_MS);
      continue;
    }

    const after = await sharp(buf).metadata();

    // 더 작은 것을 받아 덮어쓰면 손해다. 실제로 커졌을 때만 바꾼다.
    if (after.width <= before.width) {
      stats.smaller.push(`${name} — ${before.width} → ${after.width}`);
      await sleep(DELAY_MS);
      continue;
    }

    if (WRITE) await writeFile(path, buf);
    stats.upgraded += 1;
    console.log(
      `[${String(index).padStart(3)}/${files.length}] w${id} ${before.width}×${before.height} → ${after.width}×${after.height}  ${name}`,
    );

    await sleep(DELAY_MS);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));

console.log('');
console.log(`올림   ${stats.upgraded}장${WRITE ? '' : ' (드라이런 — 저장하지 않음)'}`);
console.log(`건너뜀 ${stats.skipped}장 (이미 ${GOOD_ENOUGH_W}px 이상)`);
if (stats.smaller.length) {
  console.log(`\nCDN이 더 작음 ${stats.smaller.length}장 — 원본 유지`);
  stats.smaller.forEach((s) => console.log('  ' + s));
}
if (stats.notFound.length) {
  console.log(`\nCDN에 없음 ${stats.notFound.length}장 — 직접 받아야 해요`);
  stats.notFound.forEach((s) => console.log('  ' + s));
}
if (stats.failed.length) {
  console.log(`\n실패 ${stats.failed.length}장`);
  stats.failed.forEach((s) => console.log('  ' + s));
}
if (!WRITE) console.log('\n실제로 바꾸려면 --write 를 주세요.');
