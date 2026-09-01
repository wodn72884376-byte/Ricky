/**
 * 수집 결과를 Supabase에 적재한다.
 *
 *   스크래핑/data/연동-*.json  →  supplier_listings (현재 상태)  +  stock_checks (관측 로그)
 *
 * 사용:
 *   npm run db:stock-load            무엇이 바뀌는지만 보여준다 (기본)
 *   npm run db:stock-load -- --commit  실제로 쓴다
 *
 * **기본이 미리보기다.** 운영 DB에 쓰는 건 되돌리기 어렵다.
 *
 * ## 이번 회차에 안 담긴 variant는 건드리지 않는다
 * 수집이 실패했거나(차단·마크업 변경) 이번 조회 대상이 아니었을 뿐인데 품절로 적으면
 * 멀쩡한 상품이 판매 중지된다 (PROJECT.md §6.3 5번). 아무것도 안 하면 그 행의
 * `last_success_at`이 저절로 낡아 신선도 게이트가 닫는다 —
 * 판매를 막는 쪽으로 저절로 기우는 것이 옳은 방향이다.
 *
 * ## service_role을 쓴다
 * RLS를 우회한다. CLAUDE.md에서 허용한 "크롤러 워커" 경로다.
 * 이 스크립트는 서버에서만 돌리고, 키를 로그에 남기지 않는다.
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mergePayloads, toLoadInput } from '../src/lib/db/stock-load.ts';
import { canonicalSize, listingRows } from '../src/lib/db/seed-rows.ts';

// 프로젝트 경로에 한글이 포함되므로 URL.pathname 대신 fileURLToPath를 쓴다
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = join(ROOT, '스크래핑/data');

const COMMIT = process.argv.includes('--commit');

/*
 * .env 를 직접 읽는다. Next.js 는 알아서 읽어 주지만 스크립트는 아니고,
 * 이것 하나 때문에 dotenv 를 의존성에 넣을 이유는 없다.
 * 이미 들어 있는 환경변수를 덮지 않는다 — CI 나 셸에서 준 값이 우선이다.
 */
async function loadEnv() {
  for (const name of ['.env', '.env.local']) {
    let text;
    try {
      text = await readFile(join(ROOT, name), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m) continue;
      const key = m[1];
      if (process.env[key] !== undefined) continue;
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
await loadEnv();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`환경변수 ${name} 이 없다. .env 에 넣어라.`);
    process.exit(1);
  }
  return v;
}

// ── 수집 파일 읽기 ───────────────────────────────────────────────
const files = (await readdir(DATA)).filter((f) => f.startsWith('연동-') && f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error(`${DATA} 에 연동-*.json 이 없다. 먼저 스크래핑에서 npm run stock:all 을 돌려라.`);
  process.exit(1);
}

/*
 * 낡은 회차는 읽지 않는다.
 *
 * mergePayloads 는 같은 키의 최신 값을 남기지만, **옛 파일에만 있는 키는 영원히
 * 남는다** — 색상 표기를 고치거나 상품이 단종되면 그 죽은 행이 계속 따라온다
 * (실측: 파일 19개에서 342행이 그랬다). 어차피 신선도 게이트(기본 6h)를 넘긴
 * 관측은 판매 근거가 되지 못하므로, 그보다 넉넉한 창만 본다.
 */
const MAX_AGE_H = Number(process.env.STOCK_LOAD_MAX_AGE_HOURS ?? 24);
const cutoff = Date.now() - MAX_AGE_H * 3600_000;

const payloads = [];
let skipped = 0;
for (const f of files) {
  const payload = JSON.parse(await readFile(join(DATA, f), 'utf8'));
  const at = Date.parse(payload?.meta?.generatedAt ?? '');
  if (Number.isFinite(at) && at < cutoff) { skipped += 1; continue; }
  payloads.push(payload);
}
if (skipped > 0) console.log(`${MAX_AGE_H}시간이 지난 회차 ${skipped}개는 건너뛴다`);
if (payloads.length === 0) {
  console.error(`최근 ${MAX_AGE_H}시간 안에 수집한 회차가 없다. 먼저 npm run stock:all 을 돌려라.`);
  process.exit(1);
}

const variants = mergePayloads(payloads);
const { linked } = toLoadInput(variants);
const rows = listingRows(linked);

console.log(`수집 파일 ${files.length}개 → variant ${variants.length}건 → 적재 후보 ${rows.length}행`);

/*
 * DB 없이도 알 수 있는 건 먼저 보여준다.
 * Supabase 를 아직 안 만들었어도 "무엇이 올라갈지"는 확인할 수 있어야 한다.
 */
const byAvail = {};
const byBrand = {};
for (const r of rows) {
  byAvail[r.availability] = (byAvail[r.availability] ?? 0) + 1;
  byBrand[r.brand_slug] = (byBrand[r.brand_slug] ?? 0) + 1;
}
console.log('  재고 상태:', byAvail);
console.log('  브랜드   :', byBrand);
console.log();

// ── DB ───────────────────────────────────────────────────────────
const db = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } },
);

/**
 * DB 에 닿지 못한 이유를 분명히 말한다.
 * "fetch failed" 만 던지면 키가 틀린 건지 프로젝트가 없는 건지 알 수 없다.
 */
