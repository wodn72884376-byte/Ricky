/**
 * 파이프라인 오케스트레이션.
 *
 *   [1] 한국 인기도 신호 (네이버)
 *   [2] 캐나다 공식몰 카탈로그 + 신제품
 *   [3] 매칭 (상품코드 → 이름 유사도)
 *   [4] 한국 가격 수집 (공식몰 + 네이버쇼핑 최저가)
 *   [5] 가격 비교 · 마진 산출
 */
import { computeSalePrice } from '@app/lib/pricing/index.ts';
import { getAdapter } from './adapters/index.ts';
import { BRANDS } from './config/brands.ts';
import { runtime } from './config/runtime.ts';
import { log } from './core/logger.ts';
import type { BrandKey, BrandRunResult, ComparisonRow, Listing } from './core/types.ts';
import { isRecent } from './extract/sitemap.ts';
import { getFxSnapshot, type FxSnapshot } from './fx/rates.ts';
import { matchListing, matchObserved, profileOf, rankCaByKoreanDemand } from './match/matcher.ts';
import {
  collectBrandSignals,
  KR_LOWEST_UNAVAILABLE_REASON,
  type BrandSignals,
} from './signals/collect.ts';
import { scorePopularity } from './signals/popularity.ts';

export type ScanOptions = {
  brands: BrandKey[];
  /** 브랜드당 수집할 CA 상품 수 */
  limit: number;
  /** 신제품만 */
  newOnly: boolean;
  /** 캐시 무시 */
  fresh: boolean;
  /** 인기도 신호 수집 생략 (네이버 키가 없을 때) */
  skipSignals: boolean;
  /** 한국 공식몰 수집 생략 */
  skipKr: boolean;
};

export type ScanResult = {
  results: BrandRunResult[];
  signalsByBrand: Map<string, BrandSignals>;
  fx: FxSnapshot;
  startedAt: string;
  durationMs: number;
};

