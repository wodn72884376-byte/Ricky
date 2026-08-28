import type { MetadataRoute } from 'next';
import { allProducts } from '@/lib/catalog';
import { BRAND_COLUMNS } from '@/lib/nav';
import { siteUrl } from '@/lib/site';

/**
 * 색인 대상 목록.
 *
 * **관리자(`/admin`)와 개발 프리뷰(`/dev`)는 넣지 않는다.** robots에서도 막지만,
 * 사이트맵은 "여기를 봐 달라"는 초대장이므로 애초에 초대하지 않는다.
 *
 * 결제·주문 조회처럼 개인 데이터가 걸린 화면도 뺀다 — 색인될 이유가 없다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  ) => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority });

  return [
    entry('/', 1, 'daily'),
    entry('/shop', 0.9, 'daily'),
    entry('/best', 0.8, 'daily'),

    // 브랜드는 아직 매입하지 않은 곳도 넣는다 — 빈 목록이 아니라
    // "준비하고 있어요"를 보여주는 실제 지면이고, 브랜드명 검색으로 들어온다.
    ...BRAND_COLUMNS.map((b) => entry(`/brands/${b.slug}`, 0.8, 'daily')),

    // 상품이 이 사이트에서 가장 자주 바뀐다. 가격·재고가 움직인다.
    ...allProducts().map((p) => entry(`/products/${p.slug}`, 0.7, 'daily')),

    entry('/about', 0.6, 'monthly'),
    entry('/guide/customs', 0.6, 'monthly'),
    entry('/guide/sizing', 0.6, 'monthly'),
    entry('/guide/inspection', 0.6, 'monthly'),
    entry('/support', 0.5, 'weekly'),

    entry('/policy/shipping', 0.4, 'monthly'),
    entry('/policy/returns', 0.4, 'monthly'),
    entry('/policy/terms', 0.3, 'yearly'),
    entry('/policy/privacy', 0.3, 'yearly'),
  ];
}
