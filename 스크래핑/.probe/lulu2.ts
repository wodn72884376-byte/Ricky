import { BRANDS } from '../src/config/brands.ts';
import { collectFromSitemap, sitemapsFromRobots } from '../src/extract/sitemap.ts';
import { getAdapter } from '../src/adapters/index.ts';
import { closeBrowser } from '../src/core/browser.ts';

const site = BRANDS.lululemon.ca;
const declared = await sitemapsFromRobots(site.origin);
console.log('robots 선언 사이트맵:', declared);

let entries: Array<{url:string; lastModified:string|null}> = [];
for (const sm of [...declared, ...site.sitemapUrls]) {
  entries = await collectFromSitemap(sm, {
    match: site.isProductUrl, followIndex: site.followSitemap,
    limit: 200, browserFallback: true, region: 'CA', fresh: true,
  });
  console.log(`  ${sm} → ${entries.length}건`);
  if (entries.length) break;
}
if (!entries.length) { console.log('상품 URL 없음'); await closeBrowser(); process.exit(0); }
console.log('샘플:', entries.slice(0,3).map(e=>e.url));

const adapter = getAdapter('lululemon');
for (const e of entries.slice(0,3)) {
  const l = await adapter.fetchListing(e.url, 'CA', { fresh: true });
  if (!l) { console.log(`\n✗ ${e.url.slice(-55)} — 수집 실패`); continue; }
  const colors=new Set(l.variants.map(v=>v.color).filter(Boolean));
  const sizes=new Set(l.variants.map(v=>v.size).filter(Boolean));
  console.log(`\n✓ ${l.name}  [${l.productCode}]  ${l.priceMinor}`);
  console.log(`   variant ${l.variants.length} | 색상 ${colors.size} ${[...colors].slice(0,4)} | 사이즈 ${sizes.size} ${[...sizes].slice(0,8)}`);
  console.log(`   재고 ${l.variants.filter(v=>v.availability==='in_stock').length}/${l.variants.length} | ${l.fetchMode}`);
}
await closeBrowser();
