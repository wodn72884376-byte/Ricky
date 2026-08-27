/**
 * 장바구니 합계 계산.
 *
 * 규칙 (PROJECT.md §3):
 *   - 고객에게 노출되는 금액은 **통합 단일가 + 배송비** 뿐이다. 원가·수수료를 분해하지 않는다.
 *   - 관세·부가세는 판매가에 포함하지 않는다(DDU). 다만 결제 전에 **반드시 계산해 보여준다**.
 *   - USD 150 면세 판정에 국제배송비는 포함하지 않는다.
 *   - 합산과세: 같은 날 같은 수취인 도착분은 합산된다 → 장바구니 전체로 한 번 판정한다.
 */
import { estimateCustoms, type CustomsEstimate } from '@/lib/customs';
import { quoteShipping } from '@/lib/shipping';

/** 관세 안내용 고시환율. TODO(fx): fx_rates 테이블에서 읽는다 (PROJECT.md §5) */
export const CUSTOMS_USD_KRW = 1380;

export type CheckoutLine = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  size: string | null;
  qty: number;
  unitPriceKrw: number;
  category: string;
  originCountry: string;
  weightG: number;
  purchasable: boolean;
};

export type CheckoutTotals = {
  subtotalKrw: number;
  shippingKrw: number;
  totalKrw: number;
  /** 장바구니 전체 기준 — 합산과세를 반영한다 */
  customs: CustomsEstimate;
  /** 면세 한도까지 남은 금액(원). 이미 넘었으면 0 */
  headroomKrw: number;
  hasBlocked: boolean;
};

export function computeTotals(lines: CheckoutLine[]): CheckoutTotals {
  const subtotalKrw = lines.reduce((s, l) => s + l.unitPriceKrw * l.qty, 0);
  const weightG = lines.reduce((s, l) => s + l.weightG * l.qty, 0);
  const { shippingKrw } = quoteShipping(weightG);

  // 원산지가 섞이면 캐나다산만 CKFTA를 받는다. 장바구니 단위 안내에서는
  // **전부 캐나다산일 때만** 관세 면제로 안내한다 — 유리하게 반올림하지 않는다.
  const allCanadian = lines.length > 0 && lines.every((l) => l.originCountry === 'CA');

  const customs = estimateCustoms({
    goodsValueKrw: subtotalKrw,
    internationalShippingKrw: shippingKrw,
    usdKrwRate: CUSTOMS_USD_KRW,
    category: lines[0]?.category,
    ckftaEligible: allCanadian,
  });

  const thresholdKrw = 150 * CUSTOMS_USD_KRW;
  return {
    subtotalKrw,
    shippingKrw,
    totalKrw: subtotalKrw + shippingKrw,
    customs,
    headroomKrw: Math.max(0, thresholdKrw - subtotalKrw),
    hasBlocked: lines.some((l) => !l.purchasable),
  };
}

/**
 * 주문번호. 서버의 `next_order_no()`와 같은 형식이다 —
 * `R<YYMMDD>-<6자 Crockford Base32>` (docs/IA.md §5-2).
 * TODO(server): 실제 주문은 DB 기본값으로 생성된다. 이건 미리보기용이다.
 */
export function previewOrderNo(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(bytes, (b) => alphabet[b % 32]).join('');
  return `R${yy}${mm}${dd}-${suffix}`;
}
