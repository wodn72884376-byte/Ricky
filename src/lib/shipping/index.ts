/**
 * 국제 항공 특송 운임 계산 (PROJECT.md §3.5)
 *
 * IATA 규정에 따라 실무게와 부피무게 중 큰 값으로 운임이 책정된다.
 * 패딩·백팩처럼 가볍고 부피가 큰 상품은 부피무게가 지배적이므로
 * 상품 등록 시 치수 입력을 필수로 한다.
 * 최장변 1m 초과 시 대형 화물 할증이 붙는다.
 */

export type ShippingConfig = {
  /** 부피무게 = L(cm) × W(cm) × H(cm) / divisor */
  volumetricDivisor: number;
  oversizeMaxSideMm: number;
  oversizeFeeKrw: number;
  ratePer500gKrw: number;
  baseFeeKrw: number;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  volumetricDivisor: 6000,
  oversizeMaxSideMm: 1000,
  oversizeFeeKrw: 30000,
  ratePer500gKrw: 4500,
  baseFeeKrw: 5000,
};

export type Dimensions = {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
};

/** 부피무게(g). 치수는 mm로 받아 cm로 환산해 계산한다. */
export function volumetricWeightG(dims: Dimensions, divisor = DEFAULT_SHIPPING_CONFIG.volumetricDivisor): number {
  const cm3 = (dims.lengthMm / 10) * (dims.widthMm / 10) * (dims.heightMm / 10);
  return Math.ceil((cm3 / divisor) * 1000);
}

/** 운임 적용 무게(g) = max(실무게, 부피무게) */
export function chargeableWeightG(actualWeightG: number, dims?: Dimensions, divisor?: number): number {
  if (!dims) return actualWeightG;
  return Math.max(actualWeightG, volumetricWeightG(dims, divisor));
}

/** 최장변이 한도를 넘으면 대형 화물 할증 대상 */
export function isOversize(dims: Dimensions, maxSideMm = DEFAULT_SHIPPING_CONFIG.oversizeMaxSideMm): boolean {
  return Math.max(dims.lengthMm, dims.widthMm, dims.heightMm) > maxSideMm;
}

export type ShippingQuote = {
  chargeableWeightG: number;
  oversize: boolean;
  shippingKrw: number;
};

export function quoteShipping(
  actualWeightG: number,
  dims?: Dimensions,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG,
): ShippingQuote {
  const weight = chargeableWeightG(actualWeightG, dims, config.volumetricDivisor);
  const oversize = dims ? isOversize(dims, config.oversizeMaxSideMm) : false;
  const units = Math.ceil(weight / 500);

  return {
    chargeableWeightG: weight,
    oversize,
    shippingKrw: config.baseFeeKrw + units * config.ratePer500gKrw + (oversize ? config.oversizeFeeKrw : 0),
  };
}
