import { Container, NarrowShell } from '@/components/layout/container';
import { ProductCard } from '@/components/store/product-card';
import { EmptyResult } from '@/components/ui/states';
import { searchProducts, toCardProps } from '@/lib/catalog';
import { SearchForm } from './search-form';

export const metadata = { title: '검색 — RICKY' };

/**
 * 검색 결과 (docs/IA.md §1).
 *
 * 질의는 URL에 남긴다 — 공유되고, 뒤로가기가 동작하고, 색인된다.
 * 형태소 분석 없이 부분 일치만 한다. 카탈로그가 작을 때 과한 도구를 들이지 않는다.
 */
export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const results = q ? searchProducts(q).map(toCardProps) : [];

  return (
    <Container as="section" className="py-10 lg:py-14">
      <NarrowShell width="form" className="mx-0">
        <h1 className="text-headline font-bold">검색</h1>
        <SearchForm initialQuery={q} />
      </NarrowShell>

      {q && (
        <div className="mt-12">
          <p className="text-body text-muted-text">
            <span className="text-ink">{q}</span> 검색 결과 <span data-numeric>{results.length}</span>개
          </p>

          {results.length === 0 ? (
            <EmptyResult message="검색 결과가 없어요. 브랜드나 상품명으로 다시 찾아보세요." />
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {results.map((product, i) => (
                <ProductCard key={product.id} {...product} priority={i < 6} />
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
