/**
 * 한국 통관 세액 계산 (PROJECT.md §3.2, §3.3)
 *
 * 목록통관(면세): 물품가 ≤ USD 150  → 관세·부가세 전액 면제
 *                 ※ 한국행 국제 배송비는 이 판정 기준액에서 제외한다.
 * 일반통관(과세): 초과분이 아니라 총과세가격 전체에 부과
 *                 총과세가격 = 물품가 + 국제운임(+보험료)
 *                 관세  = 총과세가격 × 관세율
 *                 부가세 = (총과세가격 + 관세) × 10%
 *
 * CKFTA: 원산지가 캐나다면 관세 0%. 단 부가세 10%는 그대로 부과된다.
 *        캐나다 브랜드라도 생산지가 제3국이면 특혜 대상이 아니다.
 *
 * 여기서 계산하는 값은 고객 안내용 "예상치"이며 청구액이 아니다(DDU).
 */
import { floorTo, krwToUsd } from '@/lib/money';

export type CustomsConfig = {
  /** 캐나다발 목록통관 면세 한도 (USD). 미국발은 200이나 캐나다는 150. */
  dutyFreeThresholdUsd: number;
  vatRate: number;
  defaultDutyRate: number;
  dutyRates: Record<string, number>;
};

export const DEFAULT_CUSTOMS_CONFIG: CustomsConfig = {
  dutyFreeThresholdUsd: 150,
  vatRate: 0.1,
  defaultDutyRate: 0.13,
  dutyRates: {
    outerwear: 0.13,
    top: 0.13,
    bottom: 0.13,
    bag: 0.08,
    shoes: 0.13,
    accessory: 0.08,
  },
};

export type CustomsInput = {
  /** 상품가 합계(원). 통합 단일 판매가 기준 — 국제배송비는 포함하지 않는다. */
  goodsValueKrw: number;
  /** 한국행 국제 배송비(원). 과세 시 과세가격에 가산되지만 면세 판정에는 쓰이지 않는다. */
  internationalShippingKrw?: number;
  /** 관세청 고시환율 (USD/KRW) */
  usdKrwRate: number;
  category?: string;
  /** 원산지가 캐나다인가 (CKFTA 관세 면제 대상) */
  ckftaEligible?: boolean;
  config?: CustomsConfig;
};

export type CustomsEstimate = {
  /** 통관 신고가 (USD) */
  declaredValueUsd: number;
  /** 목록통관(면세) 예상 여부 */
  dutyFree: boolean;
  /** 총과세가격(원). 면세면 0 */
  dutiableValueKrw: number;
  appliedDutyRate: number;
  dutyKrw: number;
  vatKrw: number;
  totalTaxKrw: number;
  /** 관세 면제가 CKFTA 때문인지 여부 (부가세는 여전히 부과됨을 안내할 것) */
  ckftaApplied: boolean;
};

export function dutyRateFor(category: string | undefined, config: CustomsConfig): number {
  if (!category) return config.defaultDutyRate;
  return config.dutyRates[category] ?? config.defaultDutyRate;
}

export function estimateCustoms(input: CustomsInput): CustomsEstimate {
  const config = input.config ?? DEFAULT_CUSTOMS_CONFIG;
  const shipping = input.internationalShippingKrw ?? 0;
  const declaredValueUsd = krwToUsd(input.goodsValueKrw, input.usdKrwRate);

  // 면세 판정: 물품가만으로 판정하며 국제 배송비는 제외한다.
  if (declaredValueUsd <= config.dutyFreeThresholdUsd) {
    return {
      declaredValueUsd,
      dutyFree: true,
      dutiableValueKrw: 0,
      appliedDutyRate: 0,
      dutyKrw: 0,
      vatKrw: 0,
      totalTaxKrw: 0,
      ckftaApplied: false,
    };
  }

  // 과세: 초과분이 아니라 총과세가격 전체에 부과된다.
  const dutiableValueKrw = input.goodsValueKrw + shipping;
  const ckftaApplied = input.ckftaEligible === true;
  const appliedDutyRate = ckftaApplied ? 0 : dutyRateFor(input.category, config);

  const dutyKrw = floorTo(dutiableValueKrw * appliedDutyRate, 10);
  // CKFTA로 관세가 0이어도 부가세 10%는 부과된다.
  const vatKrw = floorTo((dutiableValueKrw + dutyKrw) * config.vatRate, 10);

  return {
    declaredValueUsd,
    dutyFree: false,
    dutiableValueKrw,
    appliedDutyRate,
    dutyKrw,
    vatKrw,
    totalTaxKrw: dutyKrw + vatKrw,
    ckftaApplied,
  };
}

/**
 * 개인통관고유부호(PCCC) 검증. 형식: P + 숫자 12자리.
 * 민감정보이므로 호출부에서 로그·에러리포트에 원문을 남기지 않는다.
 */
const PCCC_PATTERN = /^P[0-9]{12}$/;

export function normalizePccc(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function isValidPccc(raw: string): boolean {
  return PCCC_PATTERN.test(normalizePccc(raw));
}

/** 화면 표시용 마스킹. 예: P12345678901 → P1234****8901 */
export function maskPccc(raw: string): string {
  const v = normalizePccc(raw);
  if (!PCCC_PATTERN.test(v)) return '********';
  return `${v.slice(0, 5)}****${v.slice(9)}`;
}
