import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingInquiry } from '@/components/layout/floating-inquiry';

/**
 * 스토어 셸. 헤더·푸터·플로팅 문의는 모든 고객 대면 화면이 공유한다.
 * 관리자(`/admin`)는 자체 셸을 쓴다 — 사이드바 없이 상단 유틸리티 행 하나 (DESIGN.md §5).
 */
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingInquiry />
    </>
  );
}
