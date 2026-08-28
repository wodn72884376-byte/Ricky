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
import { isAbsolute, join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';

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
import {
  catalogTargets,
  coverage,
  learnUrls,
  resolveTargetUrls,
  type CatalogTarget,
} from './stock/catalog.ts';
import { collectReports, renderDashboard } from './stock/dashboard.ts';
import type { ProductStock, StockRow } from './stock/types.ts';
import { bookmarkletHelp, bookmarkletPage, bookmarkletSource } from './stock/bookmarklet.ts';
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
  /** 상위 프로젝트 카탈로그에 등록된 상품만 조회한다. */
  catalog: boolean;
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
    watchFile: flags.get('watch') === 'true' ? 'watchlist.txt' : (flags.get('watch') ?? null),
    importDir: flags.get('import') === 'true' ? defaultDownloadsDir() : (flags.get('import') ?? null),
    all: flags.get('all') === 'true',
    catalog: flags.get('catalog') === 'true',
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

    const resolved = targets.filter((t) => t.url);
    watchUrls = resolved.map((t) => t.url!);
    log.ok(`  공식몰 URL 확보 ${resolved.length}/${targets.length}건`);
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
      results.push(...(await importCaptures(dir)));
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
      missing: missing.map((m) => ({
        brand: m.brand,
        name: m.name,
        codes: m.codes,
        candidates: m.candidates,
      })),
    }),
    'utf8',
  );
  await writeFile(mdPath, md, 'utf8');
  await writeFile(csvPath, toStockCsv(rows), 'utf8');
  await writeFile(
    jsonPath,
    JSON.stringify({ meta: { startedAt, tag }, results, events, rows }, null, 2),
    'utf8',
  );

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
    const targets = catalogTargets();
    const byHost: Record<string, string[]> = {};
    const namesByHost: Record<string, string[]> = {};
    const rows: string[][] = [['브랜드', '등록', '코드', '목록수집 동작']];

    for (const brand of ALL_BRAND_KEYS) {
      const mine = targets.filter((t) => t.brand === brand);
      if (mine.length === 0) {
        rows.push([BRANDS[brand].labelKo, '0', '-', '카탈로그에 없음 — 대상 아님']);
        continue;
      }
      const codes = [...new Set(mine.flatMap((t) => t.codes))];
      const host = new URL(BRANDS[brand].ca.origin).hostname.replace(/^www\./, '');
      byHost[host] = codes;
      namesByHost[host] = mine.map((t) => `${t.name}${t.codes.length ? '' : ' (코드 없음 — 수집 불가)'}`);
      rows.push([
        BRANDS[brand].labelKo,
        String(mine.length),
        String(codes.length),
        codes.length === 0
          ? '목록 전체를 담고 이름으로 대조'
          : codes.length < mine.length
            ? `등록 상품만 (코드 없는 ${mine.length - codes.length}건 제외)`
            : '등록 상품만',
      ]);
    }

    await writeFile(file, bookmarkletPage(byHost, namesByHost), 'utf8');
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
  npm run stock -- --brand=arcteryx,coach --limit=10
                                     캐나다 공식몰 재고 조회 (색상 × 사이즈)
  npm run stock:catalog              상위 프로젝트에 등록된 상품만 조회 (권장)
  npm run stock:all                  자동 + 북마클릿을 한 번에 → 리포트 하나
  npm run stock -- --watch           watchlist.txt 의 URL 만 조회
  npm run bookmarklet                반자동 수집 북마클릿 설치 안내
  npm run stock -- --import          북마클릿 수집분 가져오기 (차단 브랜드용)
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
  --catalog             상위 프로젝트 카탈로그에 등록된 상품만 조회한다

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
