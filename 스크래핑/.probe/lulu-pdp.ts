import { chromium } from 'playwright';
import { detectBlockPage } from '../src/extract/blockpage.ts';
import { extractProduct } from '../src/extract/jsonld.ts';

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// 사이트맵에서 PDP 확보
const smRes = await fetch('https://shop.lululemon.com/sitemap_index.xml',{headers:{'user-agent':UA}});
const idx = await smRes.text();
const children=[...idx.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m=>m[1]!);
console.log('사이트맵 인덱스', children.length, children.slice(0,3));

let pdps: string[] = [];
for (const c of children) {
  const r = await fetch(c,{headers:{'user-agent':UA}});
  const x = await r.text();
  const locs=[...x.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m=>m[1]!).filter(u=>u.includes('/p/'));
  if (locs.length) { console.log(`  ${c} → /p/ ${locs.length}건`); pdps = locs; break; }
}
if (!pdps.length) { console.log('PDP 못 찾음'); process.exit(0); }

const browser = await chromium.launch({headless:true, channel:'chromium', args:['--no-sandbox','--disable-blink-features=AutomationControlled']});
const ctx = await browser.newContext({userAgent:UA, locale:'en-CA', timezoneId:'America/Edmonton', viewport:{width:1440,height:900}});
await ctx.route('**/*', r => ['image','font','media'].includes(r.request().resourceType()) ? r.abort() : r.continue());

for (const url of pdps.slice(0,3)) {
  const page = await ctx.newPage();
  try {
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('script[type="application/ld+json"]',{state:'attached',timeout:15000}).catch(()=>{});
    await page.waitForTimeout(3000);
    const html = await page.content();
    const blocked = detectBlockPage(html);
    if (blocked) { console.log(`\n✗ ${url.slice(-50)} 차단(${blocked})`); continue; }
    const p = extractProduct(html,'CAD');
    console.log(`\n✓ ${url.slice(-60)}`);
    if (!p) { console.log('   Product JSON-LD 없음, len='+html.length); continue; }
    const colors=new Set(p.variants.map(v=>v.color).filter(Boolean));
    const sizes=new Set(p.variants.map(v=>v.size).filter(Boolean));
    console.log(`   "${p.name}" code=${p.productCode} 가격=${p.priceMinor}`);
    console.log(`   variant ${p.variants.length} | 색상 ${colors.size} ${[...colors].slice(0,4)} | 사이즈 ${sizes.size} ${[...sizes].slice(0,8)}`);
    console.log(`   재고: ${p.variants.filter(v=>v.availability==='in_stock').length} in / ${p.variants.filter(v=>v.availability==='out_of_stock').length} out`);
  } catch(e){ console.log(`\n✗ ${url.slice(-50)} ${(e as Error).message.split('\n')[0].slice(0,50)}`); }
  finally { await page.close(); }
}
await browser.close();
