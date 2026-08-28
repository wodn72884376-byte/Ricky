'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import { PriceBlock } from './price-block';

/**
 * 카탈로그의 기본 단위. 세로 리듬은 사진 → 상품명 → 가격 → 컬러칩이다 (DESIGN.md §12-2).
 * 이 순서를 뒤집는 것이 다른 커머스 디자인을 이 시스템으로 옮길 때 가장 흔한 실수다.
 *
 * 관세 각주는 목록에서 뺐다(2026-08-28 운영자 요청). 카드마다 반복되면 각주가 아니라
 * 배경 소음이 된다 — 세액은 상세·장바구니·결제에서 계속 보여준다.
 *
 * **호버하면 확대되지 않고 다음 컷으로 넘어간다** (2026-08-28). 확대는 같은 사진을 크게
 * 보여줄 뿐이지만, 목록에서 알고 싶은 건 "뒷모습은 어떤가"다. 사진이 정보를 더 준다.
 *
 * 보더·그림자·반경 없음. 분리는 여백이 만든다 (§4 Product Card).
 *
 * **링크는 카드당 하나다.** 상품명이 진짜 `<a>`이고 그 의사요소가 카드 전체를 덮는다.
 * 좌우 화살표는 `z-raised`를 얹어 그 덮개 위로 올린다 — 안 그러면 눌러도 상세로 간다.
 */

export type ProductCardAvailability =
  /** 판매 중 */
  | 'available'
  /** 공급처 재고가 신선도 임계를 넘겼다. 상품은 여전히 존재한다 (§14) */
  | 'checking'
  /** 공급처 out_of_stock */
  | 'sold_out';

/** 카드에 다는 컬러칩. `hex`가 null이면 색을 지어내지 않고 칩을 그리지 않는다 */
export type ColorChip = { label: string; hex: string | null };

