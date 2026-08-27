import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICING_CONFIG,
  computeLandedCost,
  computeNetMargin,
  computeSalePrice,
} from '@/lib/pricing';

const CAD_KRW = 1000;

describe('매입원가 (알버타 GST 5%)', () => {
  it('GST 5%와 핸들링비가 원가에 반영된다', () => {
    const { landedCostCadCents } = computeLandedCost({
      unitCostCadCents: 20_000, // CA$200
      cadKrwRate: CAD_KRW,
    });
    // 20000 × 1.05 = 21000, + 핸들링 600 = 21600
    expect(landedCostCadCents).toBe(21_600);
  });

  it('PST가 없으므로 12% 과세 주(BC) 대비 원가가 낮다', () => {
    const alberta = computeLandedCost({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    const bcEquivalent = computeLandedCost({
      unitCostCadCents: 20_000,
      cadKrwRate: CAD_KRW,
      config: { ...DEFAULT_PRICING_CONFIG, gstRate: 0.12 },
    });
    expect(alberta.landedCostCadCents).toBeLessThan(bcEquivalent.landedCostCadCents);
  });

  it('환율 버퍼가 원화 원가에 반영된다', () => {
    const { costKrw } = computeLandedCost({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    expect(costKrw).toBe(Math.round(216 * CAD_KRW * 1.02)); // 220,320
  });
});

describe('판매가 산출', () => {
  it('100원 단위로 올림한다', () => {
    const { priceKrw } = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    expect(priceKrw % 100).toBe(0);
  });

  it('마진율을 높이면 판매가가 오른다', () => {
    const low = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW, marginRate: 0.2 });
    const high = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW, marginRate: 0.4 });
    expect(high.priceKrw).toBeGreaterThan(low.priceKrw);
  });

  it('환율이 오르면 판매가도 오른다', () => {
    const cheap = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: 950 });
    const pricey = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: 1_050 });
    expect(pricey.priceKrw).toBeGreaterThan(cheap.priceKrw);
  });
});

describe('순마진 (Stripe 수수료·환전비 반영)', () => {
  it('Stripe 카드 수수료와 환전 수수료가 모두 차감된다', () => {
    const { priceKrw, costKrw } = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    const m = computeNetMargin({ priceKrw, costKrw });

    // 2.9% + 2.0% + 고정 400원
    expect(m.stripeFeeKrw).toBe(Math.round(priceKrw * 0.049 + 400));
    expect(m.netProfitKrw).toBe(priceKrw - costKrw - m.stripeFeeKrw);
  });

  it('마진율이 최소 기준(12%) 아래면 경고 플래그가 선다', () => {
    const { costKrw } = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    const thin = computeNetMargin({ priceKrw: Math.round(costKrw * 1.05), costKrw });
    expect(thin.belowMinMargin).toBe(true);
  });

  it('기본 마진율 28%로 팔면 최소 기준을 넘는다', () => {
    const { priceKrw, costKrw } = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    const m = computeNetMargin({ priceKrw, costKrw });
    expect(m.belowMinMargin).toBe(false);
  });

  it('실제 배송 원가가 청구액보다 크면 마진이 잠식된다', () => {
    const { priceKrw, costKrw } = computeSalePrice({ unitCostCadCents: 20_000, cadKrwRate: CAD_KRW });
    const fair = computeNetMargin({ priceKrw, costKrw, shippingChargedKrw: 20_000, shippingCostKrw: 20_000 });
    const loss = computeNetMargin({ priceKrw, costKrw, shippingChargedKrw: 20_000, shippingCostKrw: 60_000 });
    expect(loss.netProfitKrw).toBeLessThan(fair.netProfitKrw);
  });
});
