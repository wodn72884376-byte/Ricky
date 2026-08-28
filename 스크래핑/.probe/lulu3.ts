import { chromium } from 'playwright';
import { detectBlockPage } from '../src/extract/blockpage.ts';
import { extractProduct } from '../src/extract/jsonld.ts';

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const urls = [
  'https://shop.lululemon.com/en-ca/p/all-sport-tie-front-short-sleeve-shirt/buc1wpvdsk',
  'https://shop.lululemon.com/en-ca/p/shoes/Womens-Team-Canada-Waterproof-Winter-Boot/_/prod20004832',
  'https://shop.lululemon.com/en-ca/p/womens-fast-and-free-short-sleeve-shirt/iz93kpo6u3-md',
];
const browser = await chromium.launch({headless:true, channel:'chromium', args:['--no-sandbox','--disable-blink-features=AutomationControlled']});
const ctx = await browser.newContext({userAgent:UA, locale:'en-CA', timezoneId:'America/Edmonton', viewport:{width:1440,height:900}});

for (const url of urls) {
  const page = await ctx.newPage();
  try {
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    // 넉넉히 기다린다 — 지연 하이드레이션인지 차단인지 가른다
    await page.waitForLoadState('networkidle',{timeout:25000}).catch(()=>{});
    await page.waitForTimeout(8000);
    const html = await page.content();
    const blocked = detectBlockPage(html);
    const ld = (html.match(/application\/ld\+json/g)??[]).length;
    const p = extractProduct(html,'CAD');
    console.log(`\n${url.slice(-52)}`);
    console.log(`  len=${html.length} ld+json=${ld} 차단=${blocked ?? '아님'} title="${(await page.title()).slice(0,40)}"`);
    if (p) {
      const sizes=new Set(p.variants.map(v=>v.size).filter(Boolean));
      console.log(`  ✓ "${p.name}" variant ${p.variants.length} 사이즈 ${sizes.size} [${[...sizes].slice(0,8)}]`);
    }
  } catch(e){ console.log(`\n${url.slice(-52)}\n  FAIL ${(e as Error).message.split('\n')[0].slice(0,60)}`); }
  finally { await page.close(); }
  await new Promise(r=>setTimeout(r,12000)); // 12초 간격
}
await browser.close();
