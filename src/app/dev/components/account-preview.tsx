'use client';

import { useId, useState } from 'react';
import { AccountDropdown, SignedOutActions } from '@/components/layout/account-menu';

/**
 * 계정 영역 프리뷰. 실제 세션 없이 두 상태를 나란히 본다.
 * 드롭다운은 기본으로 열어둔다 — 닫혀 있으면 확인할 것이 없다.
 */
export function AccountPreview() {
  const [open, setOpen] = useState(true);
  const menuId = useId();

  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="mb-4 text-meta text-muted-text">비로그인</p>
        <SignedOutActions />
      </div>

      <div>
        <p className="mb-4 text-meta text-muted-text">로그인 (드롭다운 열림)</p>
        {/* 드롭다운이 아래 콘텐츠를 덮지 않도록 자리를 비워둔다 */}
        <div className="h-80">
          <AccountDropdown
            email="wodn72884376@gmail.com"
            open={open}
            onToggle={() => setOpen((v) => !v)}
            onClose={() => setOpen(false)}
            onSignOut={() => setOpen(false)}
            menuId={menuId}
          />
        </div>
      </div>
    </div>
  );
}
