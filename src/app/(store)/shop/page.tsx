import Link from 'next/link';
import { Suspense } from 'react';
import { Container } from '@/components/layout/container';
import { LinkedFilterBar } from '@/components/store/linked-filter-bar';
import { ProductCard } from '@/components/store/product-card';
import type { SortKey } from '@/components/store/product-filter-bar';
import { ButtonLink } from '@/components/ui/button';
import { EmptyResult, EmptyState } from '@/components/ui/states';
import { allProducts, categoryTabs, filterGender, toCardProps } from '@/lib/catalog';
import { BRAND_COLUMNS, GENDER_LABEL, parseGender } from '@/lib/nav';
import { cn } from '@/lib/utils/cn';

/**
 * 브랜드 교차 목록. 메가 메뉴의 `Men's` / `Women's` 상단 라벨이 여기로 온다 (docs/IA.md §1).
 *
 * 브랜드 페이지와 같은 규칙이다 — 필터는 URL 검색 파라미터이고, 서버에서 걸러 렌더한다.
 * 성별에 맞는 상품이 없는 브랜드·카테고리는 아예 그리지 않는다.
 */


export async function generateMetadata({ searchParams }: PageProps<'/shop'>) {
  const sp = await searchParams;
  const gender = parseGender(sp.gender);
  return { title: gender ? GENDER_LABEL[gender] : '전체 상품' };
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

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
  const sp = await searchParams;
  const gender = parseGender(sp.gender);
  const category = typeof sp.category === 'string' ? sp.category : null;
  const sort = (typeof sp.sort === 'string' ? sp.sort : 'recommended') as SortKey;

  const scoped = filterGender(allProducts(), gender);
  const cards = scoped.map(toCardProps);
  const filtered = category ? cards.filter((p) => p.category === category) : cards;
  const visible = sortProducts(filtered, sort);

  // 이 성별에 상품이 있는 브랜드만 줄에 세운다
  const brandsWithStock = BRAND_COLUMNS.filter((b) => scoped.some((p) => p.brandSlug === b.slug));

  const query = (extra: Record<string, string>) => {
    const q = new URLSearchParams();
    if (gender) q.set('gender', gender);
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '';
  };

  return (
    <Container as="section" className="py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline font-bold">{gender ? GENDER_LABEL[gender] : '전체 상품'}</h1>
          <p className="mt-2 text-body text-muted-text">
            캘거리에서 직접 골라 매입한 상품입니다.
          </p>
        </div>
        {scoped.length > 0 && (
          <p data-numeric className="text-body text-muted-text">
            {visible.length}개
          </p>
        )}
      </div>

      {brandsWithStock.length > 0 && (
        <nav
          aria-label="브랜드"
          className="mt-6 flex items-center gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brandsWithStock.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}${query({})}`}
              className={cn('flex h-11 shrink-0 items-center text-util font-semibold text-ink hover:underline')}
            >
              {brand.label}
            </Link>
          ))}
        </nav>
      )}

      {scoped.length === 0 ? (
        <EmptyState
          className="border-t border-outline"
          message="이 조건에 맞는 상품이 아직 없습니다."
          action={
            <ButtonLink href="/shop" chevron>
              전체 상품 보기
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Suspense fallback={<div className="mb-10 h-12 border-y border-outline" />}>
            <LinkedFilterBar tabs={categoryTabs(scoped)} basePath="/shop" />
          </Suspense>

          {visible.length === 0 ? (
            <div className="flex flex-col items-start gap-6">
              <EmptyResult message="이 조건에 맞는 상품이 없습니다." />
              <ButtonLink href={`/shop${query({})}`} chevron>
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
  );
}
