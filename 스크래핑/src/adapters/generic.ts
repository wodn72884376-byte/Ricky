/**
 * 범용 어댑터 — 사이트맵 발견 + JSON-LD 추출.
 *
 * 7개 브랜드 중 6개가 이 하나로 커버된다. 브랜드별 코드를 7벌 쓰지 않는 이유는
 * CSS 셀렉터가 분기마다 깨지는 반면 schema.org 마크업은 SEO 자산이라 잘 바뀌지 않기 때문이다.
 * 이 경로가 실패하는 브랜드만 별도 어댑터를 둔다.
 */
import type { BrandConfig, SiteConfig } from '../config/brands.ts';
import { runtime } from '../config/runtime.ts';
import { renderHtml, tryRenderHtml } from '../core/browser.ts';
import { tryFetchText } from '../core/fetcher.ts';
import { log } from '../core/logger.ts';
import type { Listing, Region } from '../core/types.ts';
import { blockLabel, detectBlockPage } from '../extract/blockpage.ts';
import { extractOpenGraph, extractProduct } from '../extract/jsonld.ts';
import { byNewest, collectFromSitemap, isRecent, sitemapsFromRobots } from '../extract/sitemap.ts';
import type { BrandAdapter, DiscoverOptions } from './types.ts';

const currencyFor = (region: Region): 'CAD' | 'KRW' => (region === 'CA' ? 'CAD' : 'KRW');

/** 사이트맵에서 읽어들일 상품 URL 상한. 최대 카탈로그(아크테릭스 45k)를 덮는다. */
const SITEMAP_SCAN_CAP = 60_000;

/** transport 설정에 따라 HTTP 또는 브라우저로 HTML 을 가져온다. */
async function getHtml(
  site: SiteConfig,
  url: string,
  region: Region,
  fresh?: boolean,
): Promise<{ html: string; mode: 'http' | 'browser' } | null> {
  if (site.transport === 'http') {
    const res = await tryFetchText(url, { fresh });
    // 차단 페이지도 200 으로 온다. 내용을 확인하지 않으면 캡차를 상품으로 파싱하려 든다.
    if (res && detectBlockPage(res.body) === null) return { html: res.body, mode: 'http' };
    log.info(`  HTTP 실패/차단 → 브라우저 재시도: ${url}`);
  }

  const html = await tryRenderHtml(url, {
    region,
    fresh,
    waitForSelector: site.pdpWaitSelector,
    settleMs: 400,
  });
  if (!html) return null;

  const blocked = detectBlockPage(html);
  if (blocked !== null) {
    log.warn(`  ${blockLabel(blocked)} → 수집 불가: ${url}`);
    return null;
  }
  return { html, mode: 'browser' };
}

