import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/stat-card';
import { AlertLine, EmptyState, InvertedChip } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

/**
 * 관리자 대시보드 (docs/wireframes/08-admin.md).
 *
 * 운영자가 **지금 손대야 하는 것**을 먼저 보여준다. 예쁜 수치보다 액션 큐가 위다 —
 * 이 화면의 목적은 보고가 아니라 처리다.
 */

async function loadCounts() {
  const supabase = await createClient();
  const count = async (table: 'products' | 'orders' | 'supplier_listings') => {
    const { count: n } = await supabase.from(table).select('*', { count: 'exact', head: true });
    return n ?? 0;
  };

  /*
    문의는 **미답변만** 센다. 전체를 세면 카드 라벨(`미답변 문의`)과 숫자가 어긋나고,
    답변을 다 해도 숫자가 줄지 않아 처리 큐로 쓸 수 없다.
  */
  const pendingInquiries = async () => {
    const { count: n } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');
    return n ?? 0;
  };

  const [products, orders, listings, inquiries] = await Promise.all([
    count('products'), count('orders'), count('supplier_listings'), pendingInquiries(),
  ]);
  return { products, orders, listings, inquiries };
}

export default async function AdminHome() {
  let counts = { products: 0, orders: 0, listings: 0, inquiries: 0 };
  let reachable = true;
  try {
    counts = await loadCounts();
  } catch {
    // Supabase 미연결 상태에서도 셸은 렌더돼야 한다. 숫자를 지어내지 않는다.
    reachable = false;
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline font-bold">대시보드</h1>
          <p className="mt-1 text-body text-muted-text">지금 손대야 하는 것부터 보여드려요.</p>
        </div>
        <ButtonLink href="/admin/products/new" variant="inverted" size="md">
          상품 등록
        </ButtonLink>
      </div>

      {!reachable && (
        <p role="status" className="mt-6 border border-outline p-4 text-body text-muted-text">
          데이터베이스에 연결되지 않았어요. `.env.local`의 Supabase 키를 채우면 실제 수치가 나와요.
        </p>
      )}

      {/* 액션 큐 — 이 화면의 주인공 */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="text-editorial font-bold">처리 대기</h2>
          <InvertedChip>0</InvertedChip>
        </div>

        {/* TODO(data): 승인 대기 / 발주 대기 / 출고 대기의 소스 쿼리 미확정 (docs/wireframes/08-admin.md §7) */}
        <div className="mt-4 border border-outline">
          <EmptyState
            className="items-center px-6 py-12 text-center"
            message="지금 처리할 일이 없어요."
            action={
              <ButtonLink href="/admin/products/new" chevron>
                상품 등록하기
              </ButtonLink>
            }
          />
        </div>
      </section>

      {/* 공급처 경보 — 재고 신선도가 깨지면 결제가 막힌다 (PROJECT.md §6.5) */}
      <section className="mt-12">
        <h2 className="text-editorial font-bold">공급처 상태</h2>
        <div className="mt-4 flex flex-col gap-2 border border-outline p-5">
          {counts.listings === 0 ? (
            <p className="text-body text-muted-text">
              모니터링 중인 상품이 아직 없어요. 상품을 등록하면 공식몰 재고를 추적해요.
            </p>
          ) : (
            <AlertLine message={`모니터링 ${counts.listings}건`} detail="최근 수집 이상 없음" />
          )}
          <Link href="/admin/monitoring" className="mt-2 inline-flex text-util font-bold text-ink underline underline-offset-4">
            모니터링 보드
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-editorial font-bold">현황</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="등록 상품" value={String(counts.products)} unit="개" href="/admin/products" />
          <StatCard label="주문" value={String(counts.orders)} unit="건" href="/admin/orders" />
          <StatCard label="모니터링 대상" value={String(counts.listings)} unit="개" href="/admin/monitoring" />
          <StatCard label="미답변 문의" value={String(counts.inquiries)} unit="건" href="/admin/inquiries" />
        </div>
        <p className="mt-4 text-meta text-muted-text">
          매출·마진은 주문이 쌓이면 <Link href="/admin/reports" className="text-ink underline underline-offset-4">리포트</Link>에서 볼 수 있어요.
        </p>
      </section>
    </>
  );
}
