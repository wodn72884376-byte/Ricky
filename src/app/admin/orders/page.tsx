import Link from 'next/link';
import { OrderTable, type AdminOrderRow } from '@/components/admin/order-table';
import { EmptyResult, EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { hasSupabaseEnv } from '@/lib/env';
import { ORDER_FLOW, ORDER_STATUS_KO } from '@/lib/orders';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: '주문' };

/**
 * 주문 목록 (docs/wireframes/08-admin.md §2).
 *
 * **`select('*')` 를 쓰지 않는다.** 20260830000011 이후 `orders` 는 컬럼 단위 grant라
 * `fx_cad_krw` 가 `authenticated` 에 없다 — 관리자도 같은 롤이라 `*` 는 permission denied 다.
 * 필요한 컬럼만 적는다 (CLAUDE.md 규칙 1).
 *
 * 결제가 스마트스토어로 넘어가 있어서(20260828000007) 지금은 이 표가 비어 있는 것이 정상이다.
 * 빈 화면이 그 이유를 밝힌다 — "주문이 없다"와 "여기로는 안 들어온다"는 다르다.
 */

const escapeLike = (s: string) => s.replace(/[%_\\]/g, '');

/** 상태 필터. 흐름 순서를 따르고 흐름 밖(취소·환불·결제대기)은 뒤에 붙인다 */
const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: '전체 상태' },
  ...ORDER_FLOW.map((s) => ({ value: s.key, label: ORDER_STATUS_KO[s.key] })),
  ...(['pending_payment', 'cancelled', 'refunded'] as const).map((s) => ({
    value: s,
    label: ORDER_STATUS_KO[s],
  })),
];

const CONTROL =
  'h-11 rounded-ghost border border-outline-strong bg-paper px-4 text-body text-ink ' +
  'transition-colors duration-[var(--motion-quick)] focus:border-ink';

export default async function AdminOrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : '';

  const header = (
    <div>
      <h1 className="text-headline font-bold text-ink">주문</h1>
      <p className="mt-1 text-body text-muted-text">오래 머문 건부터 확인해요.</p>
    </div>
  );

  if (!hasSupabaseEnv()) {
    return (
      <>
        {header}
        <p role="status" className="mt-6 border border-outline p-4 text-body text-muted-text">
          데이터베이스에 연결되지 않았어요. <code>.env.local</code>의 Supabase 키를 채우면 주문이 나와요.
        </p>
      </>
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from('orders')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
    .select('id, order_no, placed_at, status, receiver_name, total_krw, contact_email')
    .order('placed_at', { ascending: false })
    .limit(200);

  if (q) query = query.or(`order_no.ilike.%${escapeLike(q)}%,receiver_name.ilike.%${escapeLike(q)}%`);
  if (status) query = query.eq('status', status as OrderStatus);

  const { data, error } = await query;
  const rows = (data ?? []) as AdminOrderRow[];
  const filtering = Boolean(q || status);

  return (
    <>
      {header}

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-meta font-bold text-ink">주문번호·받는 분</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="R260831-7F3K9Q"
            className={`${CONTROL} w-56`}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-meta font-bold text-ink">상태</span>
          <select name="status" defaultValue={status} className={CONTROL}>
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-11 rounded-ghost border border-outline bg-paper px-5 text-cta font-bold text-ink">
          거르기
        </button>
        {filtering && (
          <Link href="/admin/orders" className="flex h-11 items-center text-meta text-muted-text underline underline-offset-4">
            조건 지우기
          </Link>
        )}
      </form>

      {error && (
        <p role="alert" className="mt-6 border border-outline p-4 text-body text-error">
          주문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8">
          {filtering ? (
            <EmptyResult message="조건에 맞는 주문이 없어요" />
          ) : (
            <div className="border border-outline">
              <EmptyState
                className="items-center px-6 py-12 text-center"
                message="아직 여기로 들어온 주문이 없어요."
                action={<ButtonLink href="/admin/products" chevron>상품 목록</ButtonLink>}
              />
              {/*
                비어 있는 이유를 밝힌다. 결제가 스마트스토어에서 일어나므로 그쪽 주문은
                이 표에 오지 않는다 — 모르면 "주문이 하나도 없다"로 읽는다 (§12-8).
              */}
              <p className="border-t border-outline px-6 py-4 text-meta leading-relaxed text-muted-text">
                지금 결제는 네이버 스마트스토어에서 일어나요. 그쪽 주문은 스마트스토어센터에서
                확인하시고, 이 표는 자체 결제를 다시 열 때 채워져요.
              </p>
            </div>
          )}
        </div>
      )}

      {!error && rows.length > 0 && (
        <>
          <p className="mt-8 text-meta text-muted-text">{rows.length}건</p>
          <div className="mt-3">
            <OrderTable rows={rows} />
          </div>
        </>
      )}
    </>
  );
}
