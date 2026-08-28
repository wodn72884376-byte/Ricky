/**
 * 상위 프로젝트(RICKY) 카탈로그를 재고 조회 대상으로 삼는다.
 *
 * 감시 목록을 따로 손으로 관리하면 반드시 카탈로그와 어긋난다 — 상품을 등록해도
 * 감시에 안 들어가고, 뺐는데 계속 조회한다. 등록된 상품이 곧 조회 대상이어야 한다.
 *
 * 연결 고리는 **SKU 접두어에 들어 있는 브랜드 상품코드**다.
 *   arcteryx   X000010932-GRAPHITE-BLACK  → X000010932  (JSON-LD productGroupID 와 동일)
 *   polo       100066198-CAMEL-MELANGE    → 100066198   (URL 의 /100066198.html)
 *   coach      CDZ42-BRASS-MAPLE          → CDZ42       (variant 스타일코드)
 *   lululemon  LULULEMON-FLAMINGO-FUN     → 없음        (이름으로만 대조 가능)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { CATALOG } from '@app/lib/catalog.generated.ts';
import { BRANDS } from '../config/brands.ts';
import { runtime } from '../config/runtime.ts';
import { log } from '../core/logger.ts';
import type { BrandKey } from '../core/types.ts';
import { collectFromSitemap } from '../extract/sitemap.ts';
import { jaccard, tokenize } from '../match/normalize.ts';
import { profileOf } from '../match/matcher.ts';
import type { ProductStock } from './types.ts';

const DATA_DIR = fileURLToPath(runtime.paths.data);
const LINK_FILE = 'supplier-urls.json';

export type CatalogTarget = {
  slug: string;
  brand: BrandKey;
  name: string;
  /** 남성/여성 동명 상품을 가르는 축. 이름만으로는 구분되지 않는다. */
  gender: 'men' | 'women' | 'unisex';
  /** SKU 접두어에서 뽑은 브랜드 상품코드. 없으면 빈 배열. */
  codes: string[];
  /** 해석된 캐나다 공식몰 URL. 못 찾았으면 null. */
  url: string | null;
  /**
   * 이름으로는 여러 건이 걸려 고르지 못한 URL 들. 사람이 골라
   * `data/supplier-urls.json` 에 적어 넣으면 다음 실행부터 그대로 쓴다.
   */
  candidates?: string[];
};

/** 브랜드 코드 체계가 없어 접두어가 브랜드명으로 채워진 경우를 걸러낸다. */
const BRAND_NOISE = new Set(['LULULEMON', 'ARCTERYX', 'COACH', 'POLO', 'TUMI']);

/** SKU 하나에서 브랜드 상품코드를 뽑는다. */
export function codeFromSku(sku: string): string | null {
  const head = sku.split('-')[0]?.trim().toUpperCase();
  if (!head || BRAND_NOISE.has(head)) return null;
  return /^[A-Z0-9]{4,12}$/.test(head) ? head : null;
}

/** 카탈로그에 등록된 조회 대상. brands 를 주면 그 브랜드만. */
export function catalogTargets(brands?: BrandKey[]): CatalogTarget[] {
  const want = brands ? new Set(brands) : null;

  return CATALOG.filter((p) => p.brandSlug in BRANDS)
    .filter((p) => !want || want.has(p.brandSlug as BrandKey))
    .map((p) => ({
      slug: p.slug,
      brand: p.brandSlug as BrandKey,
      name: p.name,
      gender: p.gender,
      codes: [...new Set(p.variants.map((v) => codeFromSku(v.sku)).filter((c): c is string => !!c))],
      url: null,
    }));
}

// ---------------------------------------------------------------------------
// URL 해석
// ---------------------------------------------------------------------------

/**
 * 상품코드가 사이트맵 URL 과 어떻게 이어지는지는 브랜드마다 다르다.
 *
 * 아크테릭스는 URL 에 코드 뒷 4자리만 남긴다(X000010932 → …-0932).
 * 코치·랄프로렌은 URL 끝에 코드가 그대로 붙는다(/CDZ42.html, /100066198.html).
 */
