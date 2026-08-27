/**
 * Playwright 계층.
 *
 * lululemon / Canada Goose / Coach / Tommy 등은 평범한 HTTP 요청에 403·429를 준다.
 * 이 사이트들은 실제 브라우저 렌더링이 필요하므로 Chromium 으로 공개 PDP만 읽는다.
 * 로그인·장바구니·결제 경로는 어떤 경우에도 열지 않는다 (CLAUDE.md 규칙 8).
 *
 * 브라우저는 비싸다. 프로세스당 1개를 띄워 컨텍스트만 지역별로 나눠 쓴다.
 */
import type { Browser, BrowserContext, Page } from 'playwright';
import { runtime } from '../config/runtime.ts';
import { readCache, writeCache } from './cache.ts';
import { isAllowed, withPoliteness } from './politeness.ts';
import { log } from './logger.ts';

let browserPromise: Promise<Browser> | null = null;
const contexts = new Map<string, Promise<BrowserContext>>();

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import('playwright');
      const args = ['--disable-blink-features=AutomationControlled', '--no-sandbox'];

      /*
       * channel:'chromium' = 완전한 Chromium 의 신형 헤드리스 모드.
       *
       * Playwright 기본값은 chrome-headless-shell 인데, 이건 렌더러가 축약된
       * 별개 바이너리라 봇 탐지에 훨씬 쉽게 걸린다. 실측에서 lululemon 은
       * headless-shell 로는 ERR_HTTP2_PROTOCOL_ERROR 가 났지만
       * 신형 헤드리스로는 연결 자체는 성공했다.
       */
      try {
        log.info('Chromium 기동 (신형 헤드리스)');
        return await chromium.launch({ headless: true, channel: 'chromium', args });
      } catch {
        log.warn('신형 헤드리스 실행 실패 → 기본 headless-shell 로 전환');
        return chromium.launch({ headless: true, args });
      }
    })();
  }
  return browserPromise;
}

/** 지역별 컨텍스트. 로케일·타임존·통화 협상이 지역에 묶여 있는 사이트가 많다. */
async function getContext(region: 'CA' | 'KR'): Promise<BrowserContext> {
  const existing = contexts.get(region);
  if (existing) return existing;

  const p = (async () => {
    const browser = await getBrowser();
    const ctx = await browser.newContext({
      userAgent: runtime.userAgent,
      locale: region === 'CA' ? 'en-CA' : 'ko-KR',
      timezoneId: region === 'CA' ? 'America/Edmonton' : 'Asia/Seoul',
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        'accept-language': region === 'CA' ? 'en-CA,en;q=0.9' : 'ko-KR,ko;q=0.9,en;q=0.6',
      },
    });

    // 이미지·폰트·미디어는 가격 정보와 무관하다. 차단하면 상대 서버 부하와 실행 시간이 함께 줄어든다.
    await ctx.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'font' || type === 'media') return route.abort();
      return route.continue();
    });

    return ctx;
  })();

  contexts.set(region, p);
  return p;
}

export type RenderOptions = {
  region?: 'CA' | 'KR';
  fresh?: boolean;
  /** 이 셀렉터가 나타날 때까지 기다린다. 없으면 networkidle 로 판단. */
  waitForSelector?: string;
  /** 렌더 후 추가 대기(ms). 지연 로딩되는 가격 위젯 대응. */
  settleMs?: number;
  /** 페이지에서 직접 값을 뽑아야 할 때. 반환값은 캐시되지 않는다. */
  evaluate?: (page: Page) => Promise<unknown>;
};

const CACHE_SALT = 'pw';

/** 렌더링된 HTML 을 돌려준다. 캐시는 fetchText 와 동일한 정책을 쓴다. */
export async function renderHtml(url: string, opts: RenderOptions = {}): Promise<string> {
  if (!opts.fresh && !opts.evaluate) {
    const hit = await readCache(url, CACHE_SALT);
    if (hit !== null) return hit;
  }
  if (!(await isAllowed(url))) throw new Error(`robots.txt 가 차단한 경로다: ${url}`);

  return withPoliteness(url, async () => {
    const ctx = await getContext(opts.region ?? 'CA');
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: runtime.browserTimeoutMs });

      if (opts.waitForSelector) {
        /*
         * state:'attached' 가 핵심이다.
         * 기본값 'visible' 로 기다리면 <script type="application/ld+json"> 은
         * 절대 보이는 요소가 될 수 없어 매번 15초를 통째로 버린다.
         * (DOM 에는 이미 있는데도 타임아웃까지 기다리다 경고를 찍고 넘어갔다.)
         */
        await page
          .waitForSelector(opts.waitForSelector, { timeout: 15_000, state: 'attached' })
          .catch(() => log.warn(`셀렉터 미출현: ${opts.waitForSelector} (${url})`));
      } else {
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      }
      if (opts.settleMs) await page.waitForTimeout(opts.settleMs);

      const html = await page.content();
      if (!opts.evaluate) await writeCache(url, html, CACHE_SALT);
      return html;
    } finally {
      await page.close();
    }
  });
}

