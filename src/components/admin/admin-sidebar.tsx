'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import {
  Chart, Chat, ChevronRight, Gear, Grid, Layers,
  PanelLeft, Radar, Receipt, Tag,
} from '@/components/ui/icons';
import { isOpen, isOpenOnServer, subscribe, toggle } from '@/lib/sidebar-store';
import { cn } from '@/lib/utils/cn';

/**
 * 관리자 사이드바 (접힘 가능).
 *
 * DESIGN.md §5는 원래 "대시보드에 사이드바를 두지 않는다"였다. 관리자 라우트가 14개로
 * 늘면서 상단 한 행에 들어가지 않아 예외로 두고 스펙을 고쳤다.
 *
 * 시각 언어는 스토어와 같다 — 그림자 없음, 반경 0/2/4, 흑백.
 * 선택 표시는 색이 아니라 **반전**이다. 컬러 좌측 보더를 쓰지 않는다.
 */

const SECTIONS: { heading?: string; items: { href: string; label: string; Icon: typeof Grid }[] }[] = [
  { items: [{ href: '/admin', label: '대시보드', Icon: Grid }] },
  {
    heading: '카탈로그',
    items: [
      { href: '/admin/products', label: '상품', Icon: Tag },
      { href: '/admin/inventory', label: '재고', Icon: Layers },
      { href: '/admin/purchases', label: '매입', Icon: Receipt },
    ],
  },
  {
    heading: '판매',
    items: [
      { href: '/admin/orders', label: '주문', Icon: Receipt },
      { href: '/admin/shipments', label: '배송', Icon: Layers },
      { href: '/admin/inquiries', label: '문의', Icon: Chat },
    ],
  },
  {
    heading: '운영',
    items: [
      { href: '/admin/monitoring', label: '공급처 모니터링', Icon: Radar },
      { href: '/admin/reports', label: '매출·마진', Icon: Chart },
      { href: '/admin/settings', label: '설정', Icon: Gear },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const open = useSyncExternalStore(subscribe, isOpen, isOpenOnServer);

  return (
    <nav
      aria-label="관리자 메뉴"
      className={cn(
        'sticky top-0 flex h-dvh shrink-0 flex-col border-r border-outline bg-paper',
        'transition-[width] duration-[var(--motion-standard)] ease-out',
        open ? 'w-60' : 'w-16',
      )}
    >
      <div className={cn('flex h-14 shrink-0 items-center border-b border-outline', open ? 'px-4' : 'justify-center')}>
        <Link href="/admin" className="flex min-h-11 items-center gap-2 text-nav font-extrabold tracking-tight text-ink">
          RICKY
          {open && <span className="text-meta font-normal text-muted-text">운영</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((section, i) => (
          <div key={section.heading ?? i} className={cn(i > 0 && 'mt-5')}>
            {/* 접혔을 때 섹션 헤딩은 자리만 차지하므로 감춘다 */}
            {section.heading && open && (
              <p className="px-4 pb-1 text-meta font-bold uppercase tracking-wide text-muted-text">
                {section.heading}
              </p>
            )}
            <ul>
              {section.items.map(({ href, label, Icon }) => {
                // `/admin`은 정확히 일치할 때만 활성 — 하위 경로마다 켜지면 안 된다
                const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      title={open ? undefined : label}
                      className={cn(
                        'mx-2 flex h-11 items-center gap-3 rounded-ghost px-3',
                        'transition-colors duration-[var(--motion-quick)]',
                        open ? 'justify-start' : 'justify-center',
                        // 선택은 반전으로. 컬러 보더를 쓰지 않는다 (§6 Inverted)
                        active ? 'bg-ink text-paper' : 'text-ink hover:bg-skeleton',
                      )}
                    >
                      <Icon />
                      {open ? <span className="text-util">{label}</span> : <span className="sr-only">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          'flex h-12 shrink-0 items-center gap-3 border-t border-outline px-4',
          'text-util text-muted-text transition-colors hover:text-ink',
          !open && 'justify-center px-0',
        )}
      >
        <PanelLeft />
        {open ? '접기' : <span className="sr-only">메뉴 펼치기</span>}
      </button>
    </nav>
  );
}

/** 스토어로 돌아가는 링크. 운영자는 자기 화면을 자주 확인한다. */
export function AdminTopBar({ email }: { email: string | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-outline px-6">
      <Link href="/" className="flex min-h-11 items-center gap-1.5 text-util text-ink">
        스토어 보기
        <ChevronRight size={14} />
      </Link>
      {email && <span className="text-meta text-muted-text">{email}</span>}
    </header>
  );
}
