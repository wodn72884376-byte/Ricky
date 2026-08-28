import type { ReactNode } from 'react';
import { brandMenu } from '@/lib/catalog';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ScrollTop } from '@/components/layout/scroll-top';

/**
 * 스토어 셸. 헤더·푸터·맨 위로 버튼은 모든 고객 대면 화면이 공유한다.
 * 관리자(`/admin`)는 자체 셸을 쓴다 — 사이드바 없이 상단 유틸리티 행 하나 (DESIGN.md §5).
 *
 * 메가 메뉴 내용은 **여기 서버에서** 만든다. 카탈로그 전체를 클라이언트 번들에
 * 실어 보내지 않기 위함이고, 성별마다 실제로 상품이 있는 것만 남기기 위함이다.
 */
export default function StoreLayout({ children }: { children: ReactNode }) {
  const menus = { men: brandMenu('men'), women: brandMenu('women') };

  return (
    <>
      <SiteHeader menus={menus} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ScrollTop />
    </>
  );
}