function urlMatcher(brand: BrandKey, code: string): (url: string) => boolean {
  if (brand === 'arcteryx') {
    const last4 = code.slice(-4);
    const rx = new RegExp(`-${last4}(?:[?#]|$)`);
    return (url) => rx.test(url);
  }
  return (url) => url.toUpperCase().endsWith(`/${code}.HTML`);
}

/**
 * 아크테릭스 이름 기반 후보.
 *
 * 아크테릭스는 **시즌마다 상품코드가 바뀐다.** 같은 Beta Jacket 이 S26 은 X000010511,
 * F26 은 X000010878 이다(실측: 원본 폴더에 두 코드의 이미지가 함께 있다).
 * 카탈로그에 F26 코드가 들어 있는데 사이트맵에는 아직 S26 URL 만 있으면
 * 끝 4자리 대조가 통째로 빗나가고, 그 상품은 조용히 조회 대상에서 빠진다.
 *
 * 그래서 코드가 안 맞으면 `/{성별}/{상품명 슬러그}-4자리` 로 후보를 찾는다.
 * **후보가 둘 이상이면 고르지 않는다.** 시즌이 다른 두 URL 중 아무거나 집으면
 * 엉뚱한 상품의 재고를 이 상품 것으로 보고하게 된다.
 */
export function arcteryxNameCandidates(name: string, gender: string, urls: string[]): string[] {
  const slug = name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const seg = gender === 'women' ? 'womens' : gender === 'men' ? 'mens' : '[a-z]+';
  const rx = new RegExp(`/${seg}/${slug}-\\d{4}$`);
  return urls.filter((u) => rx.test(u));
}

type LinkCache = Record<string, { url: string; resolvedAt: string; via: string }>;

async function loadLinks(): Promise<LinkCache> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, LINK_FILE), 'utf8')) as LinkCache;
  } catch {
    return {};
  }
}

async function saveLinks(cache: LinkCache): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(join(DATA_DIR, LINK_FILE), JSON.stringify(cache, null, 2), 'utf8');
}

/**
 * 카탈로그 상품의 캐나다 공식몰 URL 을 찾아 채운다.
 *
 * 사이트맵을 브랜드당 한 번만 읽고 결과를 파일에 남긴다 — 매 실행마다 4만 건짜리
 * XML 을 다시 받을 이유가 없고, 상대 서버에도 부담이다.
 */
export async function resolveTargetUrls(
  targets: CatalogTarget[],
  opts: { fresh?: boolean } = {},
): Promise<CatalogTarget[]> {
  const cache = await loadLinks();
  /*
   * --fresh 는 자동 해석 결과만 버린다. 사람이 supplier-urls.json 에 손으로 적어 넣은
   * URL(via:'manual')은 자동 해석이 못 푸는 상품의 유일한 답이므로 지우면 안 된다.
   */
  const pinned = (slug: string) => (cache[slug]?.via === 'manual' ? (cache[slug]?.url ?? null) : null);
  const out = targets.map((t) => ({
    ...t,
    url: opts.fresh ? pinned(t.slug) : (cache[t.slug]?.url ?? null),
  }));

  const byBrand = new Map<BrandKey, CatalogTarget[]>();
  for (const t of out) {
    if (t.url || t.codes.length === 0) continue;
    const list = byBrand.get(t.brand) ?? [];
    list.push(t);
    byBrand.set(t.brand, list);
  }

  for (const [brand, pending] of byBrand) {
    const site = BRANDS[brand].ca;
    if (site.sitemapUrls.length === 0) continue;

    let entries: Array<{ url: string }> = [];
    for (const sm of site.sitemapUrls) {
      entries = await collectFromSitemap(sm, {
        match: site.isProductUrl,
        followIndex: site.followSitemap,
        limit: 60_000,
        browserFallback: site.transport === 'browser',
        region: 'CA',
      });
      if (entries.length > 0) break;
    }
    if (entries.length === 0) {
      log.warn(`  ${BRANDS[brand].labelKo}: 사이트맵을 읽지 못해 URL 해석을 건너뛴다`);
      continue;
    }

    let found = 0;
    for (const t of pending) {
      for (const code of t.codes) {
        const match = entries.find((e) => urlMatcher(brand, code)(e.url));
        if (match) {
          t.url = match.url;
          cache[t.slug] = { url: match.url, resolvedAt: new Date().toISOString(), via: 'sitemap' };
          found += 1;
          break;
        }
      }
      if (t.url || brand !== 'arcteryx') continue;

      // 코드가 안 맞았다 — 시즌 코드 교체일 수 있으니 이름으로 후보를 본다.
      const cands = arcteryxNameCandidates(
        t.name,
        t.gender,
        entries.map((e) => e.url),
      );
      if (cands.length === 1) {
        t.url = cands[0]!;
        cache[t.slug] = { url: cands[0]!, resolvedAt: new Date().toISOString(), via: 'name' };
        found += 1;
        log.warn(
          `  ${t.name}: 코드 ${t.codes.join(',')} 가 사이트맵에 없어 이름으로 찾았다 → ${cands[0]}`,
        );
      } else if (cands.length > 1) {
        t.candidates = cands;
        log.warn(
          `  ${t.name}: 코드 ${t.codes.join(',')} 가 사이트맵에 없고 이름 후보가 ${cands.length}건이라 고르지 않는다 — ${cands.join(' | ')}`,
        );
      }
    }
    log.info(`  ${BRANDS[brand].labelKo}: 카탈로그 ${pending.length}건 중 ${found}건 URL 해석`);
  }

  await saveLinks(cache);
  return out;
}

