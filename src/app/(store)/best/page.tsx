import { Suspense } from 'react';
import { Container } from '@/components/layout/container';
import { LinkedFilterBar } from '@/components/store/linked-filter-bar';
import { ProductCard } from '@/components/store/product-card';
import type { SortKey } from '@/components/store/product-filter-bar';
import { ButtonLink } from '@/components/ui/button';
import { EmptyResult } from '@/components/ui/states';
import { bestSellers, categoryTabs, sortCards, toCardProps } from '@/lib/catalog';

export const metadata = {
  title: 'BEST — RICKY',
  description: '한국 정발가와 가장 크게 벌어지는 상품부터 보여드려요.',
};

/**
 * BEST 큐레이션 (docs/IA.md §1).
 *
 * 주문이 쌓이기 전이라 판매량을 알 수 없다. **인기 순위를 지어내지 않고**
 * 정발가와의 차이가 큰 순으로 둔다 (`bestSellers`). 그 사실을 화면에도 쓴다.
 */
const COUNT = 24;

export default async function BestPage({ searchParams }: PageProps<'/best'>) {
  const sp = await searchParams;
  const category = typeof sp.category === 'string' ? sp.category : null;
  const sort = (typeof sp.sort === 'string' ? sp.sort : 'recommended') as SortKey;

  const products = bestSellers(COUNT);
  const cards = products.map(toCardProps);
  const filtered = category ? cards.filter((p) => p.category === category) : cards;
  const visible = sortCards(filtered, sort);

  return (
    <Container as="section" className="py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline font-bold">BEST</h1>
          <p className="mt-2 max-w-[var(--measure-prose)] text-body text-muted-text">
            아직 주문이 충분히 쌓이지 않아 판매량 순위를 낼 수 없어요. 지금은 한국 정발가와 가장 크게
            벌어지는 순으로 보여드려요.
          </p>
        </div>
        <p data-numeric className="text-body text-muted-text">
          {visible.length}개
        </p>
      </div>

      <Suspense fallback={<div className="mb-10 h-12 border-y border-outline" />}>
        <LinkedFilterBar tabs={categoryTabs(products)} basePath="/best" />
      </Suspense>

      {visible.length === 0 ? (
        <div className="flex flex-col items-start gap-6">
          <EmptyResult message="이 조건에 맞는 상품이 없어요." />
          <ButtonLink href="/best" chevron>
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
  );
}
