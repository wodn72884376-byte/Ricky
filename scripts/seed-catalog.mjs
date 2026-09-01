/**
 * 정적 카탈로그를 Supabase 에 올린다.
 *
 *   src/lib/catalog.generated.ts  →  brands · products · product_variants
 *
 * 사용:
 *   npm run db:seed              무엇이 바뀌는지만 보여준다 (기본)
 *   npm run db:seed -- --commit  실제로 쓴다
 *
 * **기본이 미리보기다.** 운영 DB 에 쓰는 건 되돌리기 어렵다 (load-stock.mjs 와 같은 규칙).
 *
 * ## 왜 필요한가
 * 스토어는 `catalog.generated.ts` 를 읽고 `/admin` 은 DB 를 읽는다. 둘이 이어져 있지
 * 않아서, 임포트를 아무리 돌려도 관리자 화면에는 고칠 대상이 없다. 이 스크립트가
 * 그 간극을 메운다 — 카탈로그가 원본이고 DB 가 사본이다.
 *
 * ## 전부 draft 로 넣는다
 * `products_disclosure_complete` 제약이 `active` 에 원산지·소재·취급주의·제조자·
 * A/S 연락처·스마트스토어 URL 을 전부 요구한다. 카탈로그에 없는 값이 있으므로
 * (A/S 연락처는 어디에도 없다) 게시는 운영자가 `/admin` 에서 판단한다.
 * **여기서 억지로 채워 넣지 않는다** — 빈칸을 그럴듯한 문구로 메우면 표시광고법 문제다.
 *
 * ## 사이즈는 공식몰이 안다
 * `details.txt` 의 사이즈 목록은 사람이 적은 값이라 빠지는 게 있다 — 실측: 아크테릭스
 * XXL, 폴로 XS 등이 공식몰에는 있는데 카탈로그엔 없어 수집한 재고가 붙을 자리를
 * 못 찾았다. 수집 결과(`스크래핑/data/연동-*.json`)에서 실제로 관측된 사이즈를 합친다.
 * 관측된 것만 더하고, 없는 것을 만들지는 않는다.
 *
 * ## 덮어쓰기 범위
 * `slug`·`sku` 로 upsert 한다. 운영자가 `/admin` 에서 고친 값이 있으면 **되돌아간다** —
 * 카탈로그가 원본이라는 전제이므로 의도된 동작이지만, 실행 전에 무엇이 바뀌는지
 * 미리보기로 확인해라.
 */
import { ROOT, adminClient, dbUnreachable, loadEnv } from './db-env.mjs';

await loadEnv();

const { CATALOG } = await import('../src/lib/catalog.generated.ts');
const { productRow, variantRows, canonicalSize } = await import('../src/lib/db/seed-rows.ts');

const COMMIT = process.argv.includes('--commit');

/** 수집 결과에서 상품별로 실제 관측된 사이즈를 모은다. 없으면 빈 맵이다. */
async function observedSizes() {
  const { readdir, readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const dir = join(ROOT, '스크래핑', 'data');
  const out = new Map();
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.startsWith('연동-') && f.endsWith('.json')).sort();
  } catch {
    return out; // 수집 결과가 아직 없다 — 카탈로그 사이즈만 쓴다
  }
  for (const f of files) {
    let payload;
    try {
      payload = JSON.parse(await readFile(join(dir, f), 'utf8'));
    } catch {
      continue;
    }
    for (const v of payload.variants ?? []) {
      const set = out.get(v.slug) ?? new Set();
      for (const s of v.sizes ?? []) set.add(canonicalSize(s.label));
      out.set(v.slug, set);
    }
  }
  return out;
}

// ── 올릴 것 계산 ─────────────────────────────────────────────────
const observed = await observedSizes();
const products = CATALOG.map(productRow);
const variants = CATALOG.flatMap((p) => variantRows(p, observed.get(p.slug) ?? []));

const addedSizes = CATALOG.flatMap((p) => {
  const have = new Set(p.sizes.map(canonicalSize));
  return [...(observed.get(p.slug) ?? [])].filter((s) => !have.has(s)).map((s) => `${p.slug} ${s}`);
});
if (addedSizes.length > 0) {
  console.log(`공식몰에서 관측해 더한 사이즈 ${addedSizes.length}건 (카탈로그에 없던 것)`);
  for (const a of addedSizes.slice(0, 6)) console.log(`  + ${a}`);
  if (addedSizes.length > 6) console.log(`  … 외 ${addedSizes.length - 6}건`);
}
const usedBrands = [...new Set(products.map((p) => p.brand_slug))].sort();

console.log(`카탈로그 상품 ${products.length}개 · 옵션 ${variants.length}개`);
console.log(`브랜드: ${usedBrands.join(', ')}`);

// SKU 는 DB 에서 전역 unique 다. 중복이 있으면 insert 가 통째로 실패하므로 먼저 잡는다.
const skuSeen = new Map();
for (const v of variants) skuSeen.set(v.sku, (skuSeen.get(v.sku) ?? 0) + 1);
const dupes = [...skuSeen].filter(([, n]) => n > 1);
if (dupes.length > 0) {
  console.error(`\nSKU 중복 ${dupes.length}건 — 올리기 전에 고쳐야 한다:`);
  for (const [sku, n] of dupes.slice(0, 10)) console.error(`  ${sku} × ${n}`);
  process.exit(1);
}

const missing = products.filter((p) => !p.origin_country || !p.material || !p.care);
console.log(`고시 항목이 덜 찬 상품 ${missing.length}개 — 전부 draft 로 올라간다`);

