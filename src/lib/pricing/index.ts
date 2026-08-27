/**
 * 판매가 산출 및 마진 계산 (PROJECT.md §5)
 *
 *   매입원가_CAD   = 상품 매입가 × (1 + GST 5%) + 현지 핸들링(배대지 검수/재포장)
 *   원가_KRW       = 매입원가_CAD × 시장환율 × (1 + 환율 버퍼)
 *   판매가_KRW     = ceil100( 원가_KRW × (1 + 마진율) )   ← 고객 노출 통합 단일가
 *
 * 알버타는 PST가 없어 GST 5%만 적용된다(타주 대비 7~8%p 원가 우위).
 * 원가·마진율·환율은 관리자 전용 데이터이며 고객 응답에 절대 포함하지 않는다.
 */
import { ceilTo } from '@/lib/money';

export type PricingConfig = {
  defaultMarginRate: number;
  minMarginRate: number;
  fxBufferRate: number;
  stripeFeeRate: number;
  stripeFeeFixedKrw: number;
  /** KRW 결제 → CAD 정산 시 발생하는 Stripe 환전 수수료 */
  stripeFxFeeRate: number;
  gstRate: number;
  handlingFeeCadCents: number;
  roundToKrw: number;
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  defaultMarginRate: 0.28,
  minMarginRate: 0.12,
  fxBufferRate: 0.02,
  stripeFeeRate: 0.029,
  stripeFeeFixedKrw: 400,
  stripeFxFeeRate: 0.02,
  gstRate: 0.05,
  handlingFeeCadCents: 600,
  roundToKrw: 100,
};

export type CostInput = {
  /** 공식몰 표시가 (CAD cent, 세전) */
  unitCostCadCents: number;
  /** 시장환율 CAD/KRW */
  cadKrwRate: number;
  /** 건별 핸들링비를 개별 지정할 때 */
  handlingFeeCadCents?: number;
  config?: PricingConfig;
};

export type LandedCost = {
  /** GST·핸들링 포함 매입원가 (CAD cent) */
  landedCostCadCents: number;
  /** 환율 버퍼를 반영한 원화 원가 */
  costKrw: number;
};

export function computeLandedCost(input: CostInput): LandedCost {
  const config = input.config ?? DEFAULT_PRICING_CONFIG;
  const handling = input.handlingFeeCadCents ?? config.handlingFeeCadCents;

  const landedCostCadCents = Math.round(input.unitCostCadCents * (1 + config.gstRate)) + handling;
  const costKrw = Math.round((landedCostCadCents / 100) * input.cadKrwRate * (1 + config.fxBufferRate));

  return { landedCostCadCents, costKrw };
}

export type SalePriceInput = CostInput & { marginRate?: number };

export type SalePrice = LandedCost & {
  marginRate: number;
  /** 고객 노출 통합 단일가(원). "원가 + 수수료" 분리 표기 금지. */
  priceKrw: number;
};

export function computeSalePrice(input: SalePriceInput): SalePrice {
  const config = input.config ?? DEFAULT_PRICING_CONFIG;
  const marginRate = input.marginRate ?? config.defaultMarginRate;
  const cost = computeLandedCost(input);

  return {
    ...cost,
    marginRate,
    priceKrw: ceilTo(cost.costKrw * (1 + marginRate), config.roundToKrw),
  };
}

export type NetMarginInput = {
  priceKrw: number;
  costKrw: number;
  /** 실제 국제 배송에 든 원가(원). 고객에게 받은 배송비와 별개. */
  shippingCostKrw?: number;
  /** 고객에게 청구한 배송비(원) */
  shippingChargedKrw?: number;
  config?: PricingConfig;
};

export type NetMargin = {
  revenueKrw: number;
  stripeFeeKrw: number;
  netProfitKrw: number;
  /** 매출 대비 순마진율 */
  netMarginRate: number;
  /** 최소 마진율 미달 → 판매 일시중지 + 운영자 승인 대상 */
  belowMinMargin: boolean;
};

export function computeNetMargin(input: NetMarginInput): NetMargin {
  const config = input.config ?? DEFAULT_PRICING_CONFIG;
  const shippingCharged = input.shippingChargedKrw ?? 0;
  const shippingCost = input.shippingCostKrw ?? 0;

  const revenueKrw = input.priceKrw + shippingCharged;
  // Stripe: 카드 수수료 + 고정비 + KRW→CAD 환전 수수료
  const stripeFeeKrw = Math.round(
    revenueKrw * (config.stripeFeeRate + config.stripeFxFeeRate) + config.stripeFeeFixedKrw,
  );

  const netProfitKrw = revenueKrw - input.costKrw - shippingCost - stripeFeeKrw;
  const netMarginRate = revenueKrw > 0 ? netProfitKrw / revenueKrw : 0;

  return {
    revenueKrw,
    stripeFeeKrw,
    netProfitKrw,
    netMarginRate,
    belowMinMargin: netMarginRate < config.minMarginRate,
  };
}
