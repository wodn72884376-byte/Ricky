/**
 * 환율.
 *
 * CLAUDE.md 규칙 7: 관세 안내용 환율(관세청 고시환율)과
 * 원가 계산용 환율(시장환율)을 분리해 저장한다.
 * 이 파이프라인은 소싱 검토용이므로 시장환율만 쓰지만,
 * 스냅샷 시각을 함께 남겨 리포트가 언제 기준인지 드러낸다.
 */
import { runtime } from '../config/runtime.ts';
import { log } from '../core/logger.ts';
import { readCache, writeCache } from '../core/cache.ts';

export type FxSnapshot = {
  cadKrw: number;
  usdKrw: number;
  source: string;
  /** 원가 계산에 쓰는 버퍼 적용 후 환율 (환변동 대비) */
  cadKrwBuffered: number;
  capturedAt: string;
};

/** 환율 급변 손실 방지 버퍼. PROJECT.md §5 "적용환율(버퍼 포함)". */
export const FX_BUFFER = 0.02;

const FALLBACK = { cadKrw: 1000, usdKrw: 1380 };

type ErApi = { rates?: Record<string, number> };

async function fetchRate(base: string, quote: string): Promise<number | null> {
  const url = `https://open.er-api.com/v6/latest/${base}`;
  try {
    const cached = await readCache(url, 'fx');
    const body = cached ?? (await (await fetch(url, { signal: AbortSignal.timeout(15_000) })).text());
    if (!cached) await writeCache(url, body, 'fx');

    const json = JSON.parse(body) as ErApi;
    const rate = json.rates?.[quote];
    return typeof rate === 'number' && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function getFxSnapshot(): Promise<FxSnapshot> {
  // 수동 고정값이 있으면 그것이 최우선이다. 재현 가능한 리포트를 만들 때 쓴다.
  if (runtime.fx.cadKrw && runtime.fx.usdKrw) {
    return snapshot(runtime.fx.cadKrw, runtime.fx.usdKrw, 'env(FX_CAD_KRW/FX_USD_KRW)');
  }

  const [cad, usd] = await Promise.all([fetchRate('CAD', 'KRW'), fetchRate('USD', 'KRW')]);

  if (cad === null || usd === null) {
    log.warn(
      `환율 조회 실패 → 기본값 사용 (CAD ${FALLBACK.cadKrw} / USD ${FALLBACK.usdKrw}). ` +
        '.env 에 FX_CAD_KRW, FX_USD_KRW 를 넣으면 고정할 수 있다.',
    );
    return snapshot(
      runtime.fx.cadKrw ?? FALLBACK.cadKrw,
      runtime.fx.usdKrw ?? FALLBACK.usdKrw,
      'fallback',
    );
  }

  return snapshot(runtime.fx.cadKrw ?? cad, runtime.fx.usdKrw ?? usd, 'open.er-api.com');
}

function snapshot(cadKrw: number, usdKrw: number, source: string): FxSnapshot {
  return {
    cadKrw,
    usdKrw,
    source,
    cadKrwBuffered: cadKrw * (1 + FX_BUFFER),
    capturedAt: new Date().toISOString(),
  };
}
