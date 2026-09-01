import { InquiryFilters } from '@/components/admin/inquiry-filters';
import { InquiryTable, type AdminInquiryRow } from '@/components/admin/inquiry-table';
import { EmptyResult, EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { hasSupabaseEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { InquiryCategory, InquiryStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: '문의' };

/**
 * 문의 목록 (docs/IA.md §2 관리자).
 *
 * **미답변이 위에 온다.** 접수순이 아니라 처리 여부순이다 — 이 화면의 목적은
 * 기록 열람이 아니라 처리이고, 오래된 미답변이 새 답변 아래로 밀리면 안 된다.
 *
 * 조회는 RLS `inquiries_admin_all`(is_admin)이 통과시킨다. 레이아웃이 이미 관리자가
 * 아닌 사용자를 돌려보내지만, 데이터 경계는 정책이 잡는다.
 */

/** ilike 와일드카드를 그대로 넘기면 검색어가 패턴이 된다. */
const escapeLike = (s: string) => s.replace(/[%_\\]/g, '');

export default async function AdminInquiriesPage({ searchParams }: PageProps<'/admin/inquiries'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const category = typeof sp.category === 'string' ? sp.category : '';

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-headline font-bold text-ink">문의</h1>
        <p className="mt-1 text-body text-muted-text">답을 기다리는 것부터 보여드려요.</p>
      </div>
    </div>
  );

  if (!hasSupabaseEnv()) {
    return (
      <>
        {header}
        <p role="status" className="mt-6 border border-outline p-4 text-body text-muted-text">
          데이터베이스에 연결되지 않았어요. <code>.env.local</code>의 Supabase 키를 채우면 접수된 문의가 나와요.
        </p>
      </>
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from('inquiries')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
    .select('id, ticket_no, created_at, category, subject, status, contact_email, order_id')
    /*
      `open` 이 먼저 오게 정렬한다. Postgres 에서 enum 은 **정의 순서**로 정렬되고
      `inquiry_status` 는 open · answered · closed 순으로 만들어졌다(20260826000003).
      그래서 상태 오름차순이 곧 "처리해야 하는 순"이다.
    */
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200);

  if (q) query = query.or(`subject.ilike.%${escapeLike(q)}%,ticket_no.ilike.%${escapeLike(q)}%`);
  if (status) query = query.eq('status', status as InquiryStatus);
  if (category) query = query.eq('category', category as InquiryCategory);

  const { data, error } = await query;
  const rows = (data ?? []) as AdminInquiryRow[];
  const filtering = Boolean(q || status || category);
  const pending = rows.filter((r) => r.status === 'open').length;

  return (
    <>
      {header}

      <div className="mt-8">
        <InquiryFilters q={q} status={status} category={category} />
      </div>

      {error && (
        <p role="alert" className="mt-6 border border-outline p-4 text-body text-error">
          문의를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8">
          {filtering ? (
            <EmptyResult message="조건에 맞는 문의가 없어요" />
          ) : (
            <div className="border border-outline">
              <EmptyState
                className="items-center px-6 py-12 text-center"
                message="아직 접수된 문의가 없어요."
                action={<ButtonLink href="/support#inquiry" chevron>고객 화면 보기</ButtonLink>}
              />
            </div>
          )}
        </div>
      )}

      {!error && rows.length > 0 && (
        <>
          <p className="mt-8 text-meta text-muted-text">
            {rows.length}건 {pending > 0 && <span className="font-bold text-ink">· 미답변 {pending}건</span>}
          </p>
          <div className="mt-3">
            <InquiryTable rows={rows} />
          </div>
        </>
      )}
    </>
  );
}