export async function tryRenderHtml(url: string, opts: RenderOptions = {}): Promise<string | null> {
  try {
    return await renderHtml(url, opts);
  } catch (err) {
    log.warn(`렌더 실패 ${url}`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * 브라우저 컨텍스트의 request 로 원문을 받는다.
 *
 * 렌더링 없이 바이트를 그대로 가져오되, 브라우저가 획득한 봇 검사 쿠키와
 * TLS 지문을 그대로 쓴다. 사이트맵 XML 처럼 렌더링이 필요 없으면서
 * 봇 차단에는 걸리는 자원에 쓴다 (랄프로렌 PerimeterX, 캐나다구스 429 등).
 */
export async function fetchViaBrowser(
  url: string,
  region: 'CA' | 'KR' = 'CA',
): Promise<string | null> {
  try {
    const ctx = await getContext(region);
    await warmUp(ctx, url, region);

    return await withPoliteness(url, async () => {
      const res = await ctx.request.get(url, { timeout: runtime.browserTimeoutMs });
      if (!res.ok()) {
        log.warn(`브라우저 요청 실패 ${res.status()} ${url}`);
        return null;
      }
      return res.text();
    });
  } catch (err) {
    log.warn(`브라우저 요청 오류 ${url}`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** 예열이 끝난 origin. 컨텍스트가 살아 있는 동안 유지된다. */
const warmedOrigins = new Set<string>();

/**
 * 봇 검사 쿠키를 확보한다.
 *
 * PerimeterX·Kasada 는 첫 페이지 방문에서 쿠키를 심고, 그 쿠키가 없는 요청은
 * 307 캡차로 되돌린다. request.get 은 컨텍스트 쿠키를 공유하므로
 * 홈을 한 번 열어 두면 이후 정적 자원 요청이 통과한다.
 */
async function warmUp(ctx: BrowserContext, url: string, region: 'CA' | 'KR'): Promise<void> {
  const origin = new URL(url).origin;
  if (warmedOrigins.has(origin)) return;
  warmedOrigins.add(origin);

  const page = await ctx.newPage();
  try {
    log.info(`  ${origin} 예열 (봇 검사 쿠키 확보)`);
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: runtime.browserTimeoutMs });
    // 챌린지 스크립트가 쿠키를 심을 시간을 준다.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1500);
  } catch (err) {
    log.warn(`  ${origin} 예열 실패`, err instanceof Error ? err.message : err);
  } finally {
    await page.close();
  }
  void region;
}

/** 파이프라인 종료 시 반드시 호출한다. 안 하면 프로세스가 남는다. */
export async function closeBrowser(): Promise<void> {
  for (const p of contexts.values()) {
    await (await p).close().catch(() => {});
  }
  contexts.clear();
  if (browserPromise) {
    // launch 가 실패했으면 browserPromise 자체가 rejected 다.
    // 여기서 await 하면 종료 경로에서 그 예외가 되살아난다.
    await browserPromise.then((b) => b.close()).catch(() => {});
    browserPromise = null;
  }
}

/** chromium 이 실제로 뜨는지 확인하고, 안 뜨면 무엇을 해야 하는지 알려준다. */
export async function browserStatus(): Promise<{ ok: boolean; hint: string }> {
  try {
    const b = await getBrowser();
    return { ok: b.isConnected(), hint: '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // WSL/슬림 컨테이너에서 가장 흔한 실패다. 바이너리는 받았는데 시스템 공유 라이브러리가 없다.
    if (/shared libraries|libnss3|libnspr4|libasound/.test(msg)) {
      return {
        ok: false,
        hint:
          '시스템 라이브러리가 없다. 한 번만 실행하면 된다(sudo 필요):\n' +
          '    sudo npx playwright install-deps chromium\n' +
          '  또는: sudo apt-get install -y libnss3 libnspr4 libasound2t64',
      };
    }
    if (/Executable doesn't exist|install/.test(msg)) {
      return { ok: false, hint: 'Chromium 미설치. `npm run browsers` 를 실행하라.' };
    }
    return { ok: false, hint: msg.split('\n')[0] ?? msg };
  }
}

export async function browserAvailable(): Promise<boolean> {
  return (await browserStatus()).ok;
}
