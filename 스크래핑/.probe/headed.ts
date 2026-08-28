import { chromium } from 'playwright';
import { detectBlockPage, blockLabel } from '../src/extract/blockpage.ts';

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const targets = [
  ['폴로 CA',      'https://www.ralphlauren.ca/'],
  ['룰루레몬 CA',  'https://shop.lululemon.com/en-ca'],
  ['캐나다구스 CA','https://www.canadagoose.com/ca/en/'],
  ['투미 CA',      'https://www.tumi.ca/'],
] as const;

for (const headless of [true, false]) {
  console.log(`\n===== headless=${headless} =====`);
  const browser = await chromium.launch({
    headless, channel: 'chromium',
    args: ['--no-sandbox','--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({ userAgent: UA, locale:'en-CA', timezoneId:'America/Edmonton',
    viewport:{width:1440,height:900} });
  for (const [name,url] of targets) {
    const page = await ctx.newPage();
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
      await page.waitForTimeout(5000);
      const html = await page.content();
      const kind = detectBlockPage(html);
      const ld = (html.match(/application\/ld\+json/g)??[]).length;
      console.log(`  ${name.padEnd(13)} len=${String(html.length).padStart(7)}  ld+json=${ld}  ${kind?blockLabel(kind):'정상'}`);
    } catch(e) {
      console.log(`  ${name.padEnd(13)} FAIL ${(e as Error).message.split('\n')[0].slice(0,55)}`);
    } finally { await page.close(); }
  }
  await browser.close();
}
