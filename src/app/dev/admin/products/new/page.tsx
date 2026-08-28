import { notFound } from 'next/navigation';
import { AdminSidebar, AdminTopBar } from '@/components/admin/admin-sidebar';
import { BRAND_COLUMNS } from '@/lib/nav';
import { ProductForm } from '@/app/admin/products/new/product-form';

/**
 * 상품 등록 화면 미리보기. **개발 환경 전용** — 프로덕션에서는 404다.
 *
 * `/admin/products/new`는 세션과 `is_admin`을 요구해서 DB 연결 전에는 열 수 없다.
 * 폼과 산출 패널을 눈으로 확인하려고 둔 것이다. 저장은 실제 액션을 타므로
 * Supabase 미연결 상태에서는 연결 안내 문구가 뜬다 — 가짜로 성공시키지 않는다.
 */
export const dynamic = 'force-static';

export default function NewProductPreview() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar email="wodn72884376@gmail.com" />
        <main className="flex-1 px-6 py-8">
          <p className="mb-8 border border-outline px-4 py-3 text-meta text-muted-text">
            개발 미리보기 — 실제 화면은 <code>/admin/products/new</code>예요.
          </p>
          <ProductForm brands={BRAND_COLUMNS.map((b) => ({ value: b.slug, label: b.label }))} />
        </main>
      </div>
    </div>
  );
}
