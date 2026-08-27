import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/auth';
import { AdminSidebar, AdminTopBar } from '@/components/admin/admin-sidebar';

/**
 * 관리자 셸. RLS(is_admin)와 별개로 라우트 레벨에서도 한 번 막는다.
 * 관리자가 아닌 로그인 사용자는 스토어로 되돌린다.
 */
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
