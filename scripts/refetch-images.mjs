/**
 * 브랜드 원본 이미지를 공식몰 CDN에서 고화질로 다시 받는다.
 *
 * 문제: 공식몰 **목록**에서 저장한 축소본이 원본 폴더에 들어와 있었다.
 * 카드(900px)·상세(1600px)로 키우면 없는 화소를 만들어내므로 뭉개진다.
 *
 * 해결: 파일명이 곧 CDN 키다. 브랜드별 어댑터로 주소만 만들어 다시 받는다.
 * 파일명·폴더가 그대로라 `parse-*.mjs`와 `import-catalog.mjs`는 손대지 않는다.
 *
 * 되돌리려면 `git checkout -- 아크테릭스/ 코치/` — 원본 폴더는 git에 있다.
 *
 * 정중하게 (CLAUDE.md §8): 동시 2건, 요청 간 지연, 429·5xx에 지수 백오프.
 * 이미지 CDN만 쓴다 — 로그인·결제 영역은 건드리지 않는다.
 *
 * 사용:
 *   node scripts/refetch-images.mjs arcteryx           # 드라이런 (기본)
 *   node scripts/refetch-images.mjs coach --write
 *   node scripts/refetch-images.mjs all --write
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * 브랜드별 어댑터. 셀렉터·엔드포인트를 여기 한 곳에 모은다 (CLAUDE.md §8).
 *
 *   dir         원본 폴더
 *   match       상품 이미지 파일명 규칙. 맞지 않으면 CDN 키가 아니다
 *   masterW     공식몰이 가진 마스터 폭. 이보다 크게 요청하면 CDN이 업스케일만 한다
 *   url         파일명(확장자 제외) → 내려받을 주소
 */
const ADAPTERS = {
  arcteryx: {
    dir: '아크테릭스',
    // F26-X000010878-Beta-Jacket-Black-Hood.avif
    match: /^[FS]\d{2}-X\d+-.+\.avif$/i,
    masterW: 1500,
    // 경로의 `1350x1710`은 자산 폴더 이름이고 실제 마스터는 1500×2000이다.
    url: (base) =>
      `https://images-dynamic-arcteryx.imgix.net/details/1350x1710/${encodeURIComponent(base)}.jpg` +
      `?fm=avif&w=1500&q=88`,
  },
  coach: {
    dir: '코치',
    // cw637_b4z5d_a3.webp — {스타일}_{색상코드}_a{뷰}
    match: /^[a-z0-9]+_[a-z0-9]+_a\d+\.webp$/i,
    // Scene7 `?req=props`가 알려주는 마스터는 1000×1000이다.
    // 더 크게 요청하면 2400까지 늘려 주지만 전부 업스케일이라 받을 이유가 없다.
    masterW: 1000,
    url: (base) =>
      `https://coach.scene7.com/is/image/Coach/${encodeURIComponent(base)}` +
      `?wid=1000&hei=1000&fit=constrain&fmt=webp&qlt=92`,
  },
};

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const FORCE = args.includes('--force');
const target = args.find((a) => !a.startsWith('--')) ?? 'all';

const names = target === 'all' ? Object.keys(ADAPTERS) : [target];
for (const n of names) {
  if (!ADAPTERS[n]) {
    console.error(`모르는 브랜드예요: ${n}. 쓸 수 있는 값: ${Object.keys(ADAPTERS).join(', ')}, all`);
    process.exit(1);
  }
}

const CONCURRENCY = 2;
const DELAY_MS = 600;
const MAX_RETRY = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 브라우저가 아닌 클라이언트를 막는 CDN이 있어 일반적인 UA를 밝힌다. */
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
};

async function collect(dir, match, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.includes(':')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, match, out);
    else if (match.test(entry.name)) out.push(full);
  }
  return out;
}

/** `... (1).webp` 같은 중복 저장 접미사를 떼야 CDN 키가 된다. */
function cdnKey(fileName) {
  return fileName.replace(/\.[a-z0-9]+$/i, '').replace(/\s*\(\d+\)$/, '');
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

async function runBrand(name) {
  const brand = ADAPTERS[name];
  const src = join(ROOT, brand.dir);
  const files = (await collect(src, brand.match)).sort();

  console.log(`\n── ${name} · ${brand.dir} · 상품 이미지 ${files.length}장`);

  const stats = { skipped: 0, upgraded: 0, notFound: [], failed: [], smaller: [] };
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const path = files[cursor];
      cursor += 1;
      const index = cursor;
      const label = path.slice(src.length + 1);

      let before;
      try {
        before = await sharp(await readFile(path)).metadata();
      } catch {
        stats.failed.push(`${label} — 기존 파일을 읽지 못함`);
        continue;
      }

      // 이미 마스터만 한 것은 다시 받아도 얻을 게 없다.
      if (!FORCE && before.width >= brand.masterW) {
        stats.skipped += 1;
        continue;
      }

      let buf;
      try {
        buf = await fetchImage(brand.url(cdnKey(path.split('/').pop())));
      } catch (err) {
        stats.failed.push(`${label} — ${err.message}`);
        await sleep(DELAY_MS);
        continue;
      }

      if (!buf) {
        stats.notFound.push(label);
        await sleep(DELAY_MS);
        continue;
      }

      const after = await sharp(buf).metadata();

      // 더 작은 것을 받아 덮어쓰면 손해다. 실제로 커졌을 때만 바꾼다.
      if (after.width <= before.width) {
        stats.smaller.push(`${label} — ${before.width} → ${after.width}`);
        await sleep(DELAY_MS);
        continue;
      }

      if (WRITE) await writeFile(path, buf);
      stats.upgraded += 1;
      console.log(
        `[${String(index).padStart(3)}/${files.length}] ${before.width}×${before.height} → ${after.width}×${after.height}  ${label}`,
      );

      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n${name}: 올림 ${stats.upgraded}장 · 건너뜀 ${stats.skipped}장 (이미 ${brand.masterW}px 이상)`);
  for (const [title, list] of [
    ['CDN이 더 작음 — 원본 유지', stats.smaller],
    ['CDN에 없음 — 직접 받아야 해요', stats.notFound],
    ['실패', stats.failed],
  ]) {
    if (!list.length) continue;
    console.log(`  ${title} (${list.length})`);
    list.forEach((s) => console.log('    ' + s));
  }
}

for (const name of names) await runBrand(name);

if (!WRITE) console.log('\n드라이런이에요. 실제로 바꾸려면 --write 를 주세요.');
