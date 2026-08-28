import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

/**
 * 크롤러 규칙.
 *
 * 막는 곳의 기준은 하나다 — **개인 데이터가 걸려 있거나, 우리만 보는 화면**.
 * 상품·가이드·정책은 전부 열어 둔다. 색인되어야 사람이 찾아온다.
 *
 * `/dev`는 컴포넌트 프리뷰라 실제 상품처럼 보이는 더미가 섞여 있다.
 * 색인되면 검색 결과에 가짜 상품이 뜬다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',        // 운영 대시보드
        '/dev',          // 컴포넌트 프리뷰 — 더미 데이터가 있다
        '/cart',         // 개인 상태
        '/checkout',
        '/orders',       // 주문번호가 URL에 있다
        '/login',
        '/auth',
        '/search?',      // 질의 조합이 무한히 늘어난다
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