export function createGenericAdapter(cfg: BrandConfig): BrandAdapter {
  const siteFor = (region: Region): SiteConfig | null => (region === 'CA' ? cfg.ca : cfg.kr);

  return {
    brand: cfg.key,

    async discover(region, opts: DiscoverOptions) {
      const site = siteFor(region);
      if (!site) return [];

      // robots 선언 사이트맵을 먼저 쓰고, 없으면 설정에 적힌 후보를 순서대로 시도한다.
      const declared = await sitemapsFromRobots(site.origin);
      const candidates = [...declared, ...site.sitemapUrls];

      for (const sitemapUrl of candidates) {
        const entries = await collectFromSitemap(sitemapUrl, {
          match: site.isProductUrl,
          followIndex: site.followSitemap,
          /*
           * 카탈로그 전체를 받아야 한다.
           * lastmod 정렬 전에 잘라내면 "신제품"이 카탈로그 앞부분의 최신일 뿐,
           * 진짜 최신이 아니게 된다. XML 은 어차피 한 번에 내려받으므로
           * 여기서 아끼는 건 파싱 비용뿐이고, 정확도를 잃을 이유가 없다.
           */
          limit: SITEMAP_SCAN_CAP,
          fresh: opts.fresh,
          // 봇 차단 사이트는 사이트맵 XML 조차 HTTP 로는 막힌다(랄프로렌·캐나다구스).
          browserFallback: site.transport === 'browser',
          region,
        });
        if (entries.length === 0) continue;

        log.info(`  사이트맵 ${sitemapUrl} → 상품 URL ${entries.length}건`);

        const sorted = entries.sort(byNewest);
        const filtered = opts.newOnly
          ? sorted.filter((e) => isRecent(e.lastModified, runtime.newProductWindowDays))
          : sorted;

        // newOnly 인데 lastmod 가 아예 없는 사이트맵이면 필터가 전부 걸러낸다 → 정렬만 적용한다.
        const chosen = filtered.length > 0 ? filtered : sorted;
        return chosen.slice(0, opts.limit);
      }

      log.warn(`  ${cfg.label} ${region}: 사이트맵에서 상품 URL 을 찾지 못했다`);
      return [];
    },

    async fetchListing(url, region, opts = {}) {
      const site = siteFor(region);
      if (!site) return null;

      const got = await getHtml(site, url, region, opts.fresh);
      if (!got) return null;

      const expected = currencyFor(region);
      const product = extractProduct(got.html, expected);

      if (!product) {
        // JSON-LD 가 없으면 OpenGraph 로 최소한 이름·가격이라도 건진다.
        const og = extractOpenGraph(got.html, expected);
        if (!og) return null;
        return {
          brand: cfg.key,
          region,
          url,
          productCode: site.productCodeFromUrl?.(url) ?? null,
          name: og.name,
          rawName: og.name,
          category: cfg.defaultCategory,
          currency: expected,
          priceMinor: og.priceMinor,
          listPriceMinor: null,
          onSale: false,
          availability: 'unknown',
          originCountryHint: null,
          releaseDate: null,
          lastModified: opts.lastModified ?? null,
          imageUrl: null,
          variants: [],
          fetchedAt: new Date().toISOString(),
          fetchMode: got.mode,
        };
      }

      // 통화 검증 — CAD 가 아닌 CA 수집분은 무효다 (PROJECT.md §6.3 4번).
      if (product.currency && product.currency !== expected) {
        log.warn(`  통화 불일치(${product.currency} != ${expected}) → 폐기: ${url}`);
        return null;
      }

      const listPrice = product.listPriceMinor;
      return {
        brand: cfg.key,
        region,
        url,
        productCode: product.productCode ?? site.productCodeFromUrl?.(url) ?? null,
        name: product.name,
        rawName: product.name,
        category: product.category ?? cfg.defaultCategory,
        currency: expected,
        priceMinor: product.priceMinor,
        listPriceMinor: listPrice,
        onSale: listPrice !== null && product.priceMinor !== null && listPrice > product.priceMinor,
        availability: product.availability,
        originCountryHint: product.originCountryHint,
        releaseDate: product.releaseDate,
        lastModified: opts.lastModified ?? null,
        imageUrl: product.imageUrl,
        variants: product.variants,
        fetchedAt: new Date().toISOString(),
        fetchMode: got.mode,
      };
    },

    async searchKr(query, opts = {}) {
      const site = cfg.kr;
      if (!site?.searchUrl) return null;

      const searchUrl = site.searchUrl(query);
      const html =
        site.transport === 'http'
          ? ((await tryFetchText(searchUrl, { fresh: opts.fresh }))?.body ??
            (await tryRenderHtml(searchUrl, { region: 'KR', fresh: opts.fresh })))
          : await tryRenderHtml(searchUrl, {
              region: 'KR',
              fresh: opts.fresh,
              settleMs: 1200,
            });

      if (!html) return null;

      // 검색 결과 페이지 자체가 첫 상품의 JSON-LD 를 품고 있는 경우가 있다.
      const inline = extractProduct(html, 'KRW');
      if (inline?.priceMinor) {
        return {
          brand: cfg.key,
          region: 'KR' as const,
          url: searchUrl,
          productCode: inline.productCode,
          name: inline.name,
          rawName: inline.name,
          category: inline.category ?? cfg.defaultCategory,
          currency: 'KRW' as const,
          priceMinor: inline.priceMinor,
          listPriceMinor: inline.listPriceMinor,
          onSale: false,
          availability: inline.availability,
          originCountryHint: inline.originCountryHint,
          releaseDate: inline.releaseDate,
          lastModified: null,
          imageUrl: inline.imageUrl,
          variants: inline.variants,
          fetchedAt: new Date().toISOString(),
          fetchMode: site.transport,
        };
      }

      // 아니면 결과에서 첫 상품 링크를 뽑아 PDP 를 연다.
      const href = firstProductHref(html, site);
      if (!href) return null;

      const abs = new URL(href, site.origin).toString();
      return this.fetchListing(abs, 'KR', { fresh: opts.fresh });
    },
  };
}

/** 검색 결과 HTML 에서 첫 상품 링크를 추출한다. 정규식으로 충분한 단순 작업이다. */
function firstProductHref(html: string, site: SiteConfig): string | null {
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (!href || href.startsWith('#')) continue;
    let abs: string;
    try {
      abs = new URL(href, site.origin).toString();
    } catch {
      continue;
    }
    if (site.isProductUrl(abs)) return abs;
  }
  return null;
}