export type ProductCardProps = {
  /**
   * 목록에서 React key로 쓴다. 카드 자체는 이 값을 쓰지 않는다 —
   * 찜 버튼이 사라지면서 카드 안에서 식별자가 필요한 곳이 없어졌다 (2026-08-28).
   */
  id?: string;
  href: string;
  imageUrl: string;
  /** 넘겨 볼 컷들. 없으면 `imageUrl` 한 장만 쓴다 */
  images?: string[];
  /** 사진이 무엇인지 설명한다. "상품 이미지" 같은 껍데기 문구를 쓰지 않는다 */
  imageAlt: string;
  brand: string;
  name: string;
  priceKrw: number;
  compareAtKrw?: number;
  /** 이 상품에 있는 색상들. 상품명 아래 동그란 칩으로 놓는다 */
  colors?: ColorChip[];
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
  href,
  imageUrl,
  images,
  imageAlt,
  brand,
  name,
  priceKrw,
  compareAtKrw,
  colors,
  availability = 'available',
  priority = false,
  className,
}: ProductCardProps) {
  const dimmed = availability === 'sold_out';
  const cuts = images && images.length > 0 ? images : [imageUrl];
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  /*
    컷 여섯 장을 카드마다 미리 받으면 목록 한 화면이 수십 MB가 된다.
    **두 장만 미리 받는다** — 호버는 두 번째 컷으로만 가므로 이 둘이면 즉시 바뀐다.
    나머지는 화살표를 실제로 쓴 다음에 붙인다.
  */
  const [allMounted, setAllMounted] = useState(false);
  const rendered = allMounted ? cuts : cuts.slice(0, 2);

  const many = cuts.length > 1;

  function step(delta: number) {
    setAllMounted(true);
    setIndex((i) => (i + delta + cuts.length) % cuts.length);
  }

  return (
    <article
      className={cn('group relative', className)}
      onMouseEnter={() => {
        setHovered(true);
        // 호버하면 두 번째 컷으로. 한 장뿐이면 그대로 둔다.
        if (many) setIndex(1);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setIndex(0);
      }}
    >
      {/*
        4:5 세로. 비율을 고정해야 열 수가 바뀌어도 그리드 리듬이 유지된다 (§5).
        품절이어도 이미지를 흐리거나 회색조로 만들지 않는다 — 상품은 여전히 존재한다 (§14).
      */}
      <div className="relative aspect-[4/5] overflow-hidden bg-skeleton">
        {/*
          컷을 전부 겹쳐 두고 불투명도로 바꾼다. 매번 교체하면 새 파일을 그때 받느라
          한 박자 늦게 나타난다 — 겹쳐 두면 첫 호버부터 즉시 바뀐다.
        */}
        {rendered.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? imageAlt : ''}
            aria-hidden={i === 0 ? undefined : true}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 17vw"
            priority={priority && i === 0}
            loading={priority && i === 0 ? undefined : 'lazy'}
            className={cn(
              // 크로스페이드는 천천히. 250ms는 사진이 깜빡이는 것처럼 읽혔다 (2026-08-28)
              'object-cover transition-opacity duration-[var(--motion-card-cut)] ease-out',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}

        {many && (
          <>
            <CutButton dir="prev" shown={hovered} onClick={() => step(-1)} />
            <CutButton dir="next" shown={hovered} onClick={() => step(1)} />
          </>
        )}
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

        <PriceBlock priceKrw={priceKrw} compareAtKrw={compareAtKrw} dimmed={dimmed} />

        {colors && colors.length > 0 && <ColorChips colors={colors} />}

        {availability !== 'available' && (
          <p className="text-meta text-muted-text">{STATUS_CAPTION[availability]}</p>
        )}
      </div>
    </article>
  );
}

/**
 * 컷 넘김 버튼. 사진 위에 얹히므로 흰 바탕에 검은 셰브런이다 —
 * 반전 블랙을 쓰면 구매 CTA와 같은 무게가 되고, 투명하게 두면 밝은 사진에서 사라진다.
 *
 * 호버할 때만 나타난다. 목록의 지배적 상태는 여전히 "사진 한 장"이어야 한다 (§12-6).
 * 터치 기기에는 호버가 없으므로 항상 보이게 둔다 — 없으면 넘길 방법이 사라진다.
 */
function CutButton({
  dir,
  shown,
  onClick,
}: {
  dir: 'prev' | 'next';
  shown: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // z-raised — 상품명 링크가 카드 전체에 덮은 의사요소보다 위여야 눌린다 (§5 Z-Index)
        'absolute top-1/2 z-[var(--z-raised)] -translate-y-1/2',
        'flex size-8 items-center justify-center rounded-full bg-paper/90 text-ink',
        'transition-opacity duration-[var(--motion-quick)] ease-out',
        dir === 'prev' ? 'left-2' : 'right-2',
        // 포커스로 왔을 때도 보여야 키보드로 넘길 수 있다
        shown ? 'opacity-100' : 'opacity-0 focus-visible:opacity-100',
        '[@media(hover:none)]:opacity-100',
      )}
    >
      <span className="sr-only">{dir === 'prev' ? '이전 사진' : '다음 사진'}</span>
      <ChevronRight size={14} className={dir === 'prev' ? 'rotate-180' : undefined} />
    </button>
  );
}

/**
 * 컬러칩. 색상 개수를 알리는 장치이지 색을 고르는 컨트롤이 아니다 —
 * 카드의 유일한 링크는 상품명이므로 여기에 두 번째 링크를 만들지 않는다.
 *
 * 아웃라인은 밝은 회색(`--color-outline`)이다. 흰색 칩이 지면에 묻히지 않게 하는 것이
 * 유일한 목적이므로 굵게 하거나 색을 넣지 않는다.
 */
function ColorChips({ colors }: { colors: ColorChip[] }) {
  const drawn = colors.filter((c) => c.hex !== null);
  if (drawn.length === 0) return null;

  // 여섯 개를 넘으면 줄이 접혀 카드 높이가 흔들린다. 나머지는 숫자로 알린다.
  const shown = drawn.slice(0, 6);
  const rest = drawn.length - shown.length;

  return (
    <ul className="flex items-center gap-1.5">
      {shown.map((c) => (
        <li key={c.label}>
          <span
            className="block size-3.5 rounded-full border border-outline"
            style={{ backgroundColor: c.hex! }}
            /* 칩 색은 근사값이다. 정확한 이름을 항상 함께 준다 */
            title={c.label}
          />
          <span className="sr-only">{c.label}</span>
        </li>
      ))}
      {rest > 0 && (
        <li data-numeric className="text-meta text-muted-text">
          +{rest}
        </li>
      )}
    </ul>
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
