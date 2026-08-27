import { formatKrw } from '@/lib/money';
import type { CustomsEstimate } from '@/lib/customs';
import { cn } from '@/lib/utils/cn';

/**
 * 가격과 그 각주.
 *
 * 이 컴포넌트가 지키는 규칙 두 가지 (DESIGN.md §12-2, §12-9):
 *   1. 가격은 상품명보다 커지지 않는다. 카드에서 12px/700, 상세에서만 22px/700.
 *   2. 관세는 각주이지 경고가 아니다. 빨간색·아이콘·틴트 배경을 쓰지 않는다.
 *
 * 세액은 항상 `예상`이다 — 통관 시점에 확정되므로 단정하지 않는다 (§10).
 */

type Props = {
  priceKrw: number;
  /** 세일 전 가격. 있으면 할인율 배지가 붙는다 */
  compareAtKrw?: number;
  /** 결제 전에 반드시 보여준다(DDU). 없으면 캡션 행이 비활성 문구로 대체된다 */
  customs?: CustomsEstimate;
  /** 상세 페이지는 'lg'. 카드는 기본값 */
  size?: 'card' | 'lg';
  /** 품절·재고 미확인 상태에서 가격까지 함께 낮춘다 (§14) */
  dimmed?: boolean;
  className?: string;
};

function discountRate(price: number, compareAt: number): number {
  return Math.round((1 - price / compareAt) * 100);
}

export function PriceBlock({
  priceKrw,
  compareAtKrw,
  customs,
  size = 'card',
  dimmed = false,
  className,
}: Props) {
  const onSale = compareAtKrw !== undefined && compareAtKrw > priceKrw;
  const isLarge = size === 'lg';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline gap-2">
        {onSale && (
          // 마케팅 surface의 유일한 채색 순간. 퍼센트 할인에만 쓴다 (§4 Sale Discount Pill)
          <span
            className={cn(
              'font-bold text-sale',
              isLarge ? 'text-editorial' : 'text-product',
            )}
          >
            {discountRate(priceKrw, compareAtKrw)}%
          </span>
        )}
        <span
          data-numeric
          className={cn(
            'font-bold',
            // 가격은 상품명과 **같은 크기**다. 작아지면 카드 위계가 뒤집힌다 (§12-2).
            isLarge ? 'text-editorial' : 'text-product',
            dimmed ? 'text-muted-text' : 'text-ink',
          )}
        >
          {formatKrw(priceKrw)}
        </span>
        {onSale && (
          <span
            data-numeric
            className="text-meta text-muted-text line-through"
            // 취소선 가격은 보조 정보다. 스크린리더가 "이전 가격"임을 알 수 있게 한다
            aria-label={`이전 가격 ${formatKrw(compareAtKrw)}`}
          >
            {formatKrw(compareAtKrw)}
          </span>
        )}
      </div>

      <CustomsCaption customs={customs} />
    </div>
  );
}

/**
 * 관세 각주. 12px/400 `#5d5d5d` — 가격 캡션과 같은 위계다.
 * 읽혀야 하는 정보이므로 투명 회색(2.92:1)을 쓰지 않는다 (DESIGN.md §2).
 */
export function CustomsCaption({ customs }: { customs?: CustomsEstimate }) {
  if (!customs) {
    return <p className="text-meta text-muted-text">관세·부가세 별도</p>;
  }

  if (customs.dutyFree) {
    return <p className="text-meta text-muted-text">관세·부가세 면제 예상</p>;
  }

  return (
    <p className="text-meta text-muted-text">
      관세·부가세 약{' '}
      <span data-numeric>{formatKrw(customs.totalTaxKrw)}</span> 예상 (통관 시 수취인 납부)
      {/* CKFTA는 관세만 0%이고 부가세 10%는 부과된다 — "완전 면세"로 읽히지 않게 명시 */}
      {customs.ckftaApplied && ' · 캐나다산이라 관세는 면제되고 부가세만 붙어요'}
    </p>
  );
}
