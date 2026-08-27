import { notFound } from 'next/navigation';
import { AdminSidebar, AdminTopBar } from '@/components/admin/admin-sidebar';
import { StatCard } from '@/components/admin/stat-card';
import { AlertLine, EmptyState, InvertedChip } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import Link from 'next/link';

/**
 * 관리자 화면 미리보기. **개발 환경 전용** — 프로덕션에서는 404다.
 *
 * `/admin`은 Supabase 세션과 `is_admin`을 요구해서 DB 연결 전에는 열 수 없다.
 * 셸과 컴포넌트를 눈으로 확인하려고 둔 것이며, 실제 라우트가 아니다.
 * 데이터는 전부 가짜다 — 여기서 본 숫자를 실제로 믿으면 안 된다.
 */
export const dynamic = 'force-static';

export default function AdminPreview() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar email="wodn72884376@gmail.com" />
        <main className="flex-1 px-6 py-8">
          <p className="mb-8 border border-outline px-4 py-3 text-meta text-muted-text">
            개발 미리보기 — 아래 숫자는 전부 가짜예요. 실제 화면은 <code>/admin</code>이에요.
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-headline font-bold">대시보드</h1>
              <p className="mt-1 text-body text-muted-text">지금 손대야 하는 것부터 보여드려요.</p>
            </div>
            <ButtonLink href="/admin/products/new" variant="inverted" size="md">
              상품 등록
            </ButtonLink>
          </div>

          <section className="mt-10">
            <div className="flex items-center gap-3">
              <h2 className="text-editorial font-bold">처리 대기</h2>
              <InvertedChip>4</InvertedChip>
            </div>
            <ul className="mt-4 border border-outline">
              {[
                ['가격 변경 승인', "Arc'teryx Beta LT — 원가 12% 상승, 마진 9%", '지금'],
                ['발주 대기', 'Coach Tabby 26 · 주문 R260826-7F3K9Q', '2시간 전'],
                ['출고 대기', '3건 · 오늘 출고분', '오늘'],
                ['문의 미답변', '통관 관련 1건', '어제'],
              ].map(([title, detail, when]) => (
                <li key={title} className="flex items-center justify-between gap-4 border-b border-outline px-5 py-4 last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-util font-bold text-ink">{title}</p>
                    <p className="mt-0.5 truncate text-meta text-muted-text">{detail}</p>
                  </div>
                  <span className="shrink-0 text-meta text-muted-text">{when}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="text-editorial font-bold">공급처 상태</h2>
            <div className="mt-4 flex flex-col gap-3 border border-outline p-5">
              <AlertLine message="아크테릭스 3회 연속 실패" detail="마지막 성공 6시간 전" />
              <p className="text-meta text-muted-text">룰루레몬 · 코치 정상</p>
              <Link href="/admin/monitoring" className="mt-1 inline-flex text-util font-bold text-ink underline underline-offset-4">
                모니터링 보드
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-editorial font-bold">현황</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="등록 상품" value="128" unit="개" note="이번 주 +12" href="/admin/products" />
              <StatCard label="주문" value="34" unit="건" note="어제 대비 +6" href="/admin/orders" />
              <StatCard label="재고 미확인" value="7" unit="개" note="6시간 임계 초과" alert href="/admin/monitoring" />
              <StatCard label="미답변 문의" value="1" unit="건" href="/admin/inquiries" />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-editorial font-bold">빈 상태</h2>
            <div className="mt-4 border border-outline">
              <EmptyState
                className="items-center px-6 py-12 text-center"
                message="지금 처리할 일이 없어요."
                action={<ButtonLink href="/admin/products/new" chevron>상품 등록하기</ButtonLink>}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