const db = adminClient();

// ── 브랜드 ───────────────────────────────────────────────────────
/*
 * 상품이 있는 브랜드는 켠다. 마이그레이션 시드가 캐나다구스·폴로를 `active=false`
 * (출시 예정)로 넣어 뒀는데, 그 뒤 상품이 등록됐다 — 상품은 있는데 브랜드는 꺼진 상태다.
 */
const { data: brands, error: brandErr } = await db.from('brands').select('id, slug, active');
if (brandErr) dbUnreachable('brands 조회', brandErr);

const brandId = new Map(brands.map((b) => [b.slug, b.id]));
const unknown = usedBrands.filter((s) => !brandId.has(s));
if (unknown.length > 0) {
  console.error(`\nDB 에 없는 브랜드: ${unknown.join(', ')} — 마이그레이션에 먼저 추가해라.`);
  process.exit(1);
}
const toActivate = brands.filter((b) => usedBrands.includes(b.slug) && !b.active).map((b) => b.slug);
if (toActivate.length > 0) console.log(`활성화할 브랜드: ${toActivate.join(', ')}`);

// ── 현재 DB 상태와 비교 ──────────────────────────────────────────
const { data: existing, error: exErr } = await db.from('products').select('slug, status');
if (exErr) dbUnreachable('products 조회', exErr);

const known = new Set(existing.map((p) => p.slug));
const added = products.filter((p) => !known.has(p.slug));
const updated = products.filter((p) => known.has(p.slug));
const published = existing.filter((p) => p.status === 'active').length;

console.log(`\nDB 현재 상품 ${existing.length}개 (게시 ${published}개)`);
console.log(`  새로 추가 ${added.length}개 · 덮어쓰기 ${updated.length}개`);
if (updated.length > 0 && published > 0) {
  console.log('  주의: 덮어쓰기는 /admin 에서 수정한 값을 카탈로그 값으로 되돌린다');
}

if (!COMMIT) {
  console.log('\n미리보기다. 실제로 쓰려면 --commit 을 붙여라.');
  process.exit(0);
}

// ── 쓰기 ─────────────────────────────────────────────────────────
if (toActivate.length > 0) {
  const { error } = await db.from('brands').update({ active: true }).in('slug', toActivate);
  if (error) dbUnreachable('brands 활성화', error);
  console.log(`\n브랜드 ${toActivate.length}개 활성화`);
}

/*
 * 이미 있는 상품의 status 는 **DB 값을 그대로 되돌려 넣는다.**
 * 운영자가 게시한 상품을 시드가 draft 로 되돌리면 판매가 멈춘다 — 카탈로그는
 * 게시 여부를 모르므로 판단할 자격이 없다.
 *
 * 빼는 것으로는 안 된다. upsert 는 INSERT … ON CONFLICT 라 INSERT 절이
 * 모든 열을 요구하고, payload 에서 빠진 열은 NULL 이 되어
 * `null value in column "status" violates not-null` 로 죽는다(실측).
 */
const statusOf = new Map(existing.map((p) => [p.slug, p.status]));
const productPayload = products.map(({ brand_slug, status, ...rest }) => ({
  ...rest,
  brand_id: brandId.get(brand_slug),
  status: statusOf.get(rest.slug) ?? status,
}));

const { error: pErr } = await db.from('products').upsert(productPayload, { onConflict: 'slug' });
if (pErr) dbUnreachable('products 적재', pErr);
console.log(`상품 ${productPayload.length}개 적재`);

// variant 는 product_id 가 필요하므로 방금 쓴 것을 다시 읽는다.
const { data: saved, error: sErr } = await db.from('products').select('id, slug');
if (sErr) dbUnreachable('products 재조회', sErr);
const productId = new Map(saved.map((p) => [p.slug, p.id]));

const variantPayload = variants.map(({ product_slug, ...rest }) => ({
  ...rest,
  product_id: productId.get(product_slug),
}));

/*
 * 한 번에 다 보내면 요청이 커져 타임아웃이 난다. 200 개씩 끊는다.
 * 실패해도 앞 묶음은 남는다 — 이 스크립트는 몇 번을 돌려도 같은 결과다(멱등).
 *
 * 충돌 기준은 `sku` 가 아니라 **(상품, 사이즈, 색상)** 이다. 그게 옵션의 정체이고
 * SKU 는 거기 붙은 이름표라서 고쳐질 수 있다 — 실측: Beta Jacket 의 Headwaters 는
 * 상품 대표 코드(X000010878)를 쓰다가 제 코드(X000010511)로 바로잡혔는데,
 * `sku` 로 충돌을 보면 같은 칸에 새 행을 넣으려다
 * `product_variants_product_id_size_color_key` 에 걸려 적재가 통째로 멈춘다.
 */
const CHUNK = 200;
for (let i = 0; i < variantPayload.length; i += CHUNK) {
  const slice = variantPayload.slice(i, i + CHUNK);
  const { error } = await db
    .from('product_variants')
    .upsert(slice, { onConflict: 'product_id,size,color' });
  if (error) dbUnreachable(`옵션 적재 (${i + 1}~${i + slice.length})`, error);
  process.stdout.write(`\r옵션 ${Math.min(i + CHUNK, variantPayload.length)}/${variantPayload.length} 적재`);
}
console.log();

console.log('\n완료. /admin/products 에서 확인하고, 고시 항목을 채운 뒤 게시해라.');
