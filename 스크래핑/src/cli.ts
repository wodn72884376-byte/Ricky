/**
 * CLI 진입점.
 *
 *   npm run doctor                     엔드포인트 생존 확인 (가장 먼저 실행할 것)
 *   npm run signals -- --brand=코치     한국 인기도 신호만
 *   npm run catalog -- --brand=아크테릭스 캐나다 카탈로그만
 *   npm run scan    -- --limit=40      전체 파이프라인 → 리포트
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { isAbsolute, join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';

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
import { runStockCheck } from './stock/check.ts';
import { diffStock } from './stock/diff.ts';
import { renderStockReport, toStockCsv } from './stock/report.ts';
import { renderStockHtml } from './stock/html.ts';
import { toSupabaseCsv, toSupabasePayload } from './stock/supabase.ts';
import {
  catalogTargets,
  coverage,
  learnUrls,
  resolveTargetUrls,
  type CatalogTarget,
} from './stock/catalog.ts';
import { collectReports, renderDashboard } from './stock/dashboard.ts';
import { buildExtension } from './extension/build.ts';
import { watchCaptures } from './stock/watch.ts';
import { writeDisclosure } from './details/collect.ts';
import { intakeProduct } from './details/intake.ts';
import {
  buildConsoleData,
  consolePage,
  observationsOf,
} from './stock/console.ts';
import {
  LOGON_SCRIPT_NAME,
  SERVICE_NAME,
  installLogonScript,
  installService,
  lingerEnabled,
} from './stock/autostart.ts';
import type { ProductStock, StockRow } from './stock/types.ts';
import {
  bookmarkletHelp,
  bookmarkletPage,
  batchBookmarkletSource,
  targetsFingerprint,
  bookmarkletSource,
  catalogFingerprint,
  nameSlug,
} from './stock/bookmarklet.ts';
import { importCaptures } from './stock/import.ts';
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
  /** 감시 목록 파일 경로. 있으면 이 URL 들만 조회한다. */
  watchFile: string | null;
  /** 북마클릿 수집 파일이 있는 디렉터리. 있으면 네트워크 수집 대신 이걸 읽는다. */
  importDir: string | null;
  /** 자동 수집과 북마클릿 수집분을 한 번에 돌려 리포트 하나로 합친다. */
  all: boolean;
  /**
   * 상위 프로젝트 카탈로그에 등록된 상품만 조회한다. **기본값이 켬이다.**
   *
   * 예전엔 꺼짐이 기본이라 `npm run stock:all` 이 브랜드별 사이트맵에서 아무 상품이나
   * 25건씩 긁어 왔다. 실측 사고: 리포트에 Cerium Jacket · Proton Heavyweight Hoody 처럼
   * **등록하지도 않은 상품**이 올라오고 정작 등록 상품 24건은 조회되지 않았다.
   * 우리가 파는 건 카탈로그에 있는 것뿐이므로 그게 기본이어야 한다.
   * 사이트맵 탐색이 필요하면 `--no-catalog`.
   */
  catalog: boolean;
  /**
   * 확장에 자동 수집 브랜드까지 넣는다. 기본은 꺼짐 — 아크테릭스·코치는 서버에서
   * 그냥 받아지므로 확장까지 열면 같은 페이지를 두 번 긁는다.
   */
  allBrands: boolean;
  /** 플래그가 아닌 인자. `intake` 가 받는 공식몰 URL 들이다. */
  positionals: string[];
  /** `intake --into="…"` — 상품 폴더명을 직접 준다. 기존 상품에 색상만 더할 때 쓴다. */
  into: string | null;
  /** 파일을 쓰지 않고 무엇을 할지만 보여 준다. */
  dryRun: boolean;
  /** watch 의 폴링 간격(초). */
  everySec: number;
  /** 수집 후 Supabase 적재를 건너뛴다. 수집만 시험할 때 쓴다. */
  noLoad: boolean;
};

export function parseArgs(argv: string[]): Args {
  const command = argv[0] ?? 'help';
  const flags = new Map<string, string>();
  const positionals = argv.slice(1).filter((a) => !a.startsWith('--'));

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
    watchFile: flags.get('watch') === 'true' ? 'watchlist.txt' : (flags.get('watch') ?? null),
    importDir: flags.get('import') === 'true' ? defaultDownloadsDir() : (flags.get('import') ?? null),
    all: flags.get('all') === 'true',
    catalog: flags.get('no-catalog') !== 'true' && flags.get('catalog') !== 'false',
    allBrands: flags.get('all-brands') === 'true',
    positionals,
    into: flags.get('into') ?? null,
    dryRun: flags.get('dry') === 'true',
    everySec: num('every', 20),
    noLoad: flags.get('no-load') === 'true',
  };
}