export async function runScan(opts: ScanOptions): Promise<ScanResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  const fx = await getFxSnapshot();
  log.ok(`환율 스냅샷 CAD/KRW ${fx.cadKrw.toFixed(2)} (${fx.source})`);

  const results: BrandRunResult[] = [];
  const signalsByBrand = new Map<string, BrandSignals>();

  for (const brand of opts.brands) {
    const cfg = BRANDS[brand];
    log.step(`${cfg.labelKo} (${cfg.label})`);

    const result: BrandRunResult = {
      brand,
      caListings: [],
      krListings: [],
      rows: [],
      errors: [],
    };

    // --- [1] 한국 인기도 신호 -------------------------------------------------
    let signals: BrandSignals | null = null;
    if (!opts.skipSignals) {
      try {
        signals = await collectBrandSignals(brand);
        signalsByBrand.set(brand, signals);
        const top = [...signals.scores].sort((a, b) => b.score - a.score)[0];
        log.ok(`  인기 신호 ${signals.signals.length}건 · 관측 상품 ${signals.observedProducts.length}개${top ? ` · 최고 "${top.query}" ${top.score}점` : ''}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`인기도 신호 수집 실패: ${msg}`);
        log.warn(`  인기 신호 실패: ${msg}`);
      }
    }

    // --- [2] 캐나다 공식몰 카탈로그 -------------------------------------------
    const adapter = getAdapter(brand);
    let discovered: Array<{ url: string; lastModified: string | null }> = [];
    try {
      discovered = await adapter.discover('CA', {
        limit: opts.limit,
        newOnly: opts.newOnly,
        fresh: opts.fresh,
      });
      log.ok(`  CA 상품 URL ${discovered.length}건 발견`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`CA 카탈로그 발견 실패: ${msg}`);
      log.error(`  CA 발견 실패: ${msg}`);
    }

    for (const entry of discovered) {
      try {
        const listing = await adapter.fetchListing(entry.url, 'CA', {
          fresh: opts.fresh,
          lastModified: entry.lastModified,
        });
        if (listing) result.caListings.push(listing);
        else result.errors.push(`CA 파싱 실패(상품 데이터 없음): ${entry.url}`);
      } catch (err) {
        result.errors.push(`CA 수집 실패 ${entry.url}: ${err instanceof Error ? err.message : err}`);
      }
    }
    log.ok(`  CA 상품 ${result.caListings.length}건 수집`);

    // --- [3] 한국 수요가 높은 순으로 CA 상품 정렬 -------------------------------
    const observed = signals?.observedProducts ?? [];
    const demandRanked =
      observed.length > 0
        ? rankCaByKoreanDemand(observed, result.caListings, profileOf(cfg), opts.limit)
        : [];

    // 수요 매칭이 된 상품을 앞에, 나머지를 뒤에 둔다.
    const demandUrls = new Set(demandRanked.map((d) => d.listing.url));
    const ordered = [
      ...demandRanked.map((d) => d.listing),
      ...result.caListings.filter((l) => !demandUrls.has(l.url)),
    ];

    // --- [4][5] 한국 가격 수집 + 비교 ------------------------------------------
    const krIndex = opts.skipKr ? new Map<string, string>() : await buildKrCodeIndex(brand, adapter, opts.fresh);
    if (krIndex.size > 0) log.ok(`  KR 상품코드 인덱스 ${krIndex.size}건 (정확 매칭 가능)`);

    for (const ca of ordered) {
      const row = await buildRow(ca, {
        brand,
        adapter,
        observed,
        signals,
        fx,
        skipKr: opts.skipKr,
        fresh: opts.fresh,
        errors: result.errors,
        krIndex,
        krListings: result.krListings,
      });
      result.rows.push(row);
    }

    const compared = result.rows.filter((r) => r.savingRate !== null).length;
    log.ok(`  가격 비교 성립 ${compared}/${result.rows.length}건`);
    results.push(result);
  }

  return { results, signalsByBrand, fx, startedAt, durationMs: Date.now() - t0 };
}

// ---------------------------------------------------------------------------

/**
 * 한국 공식몰 사이트맵에서 {상품코드 → URL} 인덱스를 만든다.
 *
 * Coach·랄프로렌·TUMI 는 CA 와 KR 이 같은 상품 ID 를 쓴다
 * (예: Coach 916.html 이 ca.coach.com 과 korea.coach.com 양쪽에 존재).
 * 이 경우 이름으로 검색해 맞히는 것보다 ID 로 직접 여는 쪽이 훨씬 정확하고 요청도 적다.
 * 사이트맵 1회 조회로 인덱스를 만든 뒤, 실제로 비교할 상품의 PDP 만 연다.
 */
async function buildKrCodeIndex(
  brand: BrandKey,
  adapter: ReturnType<typeof getAdapter>,
  fresh: boolean,
): Promise<Map<string, string>> {
  const site = BRANDS[brand].kr;
  const index = new Map<string, string>();
  if (!site || site.sitemapUrls.length === 0 || !site.productCodeFromUrl) return index;

  try {
    const entries = await adapter.discover('KR', { limit: 50_000, fresh });
    for (const e of entries) {
      const code = site.productCodeFromUrl(e.url);
      // 먼저 나온 URL 을 유지한다. 사이트맵은 대개 정본을 앞에 둔다.
      if (code && !index.has(code)) index.set(code, e.url);
    }
  } catch {
    // 인덱스가 없으면 검색 경로로 넘어간다. 파이프라인을 멈출 이유는 아니다.
  }
  return index;
}

type RowContext = {
  brand: BrandKey;
  adapter: ReturnType<typeof getAdapter>;
  observed: BrandSignals['observedProducts'];
  signals: BrandSignals | null;
  fx: FxSnapshot;
  skipKr: boolean;
  fresh: boolean;
  errors: string[];
  /** 상품코드 → 한국 공식몰 URL. 비어 있으면 검색 경로를 쓴다. */
  krIndex: Map<string, string>;
  /** 실제로 수집한 KR 리스팅을 여기 모은다(리포트의 수집 품질 집계용). */
  krListings: Listing[];
};

async function buildRow(ca: Listing, ctx: RowContext): Promise<ComparisonRow> {
  const cfg = BRANDS[ctx.brand];
  const notes: string[] = [];

  // --- 한국 공식몰 조회 -----------------------------------------------------
  let krOfficialKrw: number | null = null;
  let krOfficialUrl: string | null = null;
  let krOfficialMatch: ComparisonRow['krOfficialMatch'] = null;

  // 1순위: 상품코드 인덱스. 양국이 같은 ID 를 쓰는 브랜드는 여기서 끝난다.
  const indexedUrl = ca.productCode ? ctx.krIndex.get(ca.productCode) : undefined;
  if (!ctx.skipKr && indexedUrl) {
    try {
      const kr = await ctx.adapter.fetchListing(indexedUrl, 'KR', { fresh: ctx.fresh });
      if (kr?.priceMinor) {
        krOfficialKrw = kr.priceMinor;
        krOfficialUrl = kr.url;
        krOfficialMatch = 'product_code';
        ctx.krListings.push(kr);
      }
    } catch (err) {
      ctx.errors.push(`KR 상세 실패 ${indexedUrl}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 2순위: 이름 검색. 첫 결과가 엉뚱할 수 있으므로 반드시 동일 상품인지 검증한다.
  if (krOfficialKrw === null && !ctx.skipKr && ctx.adapter.searchKr) {
    try {
      const krListing = await ctx.adapter.searchKr(ca.name, { fresh: ctx.fresh });
      if (krListing) {
        const verdict = matchListing(ca, [krListing], profileOf(cfg));
        if (verdict.target) {
          krOfficialKrw = krListing.priceMinor;
          krOfficialUrl = krListing.url;
          krOfficialMatch = verdict.method === 'product_code' ? 'product_code' : 'name_similarity';
          ctx.krListings.push(krListing);
          if (verdict.method === 'name_similarity') {
            notes.push(`국내 공식몰 매칭 유사도 ${verdict.confidence}`);
          }
        } else {
          notes.push(`국내 공식몰 검색 결과가 다른 상품으로 판정됨(유사도 ${verdict.confidence})`);
        }
      }
    } catch (err) {
      ctx.errors.push(`KR 검색 실패 ${ca.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  /*
   * 국내 최저가.
   *
   * 네이버 쇼핑 검색 API 가 종료돼 가격을 주는 공개 API 가 없다.
   * 값을 비워 두되 이유를 남긴다 — "아직 못 구했다"와 "구할 수 없다"는 다르고,
   * 리포트를 읽는 사람이 그 차이를 알아야 한다.
   */
  const obs = matchObserved(ca, ctx.observed, profileOf(cfg));
  const krLowestKrw: number | null = null;
  const krLowestSource: string | null = null;

  // 가격 계산
  const caPriceCents = ca.priceMinor;
  let caPriceKrw: number | null = null;
  let estimatedSaleKrw: number | null = null;

  if (caPriceCents !== null && caPriceCents > 0) {
    caPriceKrw = Math.round((caPriceCents / 100) * ctx.fx.cadKrw);
    // 앱의 §5 공식을 그대로 재사용한다 — 계산 로직을 두 곳에 두지 않는다.
    estimatedSaleKrw = computeSalePrice({
      unitCostCadCents: caPriceCents,
      cadKrwRate: ctx.fx.cadKrw,
    }).priceKrw;
  }

  // 절감률 — 국내 공식가 우선, 없으면 최저가
  let savingRate: number | null = null;
  let savingBaseline: ComparisonRow['savingBaseline'] = null;

  // 현재는 사실상 국내 공식가만 기준이 된다(최저가 소스 부재).
  const baseline = krOfficialKrw ?? krLowestKrw;
  if (estimatedSaleKrw !== null && baseline !== null && baseline > 0) {
    savingRate = (baseline - estimatedSaleKrw) / baseline;
    savingBaseline = krOfficialKrw !== null ? 'kr_official' : 'kr_lowest';
    if (savingRate > 0.6) {
      notes.push('절감률이 비정상적으로 높다 — 매칭 오류 또는 상품 등급 차이를 의심할 것');
    }
  }

  if (krOfficialKrw === null && !ctx.skipKr) {
    notes.push(`국내 비교가 없음 — 공식몰 미취급 또는 미매칭 (최저가: ${KR_LOWEST_UNAVAILABLE_REASON})`);
  }

  if (ca.originCountryHint) {
    notes.push(`원산지 힌트 "${ca.originCountryHint}" (실물 라벨 확인 전까지 CKFTA 판정 금지)`);
  }

  const isNew =
    isRecent(ca.releaseDate, runtime.newProductWindowDays) ||
    isRecent(ca.lastModified, runtime.newProductWindowDays);

  // 인기도 — 이 상품을 발견하게 한 검색어의 점수를 붙인다.
  let popularity: ComparisonRow['popularity'] = null;
  if (obs.target && ctx.signals) {
    const idx = ctx.signals.signals.findIndex((s) => s.query === obs.target?.fromQuery);
    const sig = idx >= 0 ? ctx.signals.signals[idx] : undefined;
    if (sig) popularity = scorePopularity(sig);
  }

  return {
    brand: ctx.brand,
    productName: ca.name,
    productCode: ca.productCode,
    caUrl: ca.url,
    krOfficialUrl,
    caPriceCents,
    caListPriceCents: ca.listPriceMinor,
    caOnSale: ca.onSale,
    caAvailability: ca.availability,
    krOfficialKrw,
    krOfficialMatch,
    krLowestKrw,
    krLowestSource,
    caPriceKrw,
    estimatedSaleKrw,
    savingRate,
    savingBaseline,
    popularity,
    isNew,
    matchConfidence: obs.confidence,
    matchMethod: obs.method,
    notes,
  };
}
