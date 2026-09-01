import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/auth';
import { AdminSidebar, AdminTopBar } from '@/components/admin/admin-sidebar';

/**
 * 관리자 셸. RLS(is_admin)와 별개로 라우트 레벨에서도 한 번 막는다.
 * 관리자가 아닌 로그인 사용자는 스토어로 되돌린다.
 */
/**
 * 관리자 화면의 제목 템플릿. 루트의 `%s — RICKY` 를 이 세그먼트에서 덮는다 —
 * 운영 화면과 스토어 화면이 탭에서 구분돼야 한다.
 */
export const metadata = {
  title: { template: '%s — RICKY 운영', default: 'RICKY 운영' },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) redirect('/login?next=/admin');
  if (!user.isAdmin) redirect('/');

  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar email={user.email} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
