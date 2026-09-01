import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from '@/components/ui/icons';

/**
 * 약속 카드 (100% 정품 · 주 3회 출고 · 검수 사진 · 교환·반품).
 *
 * 레퍼런스에서 가져온 것은 **카드 구조**다 — 배경 → 라벨 → 제목 → 설명 → 화살표 CTA.
 * 그라디언트와 파스텔, 필 배지는 가져오지 않았다 (DESIGN.md §7).
 *
 * 배경 자리에는 사진이 들어간다. 이 브랜드에서 신뢰는 그림이 아니라 검수 사진과
 * 영수증으로 증명한다 (PRODUCT.md 설계원칙 1). 그림보다 설득력도 강하다.
 */

export type Promise = {
  /** 라벨은 필 배지가 아니라 웨이트만으로 구분한다 (§4) */
  label: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  cta: string;
};

export function PromiseCards({ promises }: { promises: Promise[] }) {
  return (
    /*
      넓은 화면에서 네 장이 한 줄에 들어온다 (2026-09-01 운영자 요청).
      §5의 편집 그리드는 데스크톱 2열까지였지만, 이 카드들은 서로 읽는 순서가 없는
      **병렬 항목**이라 한 줄에 놓일 때 네 약속이 한 눈에 세어진다.

      4열은 `xl`(1440px)부터다. `lg`(1024px)에서 나누면 카드 폭이 220px로 떨어져
      22px 타이틀이 네 줄로 접힌다 — 1440px에서는 324px이라 두 줄에 들어온다.
    */
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
      {promises.map((promise) => (
        <article key={promise.title} className="group flex flex-col">
          <Link href={promise.href} className="flex h-full flex-col">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-skeleton">
              <Image
                src={promise.imageUrl}
                alt={promise.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-[var(--motion-standard)] ease-out group-hover:scale-[var(--scale-image-hover)]"
              />
            </div>

            <div className="flex flex-1 flex-col gap-2 pt-4">
              <span className="text-meta font-bold text-muted-text">{promise.label}</span>
              <h3 className="text-editorial font-bold text-ink">{promise.title}</h3>
              <p className="text-body text-ink">{promise.body}</p>
              {/*
                `mt-auto` — 본문 길이가 카드마다 다르므로 CTA를 바닥에 붙여 한 줄 안에서
                높이를 맞춘다. 4열에서는 이게 없으면 화살표가 들쭉날쭉해진다.
              */}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-cta font-bold text-ink group-hover:underline">
                {promise.cta}
                <ChevronRight />
              </span>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
