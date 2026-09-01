import type { ReactNode } from 'react';
import { brandMenu } from '@/lib/catalog';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingControls } from '@/components/layout/floating-controls';

/**
 * 스토어 셸. 고지 바·헤더·푸터·우하단 플로팅 컨트롤은 모든 고객 대면 화면이 공유한다.
 * 고지 바는 헤더 위에 있고 스티키가 아니다 — 스크롤하면 흘러가고 헤더만 붙어 있는다.
 * 관리자(`/admin`)는 자체 셸을 쓴다 — 사이드바 없이 상단 유틸리티 행 하나 (DESIGN.md §5).
 *
 * 메가 메뉴 내용은 **여기 서버에서** 만든다. 카탈로그 전체를 클라이언트 번들에
 * 실어 보내지 않기 위함이고, 성별마다 실제로 상품이 있는 것만 남기기 위함이다.
 */
export default function StoreLayout({ children }: { children: ReactNode }) {
  const menus = { men: brandMenu('men'), women: brandMenu('women'), kids: brandMenu('kids') };

  return (
    <>
      <AnnouncementBar />
      <SiteHeader menus={menus} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingControls />
    </>
  );
}
