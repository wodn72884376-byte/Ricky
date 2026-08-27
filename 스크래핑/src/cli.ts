/**
 * CLI 진입점.
 *
 *   npm run doctor                     엔드포인트 생존 확인 (가장 먼저 실행할 것)
 *   npm run signals -- --brand=코치     한국 인기도 신호만
 *   npm run catalog -- --brand=아크테릭스 캐나다 카탈로그만
 *   npm run scan    -- --limit=40      전체 파이프라인 → 리포트
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { getAdapter } from './adapters/index.ts';
import { ALL_BRAND_KEYS, BRANDS, resolveBrands } from './config/brands.ts';
import { runtime } from './config/runtime.ts';
import { browserStatus, closeBrowser } from './core/browser.ts';
import { tryFetchText } from './core/fetcher.ts';
import { log } from './core/logger.ts';
import type { BrandKey } from './core/types.ts';
import { blockLabel, detectBlockPage } from './extract/blockpage.ts';
import { sitemapsFromRobots } from './extract/sitemap.ts';
import { getFxSnapshot } from './fx/rates.ts';
import { runScan } from './pipeline.ts';
import { allRows, toCsv } from './report/csv.ts';
import { renderReport } from './report/markdown.ts';
import { collectBrandSignals } from './signals/collect.ts';
import { naverMode, naverSearch, NaverNotConfiguredError } from './signals/naverClient.ts';

// 프로젝트 경로에 한글이 포함된다 → fileURLToPath (CLAUDE.md 코드 컨벤션)
const DATA_DIR = fileURLToPath(runtime.paths.data);

type Args = {
  command: string;
  brands: BrandKey[];
  limit: number;
  newOnly: boolean;
  fresh: boolean;
  skipSignals: boolean;
  skipKr: boolean;
};

function parseArgs(argv: string[]): Args {
  const command = argv[0] ?? 'help';
  const flags = new Map<string, string>();

  for (const arg of argv.slice(1)) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.slice(2).split('=');
    if (k) flags.set(k, v ?? 'true');
  }

  const num = (k: string, d: number) => {
    const n = Number(flags.get(k));
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : d;
  };

  return {
    command,
    brands: resolveBrands(flags.get('brand') ?? flags.get('brands')),
    limit: num('limit', 25),
    newOnly: flags.get('new') === 'true',
    fresh: flags.get('fresh') === 'true',
    skipSignals: flags.get('no-signals') === 'true',
    skipKr: flags.get('no-kr') === 'true',
  };
}

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '').replace(/-/g, '');

// ---------------------------------------------------------------------------

/**
 * 각 브랜드의 CA/KR 엔드포인트가 실제로 살아있는지 확인한다.
 * 사이트 방어 정책과 도메인은 수시로 바뀌므로, 본 실행 전에 이걸 먼저 돌린다.
 */
