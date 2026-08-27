import { describe, expect, it } from 'vitest';
import { chargeableWeightG, isOversize, quoteShipping, volumetricWeightG } from '@/lib/shipping';

describe('부피무게', () => {
  it('30×20×10cm는 divisor 6000 기준 1000g이다', () => {
    expect(volumetricWeightG({ lengthMm: 300, widthMm: 200, heightMm: 100 })).toBe(1000);
  });

  it('가볍고 부피 큰 패딩은 부피무게가 운임 기준이 된다', () => {
    const dims = { lengthMm: 600, widthMm: 400, heightMm: 300 }; // 12,000g
    expect(chargeableWeightG(800, dims)).toBe(12_000);
  });

  it('무겁고 작은 상품은 실무게가 운임 기준이다', () => {
    const dims = { lengthMm: 200, widthMm: 150, heightMm: 100 }; // 500g
    expect(chargeableWeightG(2_000, dims)).toBe(2_000);
  });

  it('치수가 없으면 실무게를 쓴다', () => {
    expect(chargeableWeightG(1_500)).toBe(1_500);
  });
});

describe('대형 화물 할증 (최장변 1m)', () => {
  it('정확히 1000mm는 할증 대상이 아니다', () => {
    expect(isOversize({ lengthMm: 1000, widthMm: 200, heightMm: 200 })).toBe(false);
  });

  it('1001mm부터 할증 대상이다', () => {
    expect(isOversize({ lengthMm: 1001, widthMm: 200, heightMm: 200 })).toBe(true);
  });

  it('할증 시 요금에 30,000원이 더해진다', () => {
    const small = quoteShipping(1000, { lengthMm: 900, widthMm: 100, heightMm: 100 });
    const large = quoteShipping(1000, { lengthMm: 1100, widthMm: 100, heightMm: 100 });
    expect(large.oversize).toBe(true);
    expect(large.shippingKrw - small.shippingKrw).toBe(30_000 + (large.chargeableWeightG > small.chargeableWeightG ? 4500 : 0));
  });
});

describe('배송비 견적', () => {
  it('500g 단위로 올림 과금한다', () => {
    const a = quoteShipping(500);
    const b = quoteShipping(501);
    expect(b.shippingKrw - a.shippingKrw).toBe(4_500);
  });

  it('기본료 + 무게요금 구조', () => {
    expect(quoteShipping(1_000).shippingKrw).toBe(5_000 + 2 * 4_500);
  });
});