// 초까지 넣는다. 분 단위면 같은 분에 두 번 돌릴 때 직전 스냅샷을 덮어써
// 변화 이력이 사라진다(재고 조회는 짧은 간격으로 반복 실행되는 작업이다).
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '');

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

/**
 * 재고 조회 (PROJECT.md §6).
 * 직전 스냅샷과 대조해 품절·재입고·가격변동 이벤트까지 낸다.
 */
async function stock(args: Args): Promise<void> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  /*
   * 조회 대상.
   *
   * --catalog 는 상위 프로젝트에 등록된 상품만 본다. 감시 목록을 손으로 관리하면
   * 반드시 카탈로그와 어긋나므로(등록했는데 조회 안 되고, 뺐는데 계속 조회한다)
   * 등록된 상품이 곧 조회 대상이 되게 한다.
   */
  let targets: CatalogTarget[] = [];
  let watchUrls: string[] | undefined;

  if (args.catalog) {
    targets = catalogTargets(args.brands);
    log.step(`카탈로그 상품 ${targets.length}건`);
    targets = await resolveTargetUrls(targets, { fresh: args.fresh });

    // 한 상품이 페이지 여러 개일 수 있다 (캐나다구스 디스크). 전부 조회 대상이다.
    const resolved = targets.filter((t) => t.urls.length > 0);
    watchUrls = resolved.flatMap((t) => t.urls);
    log.ok(`  공식몰 URL 확보 ${resolved.length}/${targets.length}건 (페이지 ${watchUrls.length}개)`);
  }

  const watchFile = args.watchFile ?? (args.all && !args.catalog ? 'watchlist.txt' : null);
  if (watchFile && (args.all || !args.importDir)) {
    const path = isAbsolute(watchFile) ? watchFile : join(process.cwd(), watchFile);
    try {
      watchUrls = (await readFile(path, 'utf8'))
        .split(/\r?\n/)
        .map((l) => l.replace(/#.*$/, '').trim())
        .filter((l) => l.startsWith('http'));
      log.info(`감시 목록 ${watchUrls.length}건 (${watchFile})`);
    } catch {
      if (!args.all) {
        log.error(`감시 목록을 읽지 못했다: ${path}`);
        process.exitCode = 1;
        return;
      }
      log.info(`감시 목록 없음 (${watchFile})`);
    }
    if (watchUrls && watchUrls.length === 0) {
      if (!args.all) {
        log.error('감시 목록이 비어 있다.');
        process.exitCode = 1;
        return;
      }
      watchUrls = undefined;
    }
  }

  /*
   * 수집 경로가 둘이다 — 자동(아크테릭스·코치)과 북마클릿(차단 브랜드).
   * --all 은 둘을 한 번에 돌려 리포트 하나로 합친다. 브랜드마다 명령을
   * 따로 기억해야 하면 결국 안 돌리게 된다.
   */
  const results: ProductStock[] = [];

  if (args.all || !args.importDir) {
    results.push(
      ...(await runStockCheck({
        brands: args.brands,
        limit: args.limit,
        fresh: args.fresh,
        ...(watchUrls ? { watchUrls } : {}),
      })),
    );
  }

  if (args.all || args.importDir) {
    const dir = args.importDir ?? defaultDownloadsDir();
    try {
      const embedded = bookmarkletCatalog();
      const fp = catalogFingerprint(embedded.byHost, embedded.slugsByHost);
      /*
       * 확장이 지금 열어야 할 페이지 목록. 캡처에 실린 것과 다르면 크롬의 확장이
       * 낡은 것이다 — 상품 목록이 그대로여도 주소가 새로 채워지면 달라진다.
       */
      const targetsFp = targetsFingerprint(
        (await resolveTargetUrls(catalogTargets(), { fresh: args.fresh }))
          .filter((t) => BRANDS[t.brand].ca.automation === 'bookmarklet')
          .flatMap((t) => t.urls),
      );
      results.push(...(await importCaptures(dir, { catalogFp: fp, targetsFp })));

      /*
       * 고시 항목도 같은 파일에서 나온다. 따로 명령을 치게 하면 결국 안 치게 되고,
       * 확장이 걷어 온 값이 파일에만 남는다. 여기서 같이 뽑는다 — 네트워크를 쓰지 않는다.
       */
      const { count } = await writeDisclosure(dir);
      if (count > 0) {
        console.log('    카탈로그에 반영하려면: npm run catalog:import (상위 프로젝트)');
      }
    } catch (err) {
      // --all 에서는 북마클릿 수집분이 없어도 자동 수집분만으로 진행한다
      if (!args.all) throw err;
      log.info(`북마클릿 수집분 없음 (${dir})`);
    }
  }

  /*
   * 카탈로그 대조.
   * 목록수집은 주변 상품까지 담아 오므로 등록된 상품만 남긴다.
   * 그리고 아직 못 받은 상품을 알려 준다 — 이게 다음에 무엇을 할지 정해 준다.
   */
  let missing: CatalogTarget[] = [];
  if (args.catalog) {
    const learned = await learnUrls(results, targets);
    if (learned > 0) log.info(`  북마클릿 수집분에서 공식몰 URL ${learned}건 학습`);

    const cov = coverage(results, targets);
    missing = cov.missing;
    const kept = cov.covered.map((c) => c.stock);

    if (cov.extra.length > 0) {
      log.info(`  카탈로그에 없는 수집분 ${cov.extra.length}건 제외`);
    }
    // 수집 실패는 남긴다 — 왜 못 받았는지 리포트에 보여야 한다.
    results.length = 0;
    results.push(...kept);
  }

  const rows: StockRow[] = results.flatMap((r) => r.rows);

  // 직전 스냅샷과 대조. 수집 실패분은 양쪽 모두에서 빠지므로 오탐이 나지 않는다.
  await mkdir(DATA_DIR, { recursive: true });
  const previous = await loadLatestSnapshot();
  const events = previous ? diffStock(previous.rows, rows) : [];
  if (previous) log.info(`이전 스냅샷 ${previous.label} 대비 변화 ${events.length}건`);

  const tag = stamp();
  const missingOut = missing.map((m) => ({
    brand: m.brand,
    name: m.name,
    codes: m.codes,
    candidates: m.candidates,
  }));
  const md = renderStockReport(results, events, {
    startedAt,
    durationMs: Date.now() - t0,
    comparedWith: previous?.label ?? null,
  });

  const htmlPath = join(DATA_DIR, `재고-${tag}.html`);
  const mdPath = join(DATA_DIR, `재고-${tag}.md`);
  const csvPath = join(DATA_DIR, `재고-${tag}.csv`);
  const jsonPath = join(DATA_DIR, `재고-${tag}.json`);

  await writeFile(
    htmlPath,
    renderStockHtml(results, events, {
      startedAt,
      durationMs: Date.now() - t0,
      comparedWith: previous?.label ?? null,
      missing: missingOut,
    }),
    'utf8',
  );
  await writeFile(mdPath, md, 'utf8');
  await writeFile(csvPath, toStockCsv(rows), 'utf8');
  await writeFile(
    jsonPath,
    // 못 받은 상품도 스냅샷에 남긴다 — HTML 에만 있으면 재처리·추적을 못 한다.
    JSON.stringify({ meta: { startedAt, tag, missing: missingOut }, results, events, rows }, null, 2),
    'utf8',
  );

  /*
   * 상위 프로젝트가 Supabase 에 넣을 적재용 산출물.
   * 카탈로그 variant 에 붙지 않으면 넣을 자리가 없으므로 카탈로그 모드에서만 낸다.
   * **원가(CAD)가 들어 있어 관리자 전용이다** — CLAUDE.md 규칙 1.
   */
  let linkPaths: { json: string; csv: string } | null = null;
  if (args.catalog) {
    const payload = toSupabasePayload(rows, { snapshot: tag, generatedAt: startedAt });
    const linkJson = join(DATA_DIR, `연동-${tag}.json`);
    const linkCsv = join(DATA_DIR, `연동-${tag}.csv`);
    await writeFile(linkJson, JSON.stringify(payload, null, 2), 'utf8');
    await writeFile(linkCsv, toSupabaseCsv(payload), 'utf8');
    linkPaths = { json: linkJson, csv: linkCsv };

    const c = payload.meta.counts;
    log.info(`  연동 대상 variant ${c.linked}건 · 미연결 ${c.unlinked}건`);
    const moved = payload.variants.filter((v) => v.priceChanged).length;
    if (moved > 0) log.warn(`  카탈로그와 원가가 달라진 variant ${moved}건 — 판매가 재계산 필요`);
    for (const a of payload.priceAlerts) {
      log.warn(
        `  ${a.slug}: 색상별 가격이 갈리는데 세일 표기가 없다 ` +
          `(보통 CA$${(a.typicalCadCents / 100).toFixed(2)}, ` +
          `${a.odd.map((o) => `${o.color} CA$${(o.cadCents / 100).toFixed(2)}`).join(', ')})`,
      );
    }
  }

  // 고정 주소 대시보드를 갱신한다. 타임스탬프 파일을 매번 찾지 않게 하려는 것이다.
  const indexPath = join(DATA_DIR, 'index.html');
  await writeFile(indexPath, renderDashboard(await collectReports(DATA_DIR)), 'utf8');

  console.log();
  log.ok('브라우저에서 열기 ↓  (즐겨찾기에 등록해 두면 항상 최신)');
  console.log(`   ${browserPath(indexPath)}`);
  console.log();
  log.info(`이번 리포트  ${browserPath(htmlPath)}`);
  log.info(`CSV          ${csvPath}`);
  log.info(`스냅샷       ${jsonPath}`);
  if (linkPaths) {
    log.info(`Supabase 적재 ${linkPaths.json}`);
    log.info(`  확인용 CSV  ${linkPaths.csv}`);
  }
}

/** data/ 에서 가장 최근 재고 스냅샷을 읽는다. 다음 실행의 대조 기준이 된다. */
async function loadLatestSnapshot(): Promise<{ label: string; rows: StockRow[] } | null> {
  try {
    const files = (await readdir(DATA_DIR))
      .filter((f) => f.startsWith('재고-') && f.endsWith('.json'))
      .sort();
    const latest = files.at(-1);
    if (!latest) return null;
    const parsed = JSON.parse(await readFile(join(DATA_DIR, latest), 'utf8')) as {
      rows?: StockRow[];
    };
    if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;
    return { label: latest.replace(/^재고-|\.json$/g, ''), rows: parsed.rows };
  } catch {
    return null;
  }
}

/**
 * 다운로드 폴더를 지켜보다가 수집 파일이 떨어지면 `stock:all` 을 대신 돌린다.
 *
 * 확장은 브라우저 안에 있고 파이프라인은 Node 라, 확장이 이 명령을 직접 띄울 수는
 * 없다(MV3 는 네이티브 메시징 호스트를 따로 설치해야 한다). 대신 확장이 남기는
 * **파일을 신호로** 쓴다 — 북마클릿으로 손수 받은 파일도 똑같이 잡힌다.
 */
async function watch(args: Args): Promise<void> {
  const dir = args.importDir ?? defaultDownloadsDir();

  await watchCaptures({
    dir,
    everyMs: args.everySec * 1000,
    onSettled: async () => {
      await stock({ ...args, all: true, command: 'stock' });
      if (!args.noLoad) await loadToSupabase();
    },
  });
}

/**
 * 수집이 끝나면 Supabase 에 적재한다.
 *
 * 리포트만 만들고 멈추면 스토어는 여전히 옛 재고를 판다 — 수집의 목적이
 * 리포트가 아니라 **스토어 반영**이라면 여기까지가 한 회차다.
 *
 * 적재는 상위 프로젝트의 스크립트가 한다. 여기서 DB 를 직접 건드리면 스키마 지식이
 * 두 벌이 되고, 스크래퍼가 운영 DB 자격증명을 들고 다니게 된다.
 */
async function loadToSupabase(): Promise<void> {
  const app = fileURLToPath(runtime.paths.app);
  await new Promise<void>((resolve) => {
    const child = spawn('npm', ['run', 'db:stock-load', '--', '--commit'], {
      cwd: app,
      stdio: 'inherit',
    });
    /*
     * 적재가 실패해도 감시는 계속한다. 수집 자체는 성공했고 파일은 남아 있으니
     * 다음 회차나 손으로 다시 적재하면 된다 — 여기서 죽으면 그 뒤 회차가 통째로 멈춘다.
     */
    child.on('error', (err) => {
      log.error(`Supabase 적재를 시작하지 못했다: ${err.message}`);
      resolve();
    });
    child.on('close', (code) => {
      if (code !== 0) log.error(`Supabase 적재 실패 (종료 ${code}) — 수집분은 남아 있다`);
      resolve();
    });
  });
}

/**
 * 감시를 WSL 재시작마다 다시 켜지 않게 등록한다.
 *
 * 서비스 파일만 만들고 **켜지는 않는다.** 늘 도는 백그라운드 프로세스를 만드는
 * 일이라 마지막 한 줄은 사람이 친다.
 */
async function autostart(args: Args): Promise<void> {
  const cwd = process.cwd();
  const path = await installService({
    cwd,
    node: process.execPath,
    tsx: join(cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    everySec: args.everySec,
  });

  const user = userInfo().username;
  const linger = await lingerEnabled(user);
  const distro = process.env.WSL_DISTRO_NAME ?? 'Ubuntu-24.04';

  /*
   * ② 윈도우 쪽. 작업 스케줄러는 관리자 권한을 요구해 실패한다(실측) — 시작프로그램
   * 폴더에 넣는다. 사용자 소유라 권한이 필요 없고 여기서 바로 만들 수 있다.
   */
  const script = await installLogonScript(distro);
  const logon = script
    ? [
        '② 윈도우 — 로그온 때 WSL 자체를 띄운다  ✔ 이미 넣어 뒀다',
        '   WSL 은 터미널을 열기 전까지 아예 뜨지 않는다. 이게 없으면 ①은 소용없다.',
        `     ${script}`,
        '   빼려면 이 파일을 지우면 된다.',
      ]
    : [
        '② 윈도우 — 로그온 때 WSL 자체를 띄운다',
        '   시작프로그램 폴더를 찾지 못했다. 윈도우에서 Win+R → shell:startup 을 열고',
        `   ${LOGON_SCRIPT_NAME} 를 아래 내용으로 만들어라:`,
        '',
        `     CreateObject("WScript.Shell").Run "wsl.exe -d ${distro} -- true", 0, False`,
      ];

  log.ok(`서비스 파일을 만들었다: ${path}`);
  console.log();
  console.log(
    [
      '재부팅을 넘기려면 두 겹이 필요하다. 하나만 하면 안 돈다.',
      '',
      '① WSL 안 — 감시를 서비스로 켠다',
      `     systemctl --user enable --now ${SERVICE_NAME}`,
      ...(linger
        ? [`     (linger 는 이미 켜져 있다 — 터미널을 닫아도 계속 돈다)`]
        : [
            '',
            '   터미널을 닫아도 돌게 하려면 이것도 한 번:',
            `     loginctl enable-linger ${user}`,
          ]),
      '',
      ...logon,
      '',
      '확인',
      `     systemctl --user status ${SERVICE_NAME}`,
      `     tail -f data/watch.log`,
      '',
      '끄려면',
      `     systemctl --user disable --now ${SERVICE_NAME}`,
    ].join('\n'),
  );
  console.log();
}

/**
 * 재고 수집 관리 콘솔을 만든다.
 *
 * 상위 프로젝트 폴더에 둔다 — 상품을 등록하는 사람이 여는 곳이지
 * 수집기를 고치는 사람이 여는 곳이 아니기 때문이다.
 */
async function manage(): Promise<void> {
  /* 가장 최근 연동 파일에서 관측을 읽는다. 없으면 표에 '수집 전' 으로 뜬다. */
  let observations = new Map<string, { inStock: number; total: number; checkedAt: string | null }>();
  let snapshot: string | null = null;
  try {
    const files = (await readdir(DATA_DIR))
      .filter((f) => f.startsWith('연동-') && f.endsWith('.json'))
      .sort();
    const latest = files.at(-1);
    if (latest) {
      const payload = JSON.parse(await readFile(join(DATA_DIR, latest), 'utf8'));
      snapshot = payload?.meta?.snapshot ?? null;
      observations = observationsOf(payload?.variants ?? [], payload?.meta?.generatedAt ?? null);
    }
  } catch {
    log.info('연동 파일을 읽지 못했다 — 재고 열은 비워 둔다');
  }

  const { byHost, namesByHost, slugsByHost } = bookmarkletCatalog();
  const html = consolePage(buildConsoleData({ observations, snapshot }), {
    batch: batchBookmarkletSource(byHost, namesByHost, slugsByHost),
    single: bookmarkletSource(),
  });

  const out = join(fileURLToPath(runtime.paths.app), '재고관리.html');
  await writeFile(out, html, 'utf8');

  log.ok(`관리 콘솔: ${out}`);
  console.log(`    ${browserPath(out)}`);
  console.log('    브라우저로 열면 된다. 카탈로그가 바뀌면 이 명령을 다시 돌린다.');
}

/**
 * 수집 파일에서 고시 항목(소재·취급주의·원산지)을 뽑아 상위 프로젝트에 넘긴다.
 *
 * 재고 수집과 같은 방문에서 이미 걷어 온 값이라 여기서 네트워크를 쓰지 않는다.
 */
/**
 * 공식몰 PDP 를 상위 프로젝트의 상품 폴더로 받아 온다.
 *
 *   npm run intake -- <PDP URL> [...]                    새 상품 폴더를 만든다
 *   npm run intake -- <URL> --into="Beta AR Jacket Men's"  기존 상품에 색상을 더한다
 *   npm run intake -- <URL> --dry                        무엇을 할지만 보여 준다
 *
 * 받아 온 뒤 상위 프로젝트에서 `npm run catalog:import` 을 돌려야 카탈로그에 들어간다.
 */
async function intake(args: Args): Promise<void> {
  const urls = args.positionals;
  if (urls.length === 0) {
    log.error('공식몰 상품 URL 을 하나 이상 줘야 한다.\n  예: npm run intake -- https://outlet.arcteryx.com/ca/en/shop/mens/sabre-sv-jacket-9910');
    process.exitCode = 1;
    return;
  }

  log.step(`상품 폴더 받아 오기 (${urls.length}건)`);
  let failed = 0;

  for (const url of urls) {
    const r = await intakeProduct(url, { into: args.into ?? undefined, dryRun: args.dryRun });
    if (r.error) {
      log.warn(`${url}\n    ${r.error}`);
      failed += 1;
      continue;
    }
    const files = r.colours.reduce((n, c) => n + c.files.length, 0);
    log.info(`${r.productName} (${r.productCode ?? '코드 없음'}) → ${r.dir}`);
    for (const c of r.colours) {
      console.log(`      ${c.label.padEnd(24)} 이미지 ${String(c.files.length).padStart(2)}장 · ${c.cad === null ? 'CAD ?' : `CAD ${c.cad}`}`);
    }
    for (const s of r.skipped) log.warn(`    ${s}`);
    if (files === 0) failed += 1;
  }

  if (args.dryRun) {
    console.log('\n    --dry 라 아무것도 쓰지 않았다.');
    return;
  }
  if (failed > 0) process.exitCode = 1;
  console.log(
    '\n    상위 프로젝트에서 반영:\n' +
      '      npm run catalog:import       카탈로그·이미지 재생성\n' +
      '      npm run db:seed -- --commit  DB 반영',
  );
}

async function disclose(args: Args): Promise<void> {
  const dir = args.importDir ?? defaultDownloadsDir();
  const { count } = await writeDisclosure(dir);
  if (count === 0) {
    log.warn(
      '걷어 온 고시 항목이 없다.\n' +
        '  확장을 다시 만들어 크롬에서 새로고침한 뒤 한 번 더 수집해야 한다:\n' +
        '    npm run extension  →  chrome://extensions 에서 ⟳  →  지금 수집',
    );
    return;
  }
  console.log('    상위 프로젝트에서 반영: npm run catalog:import && npm run db:seed -- --commit');
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

/**
 * 북마클릿 수집 파일이 떨어지는 기본 위치.
 * WSL 에서는 브라우저가 Windows 쪽에서 돌기 때문에 리눅스 홈이 아니라
 * /mnt/c/Users/<사용자>/Downloads 에 저장된다.
 */
function defaultDownloadsDir(): string {
  /*
   * 윈도우 사용자명은 리눅스 사용자명과 다를 수 있다(실제로 달랐다).
   * 그래서 환경변수로 추측하지 않고 /mnt/c/Users 를 직접 훑는다.
   */
  const SYSTEM_PROFILES = new Set([
    'All Users',
    'Default',
    'Default User',
    'Public',
    'WsiAccount',
    'desktop.ini',
  ]);

  try {
    const candidates = readdirSync('/mnt/c/Users')
      .filter((name) => !SYSTEM_PROFILES.has(name))
      .map((name) => join('/mnt/c/Users', name, 'Downloads'))
      .filter((dir) => existsSync(dir));

    // 여러 계정이 있으면 최근에 쓴 쪽이 실사용 계정일 가능성이 높다
    const best = candidates
      .map((dir) => ({ dir, mtime: statSync(dir).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0];

    if (best) return best.dir;
  } catch {
    // WSL 이 아니거나 /mnt/c 가 없다 — 리눅스 홈으로 간다
  }

  return join(homedir(), 'Downloads');
}

/**
 * 북마클릿에 심을 카탈로그. `bookmarklet` 과 `stock` 이 **같은 함수**를 써야 한다 —
 * 심는 쪽과 대조하는 쪽이 갈리면 지문이 늘 어긋나 경고가 늑대소년이 된다.
 */
function bookmarkletCatalog(): {
  byHost: Record<string, string[]>;
  namesByHost: Record<string, string[]>;
  slugsByHost: Record<string, string[]>;
} {
  const targets = catalogTargets();
  const byHost: Record<string, string[]> = {};
  const namesByHost: Record<string, string[]> = {};
  const slugsByHost: Record<string, string[]> = {};

  for (const brand of ALL_BRAND_KEYS) {
    const mine = targets.filter((t) => t.brand === brand);
    if (mine.length === 0) continue;

    const codes = [...new Set(mine.flatMap((t) => t.codes))];
    const host = new URL(BRANDS[brand].ca.origin).hostname.replace(/^www\./, '');
    byHost[host] = codes;

    /*
     * 코드가 하나도 없는 브랜드는 이름으로 거른다. 그때 이름과 슬러그는
     * **같은 순서**여야 한다 — 북마클릿이 인덱스로 짝지어 "못 찾은 상품"을 보고한다.
     */
    const noCodes = codes.length === 0;
    /*
     * 성별을 붙인다. 카탈로그는 룰루레몬 남녀 조끼를 둘 다 같은 이름으로 들고 있어,
     * 그냥 찍으면 알림에 똑같은 줄이 두 번 뜬다.
     */
    const GENDER_KO = { men: '남성', women: '여성', unisex: '공용', kids: '키즈' } as const;
    namesByHost[host] = mine.map(
      (t) =>
        `${t.name} (${GENDER_KO[t.gender]})` +
        (noCodes || t.codes.length ? '' : ' — 코드 없음, 수집 불가'),
    );
    if (noCodes) slugsByHost[host] = mine.map((t) => nameSlug(t.name));
  }

  return { byHost, namesByHost, slugsByHost };
}

/**
 * 크롬 확장을 만들어 낸다.
 *
 * 북마클릿이 하는 일을 **같은 브라우저 안에서 타이머로** 돌린다.
 * 봇 방어를 지나는 것은 사용자의 진짜 브라우저 세션이기 때문이므로, 자동화는
 * 그 안에서만 성립한다(실측: 새 프로필 Playwright 는 헤드리스를 벗어도 막혔다).
 */
async function extension(args: Args): Promise<void> {
  const { dir, targets, missing, hosts, skipped, needDetails } = await buildExtension({
    fresh: args.fresh,
    all: args.allBrands,
  });

  const byBrand = new Map<string, number>();
  for (const t of targets) {
    byBrand.set(BRANDS[t.brand as BrandKey].labelKo, (byBrand.get(BRANDS[t.brand as BrandKey].labelKo) ?? 0) + 1);
  }

  console.log();
  printTable([
    ['브랜드', '페이지'],
    ...[...byBrand.entries()].map(([b, n]) => [b, String(n)]),
  ]);
  console.log();
  log.ok(`대상 ${targets.length}페이지 · 호스트 ${hosts.length}개`);

  if (needDetails > 0) {
    log.info(
      `고시 항목(소재·취급·원산지)이 빈 상품 ${needDetails}건은 페이지 구획도 함께 걷는다.\n` +
        '  소재는 안 바뀌므로 채워지면 다음 빌드에서 저절로 꺼진다 — 매 회차 다시 걷지 않는다.',
    );
  }

  if (skipped.length > 0) {
    log.info(
      `${skipped.join('·')}는 확장에 넣지 않았다 — 서버에서 그냥 받아진다.\n` +
        '  npm run stock:all 이 이 브랜드를 자동 수집하면서 확장이 받아 둔 파일도 함께 읽는다.\n' +
        '  (확장까지 열면 같은 페이지를 두 번 긁는다. 굳이 넣으려면 --all-brands)',
    );
  }

  if (missing.length > 0) {
    log.warn(`공식몰 URL 을 몰라 확장이 갈 수 없는 상품 ${missing.length}건`);
    for (const m of missing.slice(0, 6)) console.log(`    ${m.brand} ${m.name}`);
    if (missing.length > 6) console.log(`    … 외 ${missing.length - 6}건`);
    console.log('    북마클릿으로 한 번 받아 두면 URL 을 배우고, 그 다음부터 확장이 맡는다.');
  }

  console.log();
  console.log(
    [
      '설치 (한 번만)',
      '  1. 크롬 주소창에 chrome://extensions 입력',
      '  2. 오른쪽 위 "개발자 모드" 켜기',
      '  3. "압축해제된 확장 프로그램을 로드합니다" → 아래 폴더 선택',
      '',
      `     ${browserPath(dir)}`,
      '',
      '  4. 확장 아이콘을 눌러 주기를 고른다 (기본 6시간)',
      '',
      '카탈로그가 바뀌면 이 명령을 다시 돌리고 chrome://extensions 에서 새로고침(⟳).',
      '크롬이 켜져 있어야 돈다 — 꺼두면 그동안은 수집되지 않는다.',
      '',
      '받은 파일은 다운로드 폴더에 쌓인다. 터미널에서 한 번만 켜 두면',
      '수집이 끝나는 대로 파이프라인이 알아서 돈다:',
      '  npm run stock:watch',
      '',
      '한 번만 돌리려면 그대로:',
      '  npm run stock:all',
    ].join('\n'),
  );
  console.log();
}

async function bookmarklet(): Promise<void> {
  /*
   * 설치 페이지는 브라우저가 열 수 있는 곳에 둔다.
   * WSL 에서 브라우저는 Windows 쪽에서 돌기 때문에, 리눅스 홈에 두면
   * 경로를 손으로 옮겨 적어야 한다. 다운로드 폴더에 쓰는 편이 확실하다.
   */
  const dir = defaultDownloadsDir();
  const file = join(dir, 'ricky-북마클릿-설치.html');
  const winPath = toWindowsPath(file);

  try {
    await mkdir(dir, { recursive: true });
    /*
     * 사이트별 카탈로그 상품코드를 심는다.
     * 코드가 없는 브랜드(룰루레몬)에까지 필터를 걸면 전부 걸러져 0건이 되므로
     * 브랜드마다 따로 담고, 빈 목록은 "거르지 말라"는 뜻으로 쓴다.
     */
    const { byHost, namesByHost, slugsByHost } = bookmarkletCatalog();
    const targets = catalogTargets();
    const rows: string[][] = [['브랜드', '등록', '코드', '목록수집 동작']];

    for (const brand of ALL_BRAND_KEYS) {
      const mine = targets.filter((t) => t.brand === brand);
      if (mine.length === 0) {
        rows.push([BRANDS[brand].labelKo, '0', '-', '카탈로그에 없음 — 대상 아님']);
        continue;
      }
      const codes = [...new Set(mine.flatMap((t) => t.codes))];
      rows.push([
        BRANDS[brand].labelKo,
        String(mine.length),
        String(codes.length),
        codes.length === 0
          ? '등록 상품만 (이름으로 대조)'
          : codes.length < mine.length
            ? `등록 상품만 (코드 없는 ${mine.length - codes.length}건 제외)`
            : '등록 상품만',
      ]);
    }

    await writeFile(file, bookmarkletPage(byHost, namesByHost, slugsByHost), 'utf8');
    console.log();
    printTable(rows);
    console.log();
    console.log(bookmarkletHelp(winPath ?? file, dir));
  } catch {
    // 파일을 못 쓰면 코드라도 보여 준다
    console.log(bookmarkletHelp('(설치 페이지 생성 실패 — 아래 코드를 직접 북마크에 넣어라)', dir));
    console.log(bookmarkletSource());
  }
  console.log();
}

/**
 * 리눅스 경로를 윈도우 브라우저가 열 수 있는 형태로 바꾼다.
 *
 * WSL 안의 파일은 \\wsl.localhost\<배포판>\... 로 접근한다.
 * 이 변환이 없으면 리포트를 만들어 놓고 열 방법을 사람이 찾아야 한다.
 */
function browserPath(p: string): string {
  const win = toWindowsPath(p);
  if (win) return win;

  const distro = process.env.WSL_DISTRO_NAME;
  if (distro) return `\\\\wsl.localhost\\${distro}${p.replace(/\//g, '\\')}`;

  return p;
}

/** /mnt/c/... 를 윈도우 탐색기·브라우저가 아는 경로로 바꾼다. */
function toWindowsPath(p: string): string | null {
  const m = p.match(/^\/mnt\/([a-z])\/(.*)$/);
  if (!m) return null;
  return `${m[1]!.toUpperCase()}:\\${m[2]!.replace(/\//g, '\\')}`;
}

function help(): void {
  console.log(`
RICKY 소싱 리서치 파이프라인

  한국 인기도 신호 × 캐나다 공식몰 신제품 × CA/KR 가격 비교

사용법
  npm run doctor                     엔드포인트 생존 확인 (먼저 실행할 것)
  npm run stock:all                  자동 + 북마클릿을 한 번에 → 리포트 하나 (권장)
                                     등록된 상품만 조회한다
  npm run stock -- --brand=arcteryx,coach
                                     한 브랜드의 등록 상품만
  npm run stock:scan                 카탈로그 무시하고 사이트맵에서 훑는다 (탐색용)
  npm run stock -- --watch           watchlist.txt 의 URL 만 조회
  npm run bookmarklet                반자동 수집 북마클릿 설치 안내
  npm run extension                  크롬 확장 생성 (막힌 브랜드를 타이머로)
                                     --all-brands 면 자동 수집 브랜드까지 넣는다
  npm run stock -- --import          북마클릿 수집분 가져오기 (차단 브랜드용)
  npm run stock:watch                다운로드 폴더를 지켜보다 수집 파일이 떨어지면
                                     stock:all → Supabase 적재까지 자동으로 돌린다
                                     (--every=20 초 · --no-load 면 적재 생략)
  npm run autostart                  위 감시를 재부팅 후에도 자동으로 켜지게 등록
  npm run manage                     재고관리.html 생성 (공식몰 주소 넣는 곳)
  npm run intake -- <공식몰 상품 URL>  상품 폴더를 받아 온다 (이미지 + 가격.txt)
                                     --into="Beta AR Jacket Men's" 면 기존 상품에 색상만 더한다
                                     --dry 면 무엇을 받을지만 보여 준다
  npm run disclose                   고시 항목만 다시 추출 (stock:all 이 이미 한다)
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
  --watch[=파일]        재고 조회 대상을 URL 목록 파일로 지정 (기본 watchlist.txt)
  --import[=디렉터리]   북마클릿 수집 파일을 읽는다 (기본 다운로드 폴더)
  --all                 자동 수집 + 북마클릿 수집을 한 번에 돌려 리포트 하나로 합친다
  --no-catalog          카탈로그를 무시하고 사이트맵에서 훑는다 (탐색용)
                        기본은 상위 프로젝트에 등록된 상품만 조회한다
  --into=<폴더명>       intake 전용. 상품 폴더명을 직접 준다
  --dry                 intake 전용. 파일을 쓰지 않고 무엇을 할지만 보여 준다

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
      case 'stock':
        await stock(args);
        break;
      case 'bookmarklet':
        await bookmarklet();
        break;
      case 'intake':
        await intake(args);
        break;
      case 'disclose':
        await disclose(args);
        break;
      case 'manage':
        await manage();
        break;
      case 'autostart':
        await autostart(args);
        break;
      case 'watch':
        await watch(args);
        break;
      case 'extension':
        await extension(args);
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