async function doctor(brands: BrandKey[]): Promise<void> {
  log.step('환경 점검');

  // 키가 "설정됨"인 것과 "실제로 통하는" 것은 다르다. 한 번 호출해 본다.
  const mode = naverMode();
  if (mode === 'none') {
    log.warn('네이버 API 키 없음 — 인기도 신호를 수집할 수 없다.');
    log.warn('  신규 발급: https://www.ncloud.com/product/applicationService/naverApiHub');
    log.warn('  (developers.naver.com 의 "사용 API" 목록에 검색·데이터랩이 없는 것은 정상이다.');
    log.warn('   2026년에 NAVER API HUB 로 이관됐다.)');
  } else {
    const label = mode === 'hub' ? 'API HUB (ncloud)' : 'developers.naver.com (2027-06-30 유예)';
    try {
      const res = await naverSearch('blog', '아크테릭스', { display: 1, fresh: true });
      log.ok(`네이버 API: ${label} — 호출 성공 (블로그 문서 ${res.total.toLocaleString()}건)`);
    } catch (err) {
      log.error(`네이버 API: ${label} — 호출 실패`);
      log.error(`  ${err instanceof Error ? err.message : String(err)}`);
      if (mode === 'legacy') {
        log.warn('  기존 키가 만료됐을 수 있다. API HUB 키(NAVER_HUB_KEY_ID/KEY)로 전환하라.');
      }
    }
  }
  log.info('네이버 쇼핑 검색 API 는 2026-07-31 종료 — 국내 최저가 대신 공식몰 정가를 쓴다.');

  const browser = await browserStatus();
  const hasBrowser = browser.ok;
  log.info(`Playwright Chromium: ${hasBrowser ? '사용 가능' : '사용 불가'}`);
  if (!hasBrowser) {
    log.warn(browser.hint);
    log.warn('브라우저 없이는 transport=browser 인 사이트를 수집할 수 없다.');
  }

  const fx = await getFxSnapshot();
  log.info(`환율: CAD/KRW ${fx.cadKrw.toFixed(2)} · USD/KRW ${fx.usdKrw.toFixed(2)} (${fx.source})`);
  console.log();

  const rows: string[][] = [['브랜드', '지역', '진입', '사이트맵', '상품URL', '전송']];

  for (const brand of brands) {
    const cfg = BRANDS[brand];
    for (const [region, site] of [
      ['CA', cfg.ca],
      ['KR', cfg.kr],
    ] as const) {
      if (!site) {
        rows.push([cfg.labelKo, region, '미설정', '—', '—', '—']);
        continue;
      }

      log.info(`점검 ${cfg.labelKo} ${region} …`);

      /*
       * 진입 페이지.
       * "바이트가 왔는가"가 아니라 "쓸 수 있는 페이지인가"를 본다.
       * 캡차도 200 으로 오기 때문에, 내용을 안 보면 차단을 성공으로 오보한다.
       */
      const entry = await tryFetchText(site.entry, { fresh: true, maxRetry: 0, timeoutMs: 12_000 });
      let entryStatus: string;

      if (entry && detectBlockPage(entry.body) === null) {
        entryStatus = 'HTTP ok';
      } else if (hasBrowser) {
        const { tryRenderHtml } = await import('./core/browser.ts');
        const html = await tryRenderHtml(site.entry, { region, fresh: true });
        if (!html) entryStatus = '실패';
        else {
          const kind = detectBlockPage(html);
          entryStatus = kind === null ? '브라우저 ok' : blockLabel(kind);
        }
      } else {
        entryStatus = entry ? blockLabel(detectBlockPage(entry.body)) : '실패';
      }

      // 사이트맵
      const declared = await sitemapsFromRobots(site.origin);
      let sitemapStatus = '없음';
      let productCount = '0';
      for (const url of [...declared, ...site.sitemapUrls]) {
        const res = await tryFetchText(url, { skipRobots: true, fresh: true, maxRetry: 0, timeoutMs: 20_000 });
        if (!res) continue;
        const locs = [...res.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
          .map((m) => m[1])
          .filter((u): u is string => Boolean(u));
        if (locs.length === 0) continue;

        const isIndex = /<sitemapindex/i.test(res.body);
        sitemapStatus = `${isIndex ? 'index' : 'urlset'} ${locs.length}`;
        productCount = isIndex ? '(하위)' : String(locs.filter(site.isProductUrl).length);
        break;
      }

      rows.push([cfg.labelKo, region, entryStatus, sitemapStatus, productCount, site.transport]);
    }
  }

  console.log();
  printTable(rows);
  console.log();
  log.info('진입이 "실패"거나 상품URL 이 0 이면 src/config/brands.ts 의 해당 항목을 고쳐라.');
}

function printTable(rows: string[][]): void {
  const widths = rows[0]?.map((_, i) => Math.max(...rows.map((r) => width(r[i] ?? '')))) ?? [];
  rows.forEach((row, ri) => {
    const line = row.map((cell, i) => pad(cell, widths[i] ?? 0)).join('  ');
    console.log(`  ${line}`);
    if (ri === 0) console.log(`  ${widths.map((w) => '-'.repeat(w)).join('  ')}`);
  });
}

/** 한글은 터미널에서 2칸을 차지한다. */
const width = (s: string) => [...s].reduce((n, ch) => n + (/[가-힣ㄱ-ㅎ]/.test(ch) ? 2 : 1), 0);
const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - width(s)));

// ---------------------------------------------------------------------------

async function signalsOnly(brands: BrandKey[]): Promise<void> {
  for (const brand of brands) {
    const cfg = BRANDS[brand];
    log.step(`${cfg.labelKo} 인기도 신호`);
    const s = await collectBrandSignals(brand);

    const rows: string[][] = [['검색어', '점수', '증가율', '블로그', '카페', '최근1년', '쇼핑']];
    s.scores
      .map((score, i) => ({ score, raw: s.signals[i] }))
      .sort((a, b) => b.score.score - a.score.score)
      .forEach(({ score, raw }) => {
        if (!raw) return;
        rows.push([
          score.query,
          String(score.score),
          `${score.momentumPct > 0 ? '+' : ''}${score.momentumPct}%`,
          raw.blogTotal.toLocaleString(),
          raw.cafeTotal.toLocaleString(),
          `${Math.round(raw.recentBlogRatio * 100)}%`,
          raw.shoppingTotal === null ? '—' : raw.shoppingTotal.toLocaleString(),
        ]);
      });
    console.log();
    printTable(rows);
    console.log();

    log.info(`국내 관측 언급 상위 10건 (블로그·카페 글 제목):`);
    for (const p of s.observedProducts.slice(0, 10)) {
      console.log(`    · [${p.source}] ${p.title}`);
    }
    console.log();
  }
}

