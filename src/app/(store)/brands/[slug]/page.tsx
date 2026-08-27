import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Container } from '@/components/layout/container';
import { ProductCard } from '@/components/store/product-card';
import { LinkedFilterBar } from '@/components/store/linked-filter-bar';
import { EmptyResult } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { BRAND_COLUMNS } from '@/lib/nav';
import { byBrand, categoryTabs, toCardProps } from '@/lib/catalog';
import type { SortKey } from '@/components/store/product-filter-bar';

/**
 * 브랜드 목록 (docs/wireframes/02-brands-slug.md).
 *
 * 필터·정렬은 **URL 검색 파라미터**로 다룬다. 서버에서 걸러 렌더하므로
 * 공유·뒤로가기·SEO가 살아 있고, 상품이 많아져도 클라이언트로 다 내려보내지 않는다.
 *
 * TODO(data): DB 연결 후 `store_variants` 뷰 조회로 교체한다 —
 *             `product_variants` 직접 조회는 원가 노출이다 (PROJECT.md §3.1).
 */

const HERO: Record<string, { image: string; alt: string; blurb: string }> = {
  arcteryx: {
    image: '/images/gateways/arcteryx.webp',
    alt: '큰 배낭을 멘 사람이 아침 안개가 걸린 능선에 서서 골짜기를 내려다보고 있다',
    blurb: '캐나다에서 시작한 고기능 아웃도어예요. 국내에 안 들어온 라인을 캘거리에서 직접 골라요.',
  },
  lululemon: {
    image: '/images/gateways/lululemon.webp',
    alt: '해질 무렵 산을 배경으로 한 사람이 자전거를 타고 도로를 지나간다',
    blurb: '한국에 안 들어온 사이즈와 컬러웨이를 찾아요.',
  },
  coach: {
    image: '/images/gateways/coach.webp',
    alt: '흰 니트를 입고 어깨가방을 멘 사람이 승강장에 서 있고 뒤로 열차가 흐릿하게 지나간다',
    blurb: '가방과 지갑, 그리고 액세서리예요.',
  },
};

export function generateStaticParams() {
  return BRAND_COLUMNS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<'/brands/[slug]'>) {
  const { slug } = await params;
  const brand = BRAND_COLUMNS.find((b) => b.slug === slug);
  return { title: brand ? `${brand.label} — RICKY` : 'RICKY' };
}

function sortProducts<T extends { priceKrw: number; compareAtKrw?: number; arrivedAt: string }>(
  items: T[],
  sort: SortKey,
): T[] {
  const rate = (p: T) => (p.compareAtKrw ? 1 - p.priceKrw / p.compareAtKrw : 0);
  switch (sort) {
    case 'price_low':
      return [...items].sort((a, b) => a.priceKrw - b.priceKrw);
    case 'price_high':
      return [...items].sort((a, b) => b.priceKrw - a.priceKrw);
    case 'discount':
      return [...items].sort((a, b) => rate(b) - rate(a));
    case 'newest':
      return [...items].sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt));
    default:
      return items;
  }
}

export default async function BrandPage({ params, searchParams }: PageProps<'/brands/[slug]'>) {
  const { slug } = await params;
  const brand = BRAND_COLUMNS.find((b) => b.slug === slug);
  if (!brand) notFound();

  const sp = await searchParams;
  const category = typeof sp.category === 'string' ? sp.category : null;
  const sort = (typeof sp.sort === 'string' ? sp.sort : 'recommended') as SortKey;

  const hero = HERO[slug];
  const brandProducts = byBrand(slug);
  const inBrand = brandProducts.map(toCardProps);
  const filtered = category ? inBrand.filter((p) => p.category === category) : inBrand;
  const visible = sortProducts(filtered, sort);

  return (
    <>
      {/* 관문 사진은 목록에서도 유지한다 — 브랜드가 무엇인지 먼저 보여준다 */}
      {hero && (
        <Container as="section" className="pt-8">
          <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden bg-skeleton">
            <Image src={hero.image} alt={hero.alt} fill sizes="100vw" priority className="object-cover" />
          </div>
        </Container>
      )}

      <Container as="section" className="py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-headline font-bold">{brand.label}</h1>
            {hero && <p className="mt-2 max-w-[var(--measure-prose)] text-body text-ink">{hero.blurb}</p>}
          </div>
          <p data-numeric className="text-body text-muted-text">
            {visible.length}개
          </p>
        </div>

        {/* useSearchParams를 쓰므로 Suspense가 필요하다 (Next 16 정적 렌더 규칙) */}
        <Suspense fallback={<div className="mb-10 h-12 border-y border-outline" />}>
          <LinkedFilterBar tabs={categoryTabs(brandProducts)} basePath={`/brands/${slug}`} />
        </Suspense>

        {visible.length === 0 ? (
          <div className="flex flex-col items-start gap-6">
            <EmptyResult message="이 조건에 맞는 상품이 없어요." />
            <ButtonLink href={`/brands/${slug}`} chevron>
              전체 보기
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visible.map((product, i) => (
              <ProductCard key={product.id} {...product} priority={i < 6} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