/**
 * 북마클릿으로 수집한 상품에서 URL 을 배운다.
 *
 * 폴로처럼 사이트맵이 막힌 브랜드는 사람이 실제로 연 페이지가 유일한 URL 출처다.
 * 한 번 수집하면 다음부터 카탈로그 대조에 쓸 수 있다.
 */
export async function learnUrls(stocks: ProductStock[], targets: CatalogTarget[]): Promise<number> {
  const cache = await loadLinks();
  let learned = 0;

  for (const s of stocks) {
    if (s.error || cache[matchKeyOf(s, targets) ?? '']) continue;
    const t = matchToCatalog(s, targets);
    if (!t || cache[t.slug]) continue;
    cache[t.slug] = { url: s.productUrl, resolvedAt: new Date().toISOString(), via: 'bookmarklet' };
    learned += 1;
  }

  if (learned > 0) await saveLinks(cache);
  return learned;
}

const matchKeyOf = (s: ProductStock, targets: CatalogTarget[]) =>
  matchToCatalog(s, targets)?.slug ?? null;

// ---------------------------------------------------------------------------
// 대조
// ---------------------------------------------------------------------------

/**
 * 이름만으로 붙일 때의 기준.
 *
 * 코드가 없으면 이름이 유일한 근거인데, 그만큼 엄격해야 한다.
 * 실측 사고: "Fast and Free Running Belt" 가 "Fast and Free Trail Running Vest" 에
 * 0.71 로 붙었다 — 벨트와 조끼는 다른 상품이다.
 * 자카드 0.8 이면 사실상 같은 이름일 때만 통과한다(위 사례는 0.57).
 */
const NAME_THRESHOLD = 0.8;

