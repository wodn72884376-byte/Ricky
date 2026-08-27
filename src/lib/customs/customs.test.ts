import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CUSTOMS_CONFIG,
  estimateCustoms,
  isValidPccc,
  maskPccc,
  normalizePccc,
} from '@/lib/customs';

const USD_KRW = 1400;

describe('estimateCustoms — USD 150 경계', () => {
  it('정확히 USD 150이면 면세다 (이하 기준)', () => {
    const r = estimateCustoms({ goodsValueKrw: 150 * USD_KRW, usdKrwRate: USD_KRW });
    expect(r.declaredValueUsd).toBe(150);
    expect(r.dutyFree).toBe(true);
    expect(r.totalTaxKrw).toBe(0);
  });

  it('USD 150을 조금이라도 넘으면 과세로 전환된다', () => {
    const r = estimateCustoms({ goodsValueKrw: 150 * USD_KRW + 1400, usdKrwRate: USD_KRW });
    expect(r.dutyFree).toBe(false);
    expect(r.totalTaxKrw).toBeGreaterThan(0);
  });

  it('국제 배송비는 면세 판정 기준액에서 제외된다', () => {
    const goods = 149 * USD_KRW;
    const withShipping = estimateCustoms({
      goodsValueKrw: goods,
      internationalShippingKrw: 50_000, // 이걸 더하면 150불을 넘지만 판정에는 쓰이지 않는다
      usdKrwRate: USD_KRW,
    });
    expect(withShipping.dutyFree).toBe(true);
  });

  it('과세 시 초과분이 아니라 총과세가격 전체에 부과된다', () => {
    const goods = 300 * USD_KRW; // 420,000원
    const shipping = 30_000;
    const r = estimateCustoms({
      goodsValueKrw: goods,
      internationalShippingKrw: shipping,
      usdKrwRate: USD_KRW,
      category: 'outerwear',
    });

    // 총과세가격 = 물품가 + 국제운임 (초과분 70,000원이 아님)
    expect(r.dutiableValueKrw).toBe(goods + shipping);
    expect(r.appliedDutyRate).toBe(0.13);
    expect(r.dutyKrw).toBe(Math.floor((goods + shipping) * 0.13 / 10) * 10);
    expect(r.vatKrw).toBe(Math.floor(((goods + shipping) + r.dutyKrw) * 0.1 / 10) * 10);
  });
});

describe('estimateCustoms — CKFTA', () => {
  const base = {
    goodsValueKrw: 400 * USD_KRW,
    internationalShippingKrw: 30_000,
    usdKrwRate: USD_KRW,
    category: 'outerwear',
  };

  it('Made in Canada면 관세는 0이지만 부가세 10%는 그대로 부과된다', () => {
    const r = estimateCustoms({ ...base, ckftaEligible: true });
    expect(r.ckftaApplied).toBe(true);
    expect(r.dutyKrw).toBe(0);
    expect(r.vatKrw).toBeGreaterThan(0);
    expect(r.totalTaxKrw).toBe(r.vatKrw);
  });

  it('제3국 생산이면 관세와 부가세가 모두 부과된다', () => {
    const r = estimateCustoms({ ...base, ckftaEligible: false });
    expect(r.dutyKrw).toBeGreaterThan(0);
    expect(r.vatKrw).toBeGreaterThan(0);
  });

  it('CKFTA 적용 시 세액이 미적용 대비 확실히 낮다', () => {
    const withFta = estimateCustoms({ ...base, ckftaEligible: true });
    const withoutFta = estimateCustoms({ ...base, ckftaEligible: false });
    expect(withFta.totalTaxKrw).toBeLessThan(withoutFta.totalTaxKrw);
  });
});

describe('estimateCustoms — 품목별 관세율', () => {
  it('가방은 8%, 의류는 13%가 적용된다', () => {
    const input = { goodsValueKrw: 500 * USD_KRW, usdKrwRate: USD_KRW };
    expect(estimateCustoms({ ...input, category: 'bag' }).appliedDutyRate).toBe(0.08);
    expect(estimateCustoms({ ...input, category: 'top' }).appliedDutyRate).toBe(0.13);
  });

  it('미등록 카테고리는 기본 관세율을 쓴다', () => {
    const r = estimateCustoms({ goodsValueKrw: 500 * USD_KRW, usdKrwRate: USD_KRW, category: 'unknown-cat' });
    expect(r.appliedDutyRate).toBe(DEFAULT_CUSTOMS_CONFIG.defaultDutyRate);
  });
});

describe('개인통관고유부호(PCCC)', () => {
  it('P + 숫자 12자리만 통과한다', () => {
    expect(isValidPccc('P123456789012')).toBe(true);
    expect(isValidPccc('p123456789012')).toBe(true);
    expect(isValidPccc('P12345678901')).toBe(false);  // 11자리
    expect(isValidPccc('P1234567890123')).toBe(false); // 13자리
    expect(isValidPccc('X123456789012')).toBe(false);
    expect(isValidPccc('')).toBe(false);
  });

  it('공백과 하이픈을 제거하고 대문자로 정규화한다', () => {
    expect(normalizePccc(' p1234-5678-9012 ')).toBe('P123456789012');
    expect(isValidPccc(' p1234-5678-9012 ')).toBe(true);
  });

  it('마스킹은 앞 5자·뒤 4자만 남긴다', () => {
    expect(maskPccc('P123456789012')).toBe('P1234****9012');
    expect(maskPccc('invalid')).toBe('********');
  });
});
