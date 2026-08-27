import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

/**
 * 홈의 지배적 단위. 사진 하나 + 22px/700 한국어 한 문장 (DESIGN.md §4 Editorial Tile).
 *
 * 캡션은 이미지 **아래** 놓는다. 겹치지 않는다 (§7 Don't).
 * 이미지가 타일을 지탱하지 못하면 그 타일은 준비되지 않은 것이다 (§12-1).
 */

type Props = {
  href: string;
  imageUrl: string;
  imageAlt: string;
  title: string;
  description?: string;
  /** 브랜드 관문에 쓰는 라틴 라벨. 있으면 타이틀 위에 디스플레이 사이즈로 놓인다 */
  latinLabel?: string;
  /** 관문 개수 배지. `38개` */
  count?: string;
  /** 관문은 뷰포트 높이를 쓴다. 일반 편집 타일은 4:5 */
  variant?: 'tile' | 'gateway';
  priority?: boolean;
  className?: string;
};

export function EditorialTile({
  href,
  imageUrl,
  imageAlt,
  title,
  description,
  latinLabel,
  count,
  variant = 'tile',
  priority = false,
  className,
}: Props) {
  const isGateway = variant === 'gateway';

  return (
    <article className={cn('group', className)}>
      {/* 타일 전체가 탭 가능하다. 별도 "보기" 버튼을 두지 않는다 (§8 Touch Targets) */}
      <Link href={href} className="block">
        <div
          className={cn(
            'relative overflow-hidden bg-skeleton',
            isGateway
              ? 'h-[var(--h-gateway-mobile)] md:h-[var(--h-gateway-tablet)] lg:h-[var(--h-gateway-desktop)]'
              : 'aspect-[4/5]',
          )}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes={isGateway ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
            priority={priority}
            className="object-cover transition-transform duration-[var(--motion-standard)] ease-out group-hover:scale-[var(--scale-image-hover)]"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {latinLabel && (
            // 라틴 라벨은 디스플레이 사이즈로. 잡지 목차의 레지스터다 (§3 Principles)
            <div className="flex items-baseline gap-3">
              <h2 className="text-subhead font-bold lg:text-headline">{latinLabel}</h2>
              {count && (
                <span data-numeric className="text-meta text-muted-text">
                  {count}
                </span>
              )}
            </div>
          )}
          <h3
            className={cn(
              'font-bold text-ink',
              latinLabel ? 'text-body font-normal' : 'text-editorial',
            )}
          >
            {title}
          </h3>
          {description && <p className="text-body text-ink">{description}</p>}
        </div>
      </Link>
    </article>
  );
}
