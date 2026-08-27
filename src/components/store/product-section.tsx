'use client';

import { useMemo, useState } from 'react';
import { ProductCard, type ProductCardProps } from './product-card';
import { EmptyResult } from '@/components/ui/states';
import {
  ProductFilterBar,
  type CategoryTab,
  type SortKey,
} from './product-filter-bar';

/**
 * 필터·정렬이 붙은 상품 그리드.
 *
 * 지금은 넘겨받은 배열을 지역 상태로 거른다. 실제 목록 페이지에서는 같은 UI가
 * URL 검색 파라미터를 갱신하고 서버에서 걸러야 한다 (docs/IA.md §4) —
 * 그래야 공유·뒤로가기·SEO가 산다.
 */

export type SectionProduct = ProductCardProps & {
  id: string;
  category: string;
  /** 신상품순 정렬용 */
  arrivedAt?: string;
};

export function ProductSection({
  products,
  tabs,
}: {
  products: SectionProduct[];
  tabs: CategoryTab[];
}) {
  const [tab, setTab] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recommended');

  const visible = useMemo(() => {
    const filtered = tab ? products.filter((p) => p.category === tab) : products;
    const rate = (p: SectionProduct) =>
      p.compareAtKrw ? 1 - p.priceKrw / p.compareAtKrw : 0;

    switch (sort) {
      case 'price_low':
        return [...filtered].sort((a, b) => a.priceKrw - b.priceKrw);
      case 'price_high':
        return [...filtered].sort((a, b) => b.priceKrw - a.priceKrw);
      case 'discount':
        return [...filtered].sort((a, b) => rate(b) - rate(a));
      case 'newest':
        return [...filtered].sort((a, b) => (b.arrivedAt ?? '').localeCompare(a.arrivedAt ?? ''));
      default:
        return filtered;
    }
  }, [products, tab, sort]);

  return (
    <>
      <ProductFilterBar
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        sort={sort}
        onSortChange={setSort}
        className="mb-10"
      />

      {visible.length === 0 ? (
        <EmptyResult />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {visible.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </>
  );
}
