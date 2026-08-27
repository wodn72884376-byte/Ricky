'use client';

import { useRef } from 'react';
import { ProductCard, type ProductCardProps } from './product-card';
import { ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

/**
 * 가로 스크롤 상품 레일 (베스트셀러 등).
 *
 * 레퍼런스의 좌우 화살표 컨트롤을 가져왔다. 둥근 모서리 대신 4px, 그림자 대신 1px 아웃라인이다.
 * 자동 재생을 하지 않는다 — 카운트다운·자동 캐러셀은 §10 금지 목록이다.
 *
 * 화살표는 마우스 사용자를 위한 보조 수단이다. 터치는 스와이프, 키보드는 탭 이동으로 닿는다.
 */
export function ProductRail({
  products,
  className,
}: {
  products: (ProductCardProps & { id: string })[];
  className?: string;
}) {
  const railRef = useRef<HTMLUListElement>(null);

  function scrollBy(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    // 카드 한 장 + 간격만큼 민다. 화면 폭으로 밀면 카드가 잘린 채 멈춘다.
    const card = rail.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: step * direction * 2, behavior: 'smooth' });
  }

  return (
    <div className={className}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-editorial font-bold lg:text-headline">BEST</h2>
          <p className="mt-1 text-body text-muted-text">이번 주에 가장 많이 나간 상품이에요.</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <RailButton direction={-1} onClick={() => scrollBy(-1)} />
          <RailButton direction={1} onClick={() => scrollBy(1)} />
        </div>
      </div>

      <ul
        ref={railRef}
        /* 스크롤바를 숨기지 않는다 — 스크롤 가능하다는 유일한 시각 단서다.
           스냅으로 카드가 잘린 채 멈추지 않게 한다. */
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[calc(50%-8px)] shrink-0 snap-start md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)] 2xl:w-[calc(16.666%-14px)]"
          >
            <ProductCard {...product} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RailButton({ direction, onClick }: { direction: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex size-11 items-center justify-center rounded-ghost border border-outline bg-paper',
        'transition-colors duration-[var(--motion-quick)] hover:border-ink',
      )}
    >
      <span className="sr-only">{direction === 1 ? '다음 상품 보기' : '이전 상품 보기'}</span>
      <ChevronRight className={direction === -1 ? 'rotate-180' : undefined} />
    </button>
  );
}