async function catalogOnly(args: Args): Promise<void> {
  for (const brand of args.brands) {
    const cfg = BRANDS[brand];
    log.step(`${cfg.labelKo} 캐나다 카탈로그`);

    const adapter = getAdapter(brand);
    const found = await adapter.discover('CA', {
      limit: args.limit,
      newOnly: args.newOnly,
      fresh: args.fresh,
    });
    log.ok(`URL ${found.length}건`);

    const rows: string[][] = [['상품', 'CAD', '재고', '색상', '갱신']];
    for (const e of found) {
      const l = await adapter.fetchListing(e.url, 'CA', { fresh: args.fresh, lastModified: e.lastModified });
      if (!l) {
        rows.push(['(파싱 실패)', '—', '—', '—', e.url.slice(-40)]);
        continue;
      }
      rows.push([
        l.name.slice(0, 42),
        l.priceMinor === null ? '—' : (l.priceMinor / 100).toFixed(2),
        l.availability,
        String(new Set(l.variants.map((v) => v.color).filter(Boolean)).size || '—'),
        (l.releaseDate ?? l.lastModified ?? '—').slice(0, 10),
      ]);
    }
    console.log();
    printTable(rows);
    console.log();
  }
}

async function scan(args: Args): Promise<void> {
  const result = await runScan({
    brands: args.brands,
    limit: args.limit,
    newOnly: args.newOnly,
    fresh: args.fresh,
    skipSignals: args.skipSignals || !runtime.naver.enabled,
    skipKr: args.skipKr,
  });

  await mkdir(DATA_DIR, { recursive: true });
  const tag = stamp();

  const md = renderReport(result.results, result.signalsByBrand, result.fx, {
    startedAt: result.startedAt,
    durationMs: result.durationMs,
    newOnly: args.newOnly,
    limit: args.limit,
  });
  const mdPath = join(DATA_DIR, `소싱리포트-${tag}.md`);
  await writeFile(mdPath, md, 'utf8');

  const csvPath = join(DATA_DIR, `소싱리포트-${tag}.csv`);
  await writeFile(csvPath, toCsv(allRows(result.results)), 'utf8');

  const jsonPath = join(DATA_DIR, `소싱원자료-${tag}.json`);
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        meta: { startedAt: result.startedAt, durationMs: result.durationMs, fx: result.fx, args },
        results: result.results,
        signals: Object.fromEntries(result.signalsByBrand),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log();
  log.ok(`리포트  ${mdPath}`);
  log.ok(`CSV     ${csvPath}`);
  log.ok(`원자료  ${jsonPath}`);
}

function help(): void {
  console.log(`
RICKY 소싱 리서치 파이프라인

  한국 인기도 신호 × 캐나다 공식몰 신제품 × CA/KR 가격 비교

사용법
  npm run doctor                     엔드포인트 생존 확인 (먼저 실행할 것)
  npm run signals -- --brand=coach   한국 인기도 신호만 수집
  npm run catalog -- --brand=arcteryx --new
                                     캐나다 카탈로그만 수집
  npm run scan -- --limit=40         전체 파이프라인 → data/ 에 리포트 생성

옵션
  --brand=<key[,key]>   대상 브랜드. 기본 전체
                        ${ALL_BRAND_KEYS.join(', ')}
  --limit=<n>           브랜드당 수집 상품 수 (기본 25)
  --new                 최근 ${runtime.newProductWindowDays}일 내 신제품만
  --fresh               캐시 무시하고 새로 수집
  --no-signals          네이버 인기도 신호 생략
  --no-kr               한국 가격 수집 생략 (CA 카탈로그만)

준비
  1) npm install
  2) npm run browsers            Playwright Chromium 설치
  3) cp .env.example .env        네이버 API 키 입력
`);
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  try {
    switch (args.command) {
      case 'doctor':
        await doctor(args.brands);
        break;
      case 'signals':
        await signalsOnly(args.brands);
        break;
      case 'catalog':
        await catalogOnly(args);
        break;
      case 'scan':
      case 'compare':
        await scan(args);
        break;
      default:
        help();
    }
  } catch (err) {
    if (err instanceof NaverNotConfiguredError) {
      log.error(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    await closeBrowser();
  }
}

main().catch((err) => {
  log.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exitCode = 1;
});
