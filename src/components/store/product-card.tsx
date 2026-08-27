import Image from 'next/image';
import Link from 'next/link';
import type { CustomsEstimate } from '@/lib/customs';
import { cn } from '@/lib/utils/cn';
import { PriceBlock } from './price-block';
import { WishlistButton } from './wishlist-button';

/**
 * 카탈로그의 기본 단위. 세로 리듬은 사진 → 상품명 → 가격 → 관세 각주다 (DESIGN.md §12-2).
 * 이 순서를 뒤집는 것이 다른 커머스 디자인을 이 시스템으로 옮길 때 가장 흔한 실수다.
 *
 * 보더·그림자·반경 없음. 분리는 여백이 만든다 (§4 Product Card).
 *
 * **링크는 카드당 하나다.** 상품명이 진짜 `<a>`이고 그 의사요소가 카드 전체를 덮는다.
 * 카드를 `<a>`로 감싸면 찜 버튼이 `<a>` 안의 `<button>`이 되어 HTML이 무효가 된다.
 */

export type ProductCardAvailability =
  /** 판매 중 */
  | 'available'
  /** 공급처 재고가 신선도 임계를 넘겼다. 상품은 여전히 존재한다 (§14) */
  | 'checking'
  /** 공급처 out_of_stock */
  | 'sold_out';

export type ProductCardProps = {
  /** 찜 식별자. 없으면 찜 버튼을 그리지 않는다 */
  id?: string;
  href: string;
  imageUrl: string;
  /** 사진이 무엇인지 설명한다. "상품 이미지" 같은 껍데기 문구를 쓰지 않는다 */
  imageAlt: string;
  brand: string;
  name: string;
  priceKrw: number;
  compareAtKrw?: number;
  customs?: CustomsEstimate;
  availability?: ProductCardAvailability;
  /** 목록 첫 화면의 카드에만 true. LCP 이미지를 미루지 않는다 */
  priority?: boolean;
  className?: string;
};

const STATUS_CAPTION: Record<Exclude<ProductCardAvailability, 'available'>, string> = {
  checking: '재고를 확인하고 있어요',
  sold_out: '지금은 재입고를 기다리는 중이에요',
};

export function ProductCard({
  id,
  href,
  imageUrl,
  imageAlt,
  brand,
  name,
  priceKrw,
  compareAtKrw,
  customs,
  availability = 'available',
  priority = false,
  className,
}: ProductCardProps) {
  const dimmed = availability === 'sold_out';

  return (
    <article className={cn('group relative', className)}>
      {/*
        4:5 세로. 비율을 고정해야 열 수가 바뀌어도 그리드 리듬이 유지된다 (§5).
        품절이어도 이미지를 흐리거나 회색조로 만들지 않는다 — 상품은 여전히 존재한다 (§14).
      */}
      <div className="relative aspect-[4/5] overflow-hidden bg-skeleton">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 17vw"
          priority={priority}
          className={cn(
            'object-cover',
            // 사진만 움직인다. 카드 크롬은 정지한다 (§15-1)
            'transition-transform duration-[var(--motion-standard)] ease-out',
            'group-hover:scale-[var(--scale-image-hover)]',
          )}
        />
        {id && <WishlistButton productId={id} productName={name} />}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-meta text-muted-text">{brand}</span>
          <h3 className={cn('text-product font-normal', dimmed ? 'text-muted-text' : 'text-ink')}>
            {/* 카드 전체를 덮는 유일한 링크 */}
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {name}
            </Link>
          </h3>
        </div>

        <PriceBlock
          priceKrw={priceKrw}
          compareAtKrw={compareAtKrw}
          customs={customs}
          dimmed={dimmed}
        />

        {availability !== 'available' && (
          <p className="text-meta text-muted-text">{STATUS_CAPTION[availability]}</p>
        )}
      </div>
    </article>
  );
}

/**
 * 스켈레톤은 최종 지오메트리를 그대로 따른다. 시머 금지 — 사진과 경쟁한다 (§14).
 * 가격 자리에는 블록을 두지 않고 `--`로 렌더한다.
 */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-[4/5] animate-skeleton bg-skeleton" />
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-4 w-16 animate-skeleton bg-skeleton" />
        <div className="h-4 w-3/4 animate-skeleton bg-skeleton" />
        <span data-numeric className="text-meta font-bold text-muted-text">
          --
        </span>
      </div>
    </div>
  );
}
