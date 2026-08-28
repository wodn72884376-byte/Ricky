import Image from 'next/image';

/**
 * 상품 이미지 그리드.
 *
 * 레퍼런스(아크테릭스 공식몰)는 2열 그리드로 6장 이상을 한 번에 보여준다.
 * 캐러셀이 아니라 그리드인 이유는 명확하다 — 스크롤만으로 전부 볼 수 있고,
 * 다음 사진이 있다는 걸 알려주려고 화살표를 그릴 필요가 없다.
 *
 * 비율은 `--aspect-product`(4:5)로 카드와 통일한다. 원본이 어떤 비율이든
 * 같은 틀에 맞아야 그리드 리듬이 유지된다 (DESIGN.md §5).
 *
 * 폭은 상위(560px 컬럼)가 정한다. `sizes`도 그 실제 폭을 알려줘야
 * 브라우저가 필요 이상으로 큰 이미지를 내려받지 않는다.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  /** 각 컷을 설명할 접두 문구. `{alt} 정면` 처럼 쓰인다 */
  alt: string;
}) {
  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-skeleton" />;
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {images.map((src, i) => (
        <div key={src} className="relative aspect-[4/5] w-full overflow-hidden bg-skeleton">
          <Image
            src={src}
            alt={i === 0 ? alt : `${alt} 컷 ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            priority={i < 2}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
