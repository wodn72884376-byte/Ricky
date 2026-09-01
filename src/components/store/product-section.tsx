'use client';

import { useMemo, useState } from 'react';
import { ProductCard, type ProductCardProps } from './product-card';
import { cn } from '@/lib/utils/cn';
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

/**
 * 3줄까지만 노출할 때 그리드에 얹는 규칙.
 *
 * 열 수가 뷰포트마다 다르므로(2/3/4/5/6) "3줄"은 **고정된 개수가 아니다** —
 * 6·9·12·15·18개가 각각 3줄이다. 그래서 JS로 자르지 않고 CSS로 넘치는 것만 감춘다.
 *
 * 구간이 서로 겹치지 않게 `md:max-lg:` 처럼 **양끝을 다 묶었다.** `md:` 로만 쓰면
 * 좁은 구간에서 숨긴 것을 넓은 구간에서 다시 꺼내야 하는데, 같은 `display` 속성을
 * 같은 특이도로 두 번 거는 셈이라 어느 쪽이 이길지는 Tailwind 의 정렬 순서에 달린다.
 * 한 뷰포트가 정확히 한 규칙에만 걸리게 두면 그 문제가 사라진다.
 */
const THREE_ROWS = [
  'max-md:[&>*:nth-child(n+7)]:hidden',      // 2열 × 3줄 = 6
  'md:max-lg:[&>*:nth-child(n+10)]:hidden',  // 3열 × 3줄 = 9
  'lg:max-xl:[&>*:nth-child(n+13)]:hidden',  // 4열 × 3줄 = 12
  'xl:max-2xl:[&>*:nth-child(n+16)]:hidden', // 5열 × 3줄 = 15
  // 2xl 은 6열이라 18개가 그대로 3줄이다 — 감출 것이 없다
].join(' ');

/** 3줄이 가장 넓은 화면에서 필요로 하는 개수. 그 이상은 어차피 보이지 않으므로 그리지 않는다 */
const THREE_ROWS_MAX = 18;

export function ProductSection({
  products,
  tabs,
  previewRows,
}: {
  products: SectionProduct[];
  tabs: CategoryTab[];
  /**
   * 3줄까지만 보여준다. 홈처럼 `더 보기` 로 전체 목록에 넘기는 자리에 쓴다.
   * 리터럴 `3` 만 받는다 — 다른 값은 위 CSS가 지원하지 않으므로 타입에서 막는다.
   */
  previewRows?: 3;
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
        <div
          className={cn(
            'grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
            previewRows === 3 && THREE_ROWS,
          )}
        >
          {(previewRows === 3 ? visible.slice(0, THREE_ROWS_MAX) : visible).map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </>
  );
}
