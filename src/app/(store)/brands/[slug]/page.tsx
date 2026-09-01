import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Container } from '@/components/layout/container';
import { ProductCard } from '@/components/store/product-card';
import { LinkedFilterBar } from '@/components/store/linked-filter-bar';
import { EmptyResult, EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { BRAND_COLUMNS, GENDER_LABEL, parseGender } from '@/lib/nav';
import { byBrand, categoryTabs, filterGender, toCardProps } from '@/lib/catalog';
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

/**
 * 관문 사진. **사진이 없는 브랜드는 여기 넣지 않는다** —
 * 자리를 채우려고 아무 사진이나 쓰면 이 지면의 전제(§12-1 이미지가 곧 헤드라인)가 무너진다.
 */
const HERO: Record<string, { image: string; alt: string }> = {
  arcteryx: {
    image: '/images/gateways/arcteryx.webp',
    alt: '큰 배낭을 멘 사람이 아침 안개가 걸린 능선에 서서 골짜기를 내려다보고 있다',
  },
  lululemon: {
    image: '/images/gateways/lululemon.webp',
    alt: '해질 무렵 산을 배경으로 한 사람이 자전거를 타고 도로를 지나간다',
  },
  coach: {
    image: '/images/gateways/coach.webp',
    alt: '흰 니트를 입고 어깨가방을 멘 사람이 승강장에 서 있고 뒤로 열차가 흐릿하게 지나간다',
  },
};

/** 브랜드 한 줄 소개. 사진과 달리 모든 브랜드가 가진다. */
const BLURB: Record<string, string> = {
  arcteryx: '캐나다에서 시작한 고기능 아웃도어입니다. 국내에 안 들어온 라인을 캘거리에서 직접 고릅니다.',
  lululemon: '한국에 안 들어온 사이즈와 컬러웨이를 찾습니다.',
  coach: '가방과 지갑, 그리고 액세서리입니다.',
  polo: '북미 매장의 폴로 라인입니다. 한국에 없는 사이즈와 컬러웨이를 봅니다.',
  tommy: '북미 매장 기준의 기본 라인입니다. 사이즈 표기가 한국과 달라 실측을 함께 적습니다.',
  'canada-goose': '캐나다 브랜드의 겨울 아우터입니다. 원산지는 상품마다 실물 라벨을 확인해 적습니다.',
  nobis: '토론토에서 시작한 아우터 브랜드입니다.',
};

export function generateStaticParams() {
  return BRAND_COLUMNS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<'/brands/[slug]'>) {
  const { slug } = await params;
  const brand = BRAND_COLUMNS.find((b) => b.slug === slug);
  return { title: brand ? brand.label : '없는 브랜드입니다' };
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
  // 메가 메뉴가 `?gender=`를 달고 들어온다. unisex는 양쪽에 모두 나온다.
  const gender = parseGender(sp.gender);

  const hero = HERO[slug];
  const blurb = BLURB[slug];
  const brandProducts = filterGender(byBrand(slug), gender);
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
            {gender && (
              <p className="mt-1 text-meta text-muted-text">
                {GENDER_LABEL[gender]}
              </p>
            )}
            {blurb && <p className="mt-2 max-w-[var(--measure-prose)] text-body text-ink">{blurb}</p>}
          </div>
          {brandProducts.length > 0 && (
            <p data-numeric className="text-body text-muted-text">
              {visible.length}개
            </p>
          )}
        </div>

        {/*
          아직 한 점도 매입하지 않은 브랜드는 필터를 걸 대상이 없다.
          "조건에 맞는 상품이 없어요"는 필터를 조정하라는 뜻이라 여기서는 거짓말이 된다.
        */}
        {brandProducts.length === 0 ? (
          <EmptyState
            className="border-t border-outline"
            /* 라틴 표기 뒤 조사는 한글 발음을 따라가므로 라벨에 조사를 직접 붙이지 않는다 —
               `Nobis은`이 되지 않도록 항상 `상품은`을 사이에 둔다 */
            message={
              gender
                ? `${brand.label} ${GENDER_LABEL[gender]} 상품은 아직 준비하고 있습니다.`
                : `${brand.label} 상품은 아직 준비하고 있습니다. 매입이 시작되면 여기에 올라옵니다.`
            }
            action={
              <ButtonLink href="/brands/arcteryx" chevron>
                지금 있는 상품 보기
              </ButtonLink>
            }
          />
        ) : (
          <>
            {/* useSearchParams를 쓰므로 Suspense가 필요하다 (Next 16 정적 렌더 규칙) */}
            <Suspense fallback={<div className="mb-10 h-12 border-y border-outline" />}>
              <LinkedFilterBar tabs={categoryTabs(brandProducts)} basePath={`/brands/${slug}`} />
            </Suspense>

            {visible.length === 0 ? (
              <div className="flex flex-col items-start gap-6">
                <EmptyResult message="이 조건에 맞는 상품이 없습니다." />
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
          </>
        )}
      </Container>
    </>
  );
}
