/**
 * 재고 연동 전 과정을 PGlite(WASM Postgres)에서 실제로 돌려 본다.
 *
 *   마이그레이션 → 카탈로그 적재 → 재고 적재 → store_variants 뷰 판정
 *
 * Supabase 프로젝트 없이 검증할 수 있는 유일한 방법이다. 실제 DDL·제약·뷰를
 * 그대로 쓰므로, 여기서 통과하면 Supabase에서도 같은 결과가 나온다.
 *
 * **이 스크립트가 답해야 하는 질문은 하나다** — 신선도 게이트가 정말로 작동하는가.
 * 오래된 재고로 결제를 여는 것이 이 시스템에서 가장 비싼 버그다 (PROJECT.md §6.5).
 *
 * 사용: npm run db:stock-check
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 프로젝트 경로에 한글이 포함되므로 URL.pathname 대신 fileURLToPath를 쓴다
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MIGRATIONS = join(ROOT, 'supabase/migrations');

const SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
  end $$;
`;

const db = new PGlite({ extensions: { pgcrypto } });
await db.exec('create extension if not exists "pgcrypto";');
await db.exec(SHIM);

for (const f of (await readdir(MIGRATIONS)).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(await readFile(join(MIGRATIONS, f), 'utf8'));
}
console.log('마이그레이션 적용 완료');

// RLS를 우회한다 — 이 스크립트는 service_role 경로를 흉내 낸다.
await db.exec('set session role none;');

const q = (sql, params) => db.query(sql, params);
const one = async (sql, params) => (await q(sql, params)).rows[0];

// ── 카탈로그 적재 ────────────────────────────────────────────────
const { CATALOG } = await import('../src/lib/catalog.generated.ts').catch(async () => {
  // .ts를 직접 import할 수 없는 런타임이면 tsx로 돌려야 한다.
  throw new Error('이 스크립트는 tsx로 실행해야 해요: npx tsx scripts/check-stock-pipeline.mjs');
});
const { productRow, variantRows, listingRows, canonicalSize } = await import('../src/lib/db/seed-rows.ts');

const brandIds = new Map();
for (const slug of new Set(CATALOG.map((p) => p.brandSlug))) {
  const existing = await one('select id from brands where slug = $1', [slug]);
  if (existing) { brandIds.set(slug, existing.id); continue; }
  const row = await one('insert into brands (name, slug) values ($1, $1) returning id', [slug]);
  brandIds.set(slug, row.id);
}

const productIds = new Map();
let variantCount = 0;
for (const p of CATALOG) {
  const r = productRow(p);
  const inserted = await one(
    `insert into products (brand_id, name, slug, category, gender, origin_country, material, care,
       manufacturer, kr_retail_krw, shipping_krw, smartstore_url, status)
     values ($1,$2,$3,$4,$5::product_gender,$6,$7,$8,$9,$10,$11,$12,$13::product_status)
     returning id`,
    [brandIds.get(r.brand_slug), r.name, r.slug, r.category, r.gender, r.origin_country,
     r.material, r.care, r.manufacturer, r.kr_retail_krw, r.shipping_krw, r.smartstore_url, r.status],
  );
  productIds.set(p.slug, inserted.id);

  for (const v of variantRows(p)) {
    await q(
      `insert into product_variants (product_id, sku, size, color, cost_cad_cents, price_krw, stock_type)
       values ($1,$2,$3,$4,$5,$6,'on_demand')`,
      [inserted.id, v.sku, v.size, v.color, v.cost_cad_cents, v.price_krw],
    );
    variantCount += 1;
  }
}
console.log(`카탈로그 적재: 상품 ${CATALOG.length}개 · variant ${variantCount}개`);

// ── 재고 적재 ────────────────────────────────────────────────────
/*
 * 적재 경로는 **실제 로더(scripts/load-stock.mjs)와 같은 함수**를 쓴다.
 * 하네스가 자기만의 변환을 들고 있으면 여기서 통과해도 운영에서 깨진다.
 * 실제로 그랬다 — 예전엔 상품 URL을 브랜드 첫 행에서 가져와 그 브랜드 전체에 붙였다.
 * `supplier_listings`의 유니크 키가 `(variant_id, product_url)`이라 행이 뭉개진다.
 *
 * 수집 파일은 전부 합친다 — 회차마다 담긴 브랜드가 다르므로 최신 파일 하나만 보면
 * 나머지 브랜드가 통째로 빠진다. 오래된 관측이 섞여도 각 행이 자기 checkedAt을 들고
 * 있어 신선도 게이트가 요청 시점에 걸러 낸다.
 */
const { mergePayloads, toLoadInput } = await import('../src/lib/db/stock-load.ts');

const stockFiles = (await readdir(join(ROOT, '스크래핑/data')))
  .filter((f) => f.startsWith('연동-') && f.endsWith('.json'))
  .sort();
if (stockFiles.length === 0) {
  console.error('스크래핑/data 에 연동-*.json 이 없다. 먼저 스크래핑에서 npm run stock:all 을 돌려라.');
  process.exit(1);
}
const payloads = [];
for (const f of stockFiles) {
  payloads.push(JSON.parse(await readFile(join(ROOT, '스크래핑/data', f), 'utf8')));
}

const merged = mergePayloads(payloads);
const { linked } = toLoadInput(merged);
console.log(`재고 연결 (파일 ${stockFiles.length}개): variant ${merged.length}건 → 공급처 URL 있는 것 ${linked.length}건`);

