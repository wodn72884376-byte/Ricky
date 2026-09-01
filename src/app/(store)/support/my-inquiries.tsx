import Link from 'next/link';
import { formatKoDate } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';
import type { InquiryCategory, InquiryStatus } from '@/lib/supabase/types';
import { INQUIRY_STATUS_KO, inquiryCategoryKo } from '@/lib/support/inquiry';

/**
 * 내가 남긴 문의.
 *
 * 상세 화면(`/support/inquiry/[ticket_no]`)으로 들어가는 **유일한 상시 입구**다.
 * 이것이 없으면 접수 직후의 확인 블록에서만 갈 수 있고, 그 화면을 떠나면 접수번호를
 * 적어 두지 않은 사람은 자기 문의로 돌아올 방법이 없다.
 *
 * 목록 전용 경로(`/support/inquiry`)를 새로 만들지 않는다 — 문의를 남기는 곳과
 * 지난 문의를 보는 곳은 같은 자리가 맞다 (docs/IA.md §3).
 *
 * 소유자 확인은 RLS `inquiries_self_read` 가 한다. 여기서 `customer_id` 를 비교하지 않는다.
 */

/** 한 번에 보여줄 최대 건수. 이보다 쌓이면 그때 별도 목록 화면을 만든다. */
const LIMIT = 10;

export async function MyInquiries() {
  type Row = {
    ticket_no: string;
    subject: string;
    status: InquiryStatus;
    category: InquiryCategory;
    created_at: string;
  };
  let rows: Row[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('inquiries')
      // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
      .select('ticket_no, subject, status, category, created_at')
      .order('created_at', { ascending: false })
      .limit(LIMIT);
    rows = data ?? [];
  } catch {
    // 지난 문의를 못 읽는다고 새 문의까지 막지 않는다. 조용히 접는다.
    return null;
  }

  // 처음 남기는 사람에게 빈 목록을 보여주지 않는다 — 아래 폼이 곧 다음 할 일이다
  if (rows.length === 0) return null;

  return (
    <section className="mt-10">
      <h3 className="text-product font-bold text-ink">지난 문의</h3>
      <ul className="mt-3 border-t border-outline">
        {rows.map((row) => (
          <li key={row.ticket_no}>
            <Link
              href={`/support/inquiry/${row.ticket_no}`}
              className="flex min-h-11 flex-col gap-1 border-b border-outline py-4 no-underline md:flex-row md:items-baseline md:justify-between md:gap-6"
            >
              <span className="min-w-0 text-product text-ink">{row.subject}</span>
              <span className="shrink-0 text-meta text-muted-text">
                <span data-numeric>{row.ticket_no}</span> · {formatKoDate(row.created_at)} ·{' '}
                {inquiryCategoryKo(row.category)} ·{' '}
                {INQUIRY_STATUS_KO[row.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
