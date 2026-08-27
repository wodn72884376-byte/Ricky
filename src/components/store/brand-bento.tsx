import Image from 'next/image';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * 브랜드 벤토 그리드.
 *
 * 레퍼런스에서 가져온 것은 **비대칭 타일 배치**다. 어두운 지면·둥근 모서리·그라디언트
 * 오버레이는 가져오지 않았다 — 그건 시각 언어이고 이 브랜드의 것이 아니다 (DESIGN.md §7).
 *
 * 캡션은 사진 **위** 하단 스크림에 얹는다. §7의 "겹치지 않는다"에 대한 명시적 예외이며
 * DESIGN.md §4에 스크림 규격으로 기록돼 있다. 스크림은 장식 그라디언트가 아니라
 * 흰 글자의 대비를 확보하는 기능 장치다 — 그래서 불투명도 하한이 정해져 있다.
 *
 * **링크는 타일당 하나다.** CTA 버튼 하나만 진짜 `<a>`이고, 그 의사요소를 타일 전체로 늘려
 * 어디를 눌러도 같은 곳으로 가게 한다. 타일을 `<a>`로 감싸고 안에 버튼 링크를 또 넣으면
 * `<a>` 중첩이라 HTML이 무효가 되고 하이드레이션이 깨진다.
 */

export type BentoTile = {
  href: string;
  imageUrl: string;
  imageAlt: string;
  /** 라틴 브랜드 표기. 잡지 목차의 레지스터로 쓴다 (§3) */
  label: string;
  count?: string;
  cta: string;
  /** 큰 타일 하나가 리듬을 만든다. 나머지는 작게 */
  feature?: boolean;
};

export function BrandBento({ tiles }: { tiles: BentoTile[] }) {
  return (
    /*
      데스크톱 3열 × 2행. 첫 타일이 2×2를 차지하고 나머지가 오른쪽에 쌓인다.
      auto-fit을 쓰지 않는다 — 사진 비율이 고정이라 열 수가 흔들리면 리듬이 깨진다 (§5).
    */
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
      {tiles.map((tile, i) => (
        <BentoCard key={tile.href} tile={tile} priority={i === 0} />
      ))}
    </div>
  );
}

function BentoCard({ tile, priority }: { tile: BentoTile; priority: boolean }) {
  return (
    <article
      className={cn(
        // relative — CTA 링크의 의사요소가 이 박스를 덮는다
        'group relative overflow-hidden bg-skeleton',
        tile.feature ? 'min-h-[420px] lg:col-span-2 lg:row-span-2' : 'min-h-[280px]',
      )}
    >
      <Image
        src={tile.imageUrl}
        alt={tile.imageAlt}
        fill
        sizes={tile.feature ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 1024px) 100vw, 33vw'}
        priority={priority}
        className="object-cover transition-transform duration-[var(--motion-standard)] ease-out group-hover:scale-[var(--scale-image-hover)]"
      />

      {/*
        스크림. 하단 85% → 위로 투명. 텍스트는 70% 이상 구간 안에만 놓는다.
        최악의 경우(순백 사진) 70% 스크림 위 흰 글자가 8.7:1로 AA를 통과한다
        — `npm run design:contrast`가 이 경우를 검사한다.
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/70 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 lg:p-8">
        <div className="flex items-baseline gap-3">
          <h3 className={cn('font-bold text-paper', tile.feature ? 'text-headline' : 'text-subhead')}>
            {tile.label}
          </h3>
          {tile.count && (
            <span data-numeric className="text-meta text-paper/70">
              {tile.count}
            </span>
          )}
        </div>
        {/* 타일 전체를 덮는 유일한 링크. after 의사요소가 히트 영역을 확장한다. */}
        <ButtonLink
          href={tile.href}
          variant="on-image"
          size="md"
          chevron
          className="mt-3 self-start after:absolute after:inset-0 after:content-['']"
        >
          {tile.cta}
        </ButtonLink>
      </div>
    </article>
  );
}