const rows = listingRows(linked);

// 붙일 variant를 못 찾은 행은 **왜** 못 찾았는지까지 말해야 한다.
// 그냥 세기만 하면 "RICKY가 안 파는 사이즈"와 "표기가 어긋나 조용히 버려짐"이 섞인다 —
// 후자는 버그이고 전자는 정상이다.
const catalogSizes = new Map(CATALOG.map((p) => [p.slug, new Set(p.sizes.map(canonicalSize))]));
const dropped = { sizeNotCarried: 0, mismatch: [] };

let listed = 0;
for (const r of rows) {
  const v = await one(
    `select v.id from product_variants v join products p on p.id = v.product_id
     where p.slug = $1 and v.color = $2 and v.size = $3`,
    [r.product_slug, r.color, r.size],
  );
  if (!v) {
    if (!catalogSizes.get(r.product_slug)?.has(r.size)) dropped.sizeNotCarried += 1;
    else dropped.mismatch.push(`${r.product_slug} | ${r.color} | ${r.size}`);
    continue;
  }
  await q(
    `insert into supplier_listings (variant_id, brand_id, product_url, availability,
       current_price_cad_cents, on_sale, last_checked_at, last_success_at)
     values ($1,$2,$3,$4::availability_state,$5,$6,$7,$8)
     on conflict (variant_id, product_url) do update set
       availability = excluded.availability,
       last_checked_at = excluded.last_checked_at,
       last_success_at = excluded.last_success_at`,
    [v.id, brandIds.get(r.brand_slug), r.product_url, r.availability,
     r.current_price_cad_cents, r.on_sale, r.last_checked_at, r.last_success_at],
  );
  listed += 1;
}
console.log(
  `supplier_listings 적재: ${listed}행 · 공급처에만 있는 사이즈 ${dropped.sizeNotCarried}행(정상)` +
    (dropped.mismatch.length ? ` · 표기 불일치 ${dropped.mismatch.length}행` : ''),
);
dropped.mismatch.slice(0, 5).forEach((m) => console.log('    표기 불일치: ' + m));

// ── 뷰 판정 ──────────────────────────────────────────────────────
const gate = await one(`
  select
    count(*)::int                                as total,
    count(*) filter (where purchasable)::int     as purchasable,
    count(*) filter (where not purchasable)::int as blocked
  from store_variants
`);
console.log(`\nstore_variants: 전체 ${gate.total} · 구매 가능 ${gate.purchasable} · 차단 ${gate.blocked}`);

// ── 신선도 게이트가 정말 작동하는가 ──────────────────────────────
// 방금 넣은 재고를 7시간 전으로 되돌린다. 기본 임계는 6시간이다.
await q(`update supplier_listings set last_success_at = now() - interval '7 hours'`);
const stale = await one(`select count(*) filter (where purchasable)::int as purchasable from store_variants`);

// 다시 방금 시각으로 돌린다.
await q(`update supplier_listings set last_success_at = now()`);
const fresh = await one(`select count(*) filter (where purchasable)::int as purchasable from store_variants`);

console.log(`신선도 게이트: 7시간 전 → 구매 가능 ${stale.purchasable} · 방금 → ${fresh.purchasable}`);

const failures = [];
if (stale.purchasable !== 0) failures.push('임계(6h)를 넘긴 재고로 결제가 열린다 — PROJECT.md §6.5 위반');
if (fresh.purchasable === 0) failures.push('신선한 in_stock인데도 결제가 열리지 않는다');
if (gate.total === 0) failures.push('store_variants가 비어 있다');

// 확인된 적 없는 variant는 구매 가능이면 안 된다.
const never = await one(`
  select count(*)::int as n from store_variants sv
  where sv.purchasable
    and not exists (select 1 from supplier_listings sl where sl.variant_id = sv.variant_id)
`);
if (never.n > 0) failures.push(`공급처 확인 기록이 없는 variant ${never.n}개가 구매 가능이다`);

// 표기가 어긋나 버려지는 재고는 버그다. 사이즈를 안 파는 것과 다르다.
if (dropped.mismatch.length > 0) {
  failures.push(`표기가 어긋나 재고 ${dropped.mismatch.length}행이 조용히 버려졌다`);
}

/*
 * 한 상품의 재고가 다른 상품 URL을 달고 있으면 안 된다.
 * 예전 하네스가 브랜드 첫 행의 URL을 그 브랜드 전체에 붙였고, 그러면 "어디서 본
 * 재고인지"가 통째로 틀린다 — 사람이 되짚을 수도, 재확인할 수도 없다.
 * 상품 하나가 URL 여러 개를 갖는 건 정상이지만(색상별 페이지), 그 반대는 아니다.
 */
const sharedUrl = await one(`
  select count(*)::int as n from (
    select sl.product_url
    from supplier_listings sl
    join product_variants v on v.id = sl.variant_id
    group by sl.product_url
    having count(distinct v.product_id) > 1
  ) x
`);
if (sharedUrl.n > 0) {
  failures.push(`상품 ${sharedUrl.n}개 URL이 서로 다른 상품의 재고에 붙어 있다 — URL 해석이 틀렸다`);
}

if (failures.length > 0) {
  console.error('\n실패:');
  failures.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log('\n전부 통과.');