/** 상품명·URL 에서 성별을 읽는다. 모르면 null. */
export function genderOf(text: string): 'men' | 'women' | null {
  const t = text.toLowerCase();
  // women 을 먼저 본다 — "women" 안에 "men" 이 들어 있다.
  if (/wom[ea]n|여성|ladies/.test(t)) return 'women';
  if (/\bmens?\b|men'?s|남성/.test(t)) return 'men';
  return null;
}

/**
 * 수집 결과 1건이 카탈로그의 어느 상품인지 찾는다.
 *
 * 코드 대조가 1순위다. 코치는 페이지 URL 코드(CAD75)와 카탈로그 코드(CDZ42)가
 * 다를 수 있어 variant 스타일코드까지 본다. 코드가 아예 없는 브랜드만 이름으로 붙인다.
 */
export function matchToCatalog(
  stock: ProductStock,
  targets: CatalogTarget[],
): CatalogTarget | null {
  const mine = targets.filter((t) => t.brand === stock.brand);
  if (mine.length === 0) return null;

  const byUrl = mine.find((t) => t.url && t.url === stock.productUrl);
  if (byUrl) return byUrl;

  const codes = new Set<string>();
  if (stock.productCode) codes.add(stock.productCode.toUpperCase());
  for (const r of stock.rows) {
    if (r.styleCode) codes.add(r.styleCode.toUpperCase());
    const fromSku = r.sku ? codeFromSku(r.sku.replace(/\s+/g, '-')) : null;
    if (fromSku) codes.add(fromSku);
  }

  if (codes.size > 0) {
    const byCode = mine.find((t) => t.codes.some((c) => codes.has(c.toUpperCase())));
    if (byCode) return byCode;
  }

  /*
   * 코드 체계가 있는 브랜드는 코드로만 붙인다.
   *
   * 이름 유사도로 물러나면 안 된다 — 폴로는 상품명이 전부 "Cable-Knit Cotton …" 이라
   * 실측에서 650001 이 515061 페이지에, 100066187 이 625238 페이지에 잘못 붙었다.
   * 코드가 안 맞으면 "카탈로그에 없는 상품"이 맞고, 그렇게 보고해야 사람이 알아챈다.
   */
  const codeSystemExists = codes.size > 0 && mine.some((t) => t.codes.length > 0);
  if (codeSystemExists) return null;

  const profile = profileOf(BRANDS[stock.brand]);
  const tokens = tokenize(stock.productName, profile.aliases, profile.drop);

  /*
   * 성별이 다르면 이름이 같아도 다른 상품이다.
   * 룰루레몬은 남성판·여성판 이름이 똑같아서, 이걸 안 보면 둘이 동점이 되고
   * 먼저 나온 쪽에 임의로 붙는다.
   */
  const stockGender = genderOf(`${stock.productName} ${stock.productUrl}`);

  let best: CatalogTarget | null = null;
  let bestScore = 0;
  let tied = false;

  for (const t of mine) {
    if (stockGender && t.gender !== 'unisex' && t.gender !== stockGender) continue;

    const score = jaccard(tokens, tokenize(t.name, profile.aliases, profile.drop));
    if (score > bestScore + 0.01) {
      bestScore = score;
      best = t;
      tied = false;
    } else if (Math.abs(score - bestScore) <= 0.01 && best && t !== best) {
      tied = true;
    }
  }

  // 동점이면 무엇을 고르든 근거가 없다. 붙이지 않고 미수집으로 남긴다.
  if (tied || bestScore < NAME_THRESHOLD) return null;
  return best;
}

export type CatalogCoverage = {
  covered: Array<{ target: CatalogTarget; stock: ProductStock }>;
  missing: CatalogTarget[];
  /** 카탈로그에 없는데 수집된 것 — 목록수집이 주변 상품까지 담아 온 경우 */
  extra: ProductStock[];
};

/** 카탈로그 대비 수집 현황. 무엇을 더 받아와야 하는지 알려 준다. */
export function coverage(stocks: ProductStock[], targets: CatalogTarget[]): CatalogCoverage {
  const covered: CatalogCoverage['covered'] = [];
  const extra: ProductStock[] = [];
  const hit = new Set<string>();

  for (const s of stocks) {
    const t = s.error ? null : matchToCatalog(s, targets);
    if (t) {
      // 같은 카탈로그 상품이 여러 번 잡히면 variant 가 많은 쪽을 남긴다.
      const prev = covered.find((c) => c.target.slug === t.slug);
      if (prev) {
        if (s.rows.length > prev.stock.rows.length) prev.stock = s;
      } else {
        covered.push({ target: t, stock: s });
      }
      hit.add(t.slug);
    } else if (!s.error) {
      extra.push(s);
    }
  }

  return { covered, missing: targets.filter((t) => !hit.has(t.slug)), extra };
}