function dbUnreachable(what, err) {
  console.error(`${what}: ${err.message}`);
  console.error(`  URL ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.error('  Supabase 프로젝트를 만들고 .env 에 실제 키를 넣어야 한다.');
  console.error('  마이그레이션 검증만 하려면 npm run db:stock-check (PGlite, 프로젝트 불필요)');
  // 미리보기 단계에서는 여기까지가 정상 종료다 — 위에서 이미 쓸 내용을 보여줬다.
  process.exit(COMMIT ? 1 : 0);
}

const { data: brands, error: brandErr } = await db.from('brands').select('id, slug');
if (brandErr) dbUnreachable('브랜드를 읽지 못했다', brandErr);
const brandId = new Map(brands.map((b) => [b.slug, b.id]));

/*
 * PostgREST 는 한 응답을 1000행에서 자른다 — 조용히. variant 가 1058개가 되자
 * 58개가 목록에 없어 그 재고가 "DB 에 없는 옵션"으로 버려졌다(실측).
 * 끝까지 읽는다.
 */
const dbVariants = [];
let varErr = null;
for (let from = 0; ; from += 1000) {
  const { data, error } = await db
    .from('product_variants')
    .select('id, sku, size, color, products!inner(slug)')
    .range(from, from + 999);
  if (error) { varErr = error; break; }
  dbVariants.push(...data);
  if (data.length < 1000) break;
}
if (varErr) dbUnreachable('variant 를 읽지 못했다', varErr);
console.log(`DB variant ${dbVariants.length}개 읽음`);
const variantId = new Map(
  dbVariants.map((v) => [`${v.products.slug}|${v.color}|${canonicalSize(v.size)}`, v.id]),
);

// ── 적재 ─────────────────────────────────────────────────────────
const listings = [];
const missing = [];

for (const r of rows) {
  // listingRows 가 이미 canonicalSize 를 태웠다. 여기서 또 하지 않는다.
  const id = variantId.get(`${r.product_slug}|${r.color}|${r.size}`);
  if (!id) {
    missing.push(`${r.product_slug} | ${r.color} | ${r.size}`);
    continue;
  }
  const bid = brandId.get(r.brand_slug);
  if (!bid) {
    missing.push(`${r.product_slug} | 브랜드 ${r.brand_slug} 없음`);
    continue;
  }
  listings.push({
    variant_id: id,
    brand_id: bid,
    product_url: r.product_url,
    availability: r.availability,
    current_price_cad_cents: r.current_price_cad_cents,
    on_sale: r.on_sale,
    last_checked_at: r.last_checked_at,
    last_success_at: r.last_success_at,
    active: true,
  });
}

console.log(`variant 대조: 붙음 ${listings.length}행 · 못 붙음 ${missing.length}행`);
for (const m of missing.slice(0, 8)) console.log(`    못 붙음: ${m}`);
if (missing.length > 8) console.log(`    … 외 ${missing.length - 8}행`);

if (!COMMIT) {
  console.log('\n미리보기다. 실제로 쓰려면 --commit 을 붙여라.');
  process.exit(0);
}

/*
 * 같은 (variant, 주소) 가 한 배치에 두 번 들어가면 Postgres 가 거부한다 —
 * `ON CONFLICT DO UPDATE command cannot affect row a second time`.
 * 회차를 여러 개 읽으면 실제로 그렇게 된다(실측: 파일 19개). 최근 관측만 남긴다.
 */
const byKey = new Map();
for (const l of listings) {
  const k = `${l.variant_id}|${l.product_url}`;
  const prev = byKey.get(k);
  if (!prev || (l.last_checked_at ?? '') > (prev.last_checked_at ?? '')) byKey.set(k, l);
}
const deduped = [...byKey.values()];
if (deduped.length < listings.length) {
  console.log(`  같은 (variant, 주소) 중복 ${listings.length - deduped.length}행 → 최근 것만 남김`);
}

const { data: written, error: upsertErr } = await db
  .from('supplier_listings')
  .upsert(deduped, { onConflict: 'variant_id,product_url' })
  .select('id, variant_id, product_url, availability, current_price_cad_cents, on_sale, last_checked_at');
if (upsertErr) {
  console.error('supplier_listings 적재 실패:', upsertErr.message);
  process.exit(1);
}
console.log(`supplier_listings ${written.length}행 적재`);

/*
 * 관측 로그를 남긴다. supplier_listings 는 현재 상태만 들고 있어서,
 * "언제부터 품절이었나" 같은 건 여기서만 답할 수 있다.
 * 같은 회차를 두 번 돌려도 로그가 겹치지 않게 (listing_id, checked_at) 로 거른다.
 */
/*
 * id 를 한 번에 다 넣으면 요청 URL 이 너무 길어져 `fetch failed` 로 죽는다
 * (실측: 445개에서 그랬다). PostgREST 는 `in` 을 쿼리스트링으로 만든다.
 */
const seen = [];
let seenErr = null;
for (let i = 0; i < written.length; i += 100) {
  const ids = written.slice(i, i + 100).map((w) => w.id);
  const { data, error } = await db.from('stock_checks').select('listing_id, checked_at').in('listing_id', ids);
  if (error) { seenErr = error; break; }
  seen.push(...data);
}
if (seenErr) {
  console.error('기존 관측 로그를 읽지 못했다:', seenErr.message);
  process.exit(1);
}
const already = new Set(seen.map((s) => `${s.listing_id}|${new Date(s.checked_at).toISOString()}`));

const checks = written
  .filter((w) => !already.has(`${w.id}|${new Date(w.last_checked_at).toISOString()}`))
  .map((w) => ({
    listing_id: w.id,
    checked_at: w.last_checked_at,
    status: 'ok',
    availability: w.availability,
    price_cad_cents: w.current_price_cad_cents,
    on_sale: w.on_sale,
  }));

if (checks.length > 0) {
  const { error: checkErr } = await db.from('stock_checks').insert(checks);
  if (checkErr) {
    console.error('stock_checks 적재 실패:', checkErr.message);
    process.exit(1);
  }
}
console.log(`stock_checks ${checks.length}행 기록 (중복 ${written.length - checks.length}행 건너뜀)`);
console.log('\n완료. 스토어 노출 여부는 store_variants 뷰가 요청 시점에 판정한다.');
