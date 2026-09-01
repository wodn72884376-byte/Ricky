/**
 * 아크테릭스 상품 상세를 카탈로그 전체에 대해 수집한다.
 *
 * 대상은 `data/supplier-urls.json` 이 이미 해석해 둔 공식몰 URL이다 — 감시 목록을
 * 따로 손으로 들고 있으면 반드시 카탈로그와 어긋난다 (src/stock/catalog.ts 와 같은 이유).
 *
 * 정중하게 (CLAUDE.md 규칙 8): 브라우저 하나로 **한 페이지씩** 순서대로 열고,
 * 페이지마다 머무는 시간(약 8초)에 더해 요청 간 지연을 둔다. 실패하면 지수 백오프로
 * 두 번까지 다시 시도하고 그래도 안 되면 그 상품만 비운 채 넘어간다 —
 * 한 건 때문에 전체를 다시 돌리지 않는다.
 *
 * 결과: `data/제품상세-<태그>.json`
 * 사용: npx tsx src/details/run.ts [--limit N]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';

import { runtime } from '../config/runtime.ts';
import { catalogTargets, resolveTargetUrls } from '../stock/catalog.ts';
import { log } from '../core/logger.ts';
import { isAllowed } from '../core/politeness.ts';
import { extractDetails, type ArcteryxDetails } from './arcteryx.ts';

const DATA_DIR = fileURLToPath(runtime.paths.data);

/** 페이지 사이 간격. 머무는 시간(≈8초)과 별개로 더 쉰다. */
const DELAY_MS = 3000;
const MAX_RETRY = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Target = { slug: string; url: string };

/**
 * 대상은 **카탈로그가 정한다.**
 *
 * 예전엔 `data/supplier-urls.json`(수집기 캐시)만 읽었다. 그러면 카탈로그에 손으로
 * 적어 넣은 주소는 재고 수집을 한 번 돌려 캐시에 학습된 뒤에야 여기 보인다 —
 * 새 상품을 등록한 날 상세가 조용히 비는 이유가 그것이다. `resolveTargetUrls` 는
 * 카탈로그 주소를 1순위로 두고 없으면 캐시로 떨어지므로 두 경로를 다 덮는다.
 *
 * 한 상품에 페이지가 여럿이면 **첫 번째만** 본다. 상품 단위 값(설명·소재·원산지)을
 * 읽는 자리라 페이지가 여럿이어도 답은 하나여야 하고, 첫 번째가 상품 자신의 주소다
 * (색상별 주소는 그 뒤에 온다).
 */
async function targets(): Promise<Target[]> {
  const resolved = await resolveTargetUrls(catalogTargets(['arcteryx']));
  return resolved
    .filter((t) => t.urls.length > 0)
    .map((t) => ({ slug: t.slug, url: t.urls[0]! }));
}

async function fetchOne(browser: Browser, t: Target): Promise<ArcteryxDetails | null> {
  for (let attempt = 0; attempt <= MAX_RETRY; attempt += 1) {
    // 컨텍스트를 매번 새로 연다. 챌린지 쿠키가 쌓여 페이지가 달라지는 것을 막는다.
    const ctx = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1400 } });
    try {
      const page = await ctx.newPage();
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const details = await extractDetails(page, t.url);
      // 설명도 소재도 없으면 챌린지에 막혀 빈 페이지를 읽은 것이다.
      if (!details.description && details.materials.length === 0) throw new Error('빈 페이지');
      return details;
    } catch (err) {
      if (attempt === MAX_RETRY) {
        log.warn(`${t.slug}: ${(err as Error).message}`);
        return null;
      }
      await sleep(DELAY_MS * 2 ** attempt);
    } finally {
      await ctx.close();
    }
  }
  return null;
}

const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const all = await targets();

/*
 * robots.txt 가 막은 경로는 열지 않는다 (CLAUDE.md 규칙 8).
 * 재고 수집은 fetcher 가 이걸 대신 해 주는데, 여기는 브라우저를 직접 몰기 때문에
 * 명시적으로 물어봐야 한다 — 안 물어보면 규칙이 한쪽에서만 지켜진다.
 */
const allowed: Target[] = [];
let disallowed = 0;
for (const t of all) {
  if (await isAllowed(t.url)) allowed.push(t);
  else disallowed += 1;
}
if (disallowed > 0) log.warn(`robots.txt 가 막은 ${disallowed}건은 건너뛴다`);

const list = allowed.slice(0, limit);
log.info(`아크테릭스 상품 ${list.length}개`);
if (list.length === 0) {
  log.warn('대상이 없다. 먼저 npm run stock 으로 공식몰 URL 을 해석해라.');
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const out: Record<string, ArcteryxDetails> = {};
let failed = 0;

for (const [i, t] of list.entries()) {
  const d = await fetchOne(browser, t);
  if (d) {
    out[t.slug] = d;
    log.info(
      `[${i + 1}/${list.length}] ${t.slug} — 원산지 ${d.originOfManufacture ?? '?'} · ` +
        `${d.weightG ?? '?'}g · 그룹 ${d.groups.length} · 취급 ${d.care.length}`,
    );
  } else {
    failed += 1;
    log.warn(`[${i + 1}/${list.length}] ${t.slug} — 실패`);
  }
  await sleep(DELAY_MS);
}

await browser.close();

const tag = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
await mkdir(DATA_DIR, { recursive: true });
const file = join(DATA_DIR, `제품상세-${tag}.json`);
await writeFile(file, JSON.stringify({ generatedAt: new Date().toISOString(), products: out }, null, 2));

log.info(`\n저장: ${file}`);
log.info(`성공 ${Object.keys(out).length} · 실패 ${failed}`);
const noOrigin = Object.entries(out).filter(([, d]) => !d.originOfManufacture).map(([s]) => s);
if (noOrigin.length) log.warn(`원산지 못 읽음 ${noOrigin.length}개: ${noOrigin.join(', ')}`);
