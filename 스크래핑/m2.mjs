import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const pages = [
  ['아크테릭스', 'http://localhost:3000/products/arcteryx-beta-ar-jacket-men'],
  ['코치',     'http://localhost:3000/products/coach-brooklyn-shoulder-bag-28-women'],
];
for (const [label, url] of pages) {
  for (const [w, dpr] of [[1920, 2], [390, 3]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, deviceScaleFactor: dpr });
    const p = await ctx.newPage();
    const r = await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    if (r.status() !== 200) { console.log(`${label} ${w}: HTTP ${r.status()}`); await ctx.close(); continue; }
    const info = await p.evaluate(() => {
      const cell = document.querySelector('li.cursor-zoom-ricky');
      if (!cell) return 'gallery 없음';
      const img = cell.querySelector('img');
      const m = img.currentSrc.match(/w=(\d+)&q=(\d+)/) || [];
      return { cell: Math.round(cell.getBoundingClientRect().width), served: +m[1], q: +m[2] };
    });
    if (info.cell) {
      const need = Math.round(info.cell * 1.9 * dpr);
      console.log(`${label.padEnd(6)} ${String(w).padStart(4)}dpr${dpr}  셀 ${String(info.cell).padStart(3)}px · 확대에 필요 ${String(need).padStart(4)}px · 전송 ${info.served}px q${info.q}  ${info.served >= need ? 'OK' : '부족'}`);
    } else console.log(label, w, info);
    await ctx.close();
  }
}
await b.close();
