/**
 * 어댑터 레지스트리.
 * 브랜드별 특수 처리가 필요해지면 여기서 범용 어댑터를 감싸거나 교체한다.
 */
import { BRANDS } from '../config/brands.ts';
import type { BrandKey } from '../core/types.ts';
import { createGenericAdapter } from './generic.ts';
import type { BrandAdapter } from './types.ts';

const cache = new Map<BrandKey, BrandAdapter>();

export function getAdapter(brand: BrandKey): BrandAdapter {
  let a = cache.get(brand);
  if (!a) {
    a = createGenericAdapter(BRANDS[brand]);
    cache.set(brand, a);
  }
  return a;
}

export type { BrandAdapter } from './types.ts';
