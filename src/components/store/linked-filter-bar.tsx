'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ProductFilterBar, type CategoryTab, type SortKey } from './product-filter-bar';

/**
 * URL과 동기화되는 필터 바.
 *
 * 홈의 `ProductSection`은 지역 상태를 쓰지만 실제 목록 페이지는 URL이어야 한다 —
 * 그래야 필터 건 상태를 공유하고, 뒤로가기로 돌아오고, 검색엔진이 색인한다 (docs/IA.md §4).
 *
 * `replace`를 쓴다. 필터를 여러 번 바꿀 때마다 히스토리가 쌓이면
 * 뒤로가기를 열 번 눌러야 이전 페이지로 나간다.
 */
export function LinkedFilterBar({
  tabs,
  basePath,
}: {
  tabs: CategoryTab[];
  basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get('category');
  const sort = (params.get('sort') as SortKey | null) ?? 'recommended';

  function push(next: { category?: string | null; sort?: SortKey }) {
    const q = new URLSearchParams(params.toString());

    if ('category' in next) {
      if (next.category) q.set('category', next.category);
      else q.delete('category');
    }
    if (next.sort) {
      // 기본값은 URL에 남기지 않는다 — 주소가 지저분해지고 정규 URL이 갈린다
      if (next.sort === 'recommended') q.delete('sort');
      else q.set('sort', next.sort);
    }

    const query = q.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }

  return (
    <ProductFilterBar
      tabs={tabs}
      activeTab={category}
      onTabChange={(value) => push({ category: value })}
      sort={sort}
      onSortChange={(value) => push({ sort: value })}
      className="mb-10"
    />
  );
}
