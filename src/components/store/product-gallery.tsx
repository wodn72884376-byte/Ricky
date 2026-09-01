'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * 상품 이미지 그리드 — **가로 3열 × 2줄**.
 *
 * 2열 세로 그리드는 컬럼 폭을 묶어야 컷이 부풀지 않아 넓은 화면에서 이 섹션만 좌우가 비었다.
 * 가로 스트립은 반대로 스크롤을 강요했다. 3열 2줄이 두 문제를 다 피한다 —
 * 첫 화면에 여섯 컷이 다 보이고, 폭이 넓어지면 컷이 커지는 게 아니라 지면을 채운다.
 *
 * 여섯 장을 넘으면 나머지는 `더보기`로 편다 (2026-08-28 운영자 요청).
 * 캐러셀 화살표를 그리지 않는다 — 다음 컷은 스크롤이 아니라 버튼 뒤에 있다.
 *
 * 비율은 `--aspect-product`(4:5)로 카드와 통일한다.
 *
 * 확대는 **천천히** 한다(`--motion-gallery-zoom`, 900ms). 250ms는 사진이 튀어나오는 것처럼
 * 읽혔다 — 돋보기는 손으로 가져다 대는 물건이지 튀는 물건이 아니다.
 */

const VISIBLE = 6;

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  /** 각 컷을 설명할 접두 문구. `{alt} 컷 2` 처럼 쓰인다 */
  alt: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-skeleton" />;
  }

  const hidden = images.length - VISIBLE;
  const shown = expanded ? images : images.slice(0, VISIBLE);

  return (
    <div>
      {/* 폭은 상위 컬럼이 정한다 — PDP가 갤러리 컬럼을 남는 폭의 80%로 잡는다 */}
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {shown.map((src, i) => (
          <GalleryCut key={src} src={src} alt={i === 0 ? alt : `${alt} 컷 ${i + 1}`} priority={i < 3} />
        ))}
      </ul>

      {hidden > 0 && !expanded && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="lg" chevron onClick={() => setExpanded(true)}>
            이미지 {hidden}장 더보기
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 컷 하나. 호버하면 **커서가 있는 지점을 중심으로** 확대된다 —
 * `transform-origin`을 마우스 위치로 옮기는 방식이라 확대 배율은 그대로 두고
 * 보고 있는 지점이 화면 밖으로 밀려나지 않게 한다 (돋보기의 동작).
 *
 * 모션을 줄이도록 설정한 사용자에게는 `--scale-image-hover`가 1이 되어 아무 일도 일어나지 않는다.
 */
function GalleryCut({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
  const [origin, setOrigin] = useState('50% 50%');

  return (
    <li
      /* 커서는 동그라미 안의 + — 여기서 확대된다는 걸 커서가 먼저 말한다 */
      className="relative aspect-[4/5] cursor-zoom-ricky overflow-hidden bg-skeleton"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        setOrigin(`${x}% ${y}%`);
      }}
      onMouseLeave={() => setOrigin('50% 50%')}
    >
      <Image
        src={src}
        alt={alt}
        fill
        /*
          확대 배율을 폭에 포함시킨다. 셀은 데스크톱에서 뷰포트의 12~21%지만
          호버하면 1.9배가 되므로, 셀 크기에 맞춰 받으면 **확대한 순간 뭉개진다** —
          브라우저는 확대를 모르고 `sizes`만 보고 고른다.
          실측(2560/1920/1440/1024/390)에서 확대 후 최대치가 39.5vw라 40vw로 둔다.
        */
        sizes="(max-width: 768px) 85vw, 40vw"
        /* 원본이 이미 q80 webp다. 기본 75로 다시 굽으면 옷감 그라데이션에 띠가 생긴다 */
        quality={90}
        priority={priority}
        style={{ transformOrigin: origin }}
        className="object-cover transition-transform duration-[var(--motion-gallery-zoom)] ease-out
                   hover:scale-[1.9]"
      />
    </li>
  );
}
