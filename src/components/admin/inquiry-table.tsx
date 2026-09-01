import Link from 'next/link';
import { formatKoDate } from '@/lib/date';
import { INQUIRY_STATUS_KO, inquiryCategoryKo, isInquiryPending } from '@/lib/support/inquiry';
import type { InquiryCategory, InquiryStatus } from '@/lib/supabase/types';
import { InvertedChip } from '@/components/ui/states';
import { cn } from '@/lib/utils/cn';

/**
 * 문의 목록 표 (DESIGN.md §9 대시보드 테이블).
 *
 * 이 화면이 답해야 하는 질문은 하나다 — **어떤 문의가 아직 답을 못 받았나.**
 * 그래서 미답변을 반전 칩으로 올리고 나머지는 muted 로 내린다. 색이 아니라 반전과
 * 위계로 구분한다 (§14 대시보드).
 *
 * 표 헤더는 한국어다 — `SUBJECT`·`STATUS` 로 옮기면 운영자가 매번 번역하며 읽는다
 * (.omd/preferences.md 12번).
 */

export type AdminInquiryRow = {
  id: string;
  ticket_no: string;
  created_at: string;
  category: InquiryCategory;
  subject: string;
  status: InquiryStatus;
  contact_email: string;
  order_id: string | null;
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-label font-bold text-ink">
      {children}
    </th>
  );
}

export function InquiryTable({ rows }: { rows: AdminInquiryRow[] }) {
  return (
    // 열을 숨기지 않는다 — 운영자는 전체를 봐야 한다 (DESIGN.md §8)
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-y border-outline">
            <Th>접수번호</Th>
            <Th>접수일</Th>
            <Th>유형</Th>
            <Th>제목</Th>
            <Th>연락처</Th>
            <Th>상태</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pending = isInquiryPending(row.status);
            return (
              <tr key={row.id} className="border-b border-outline align-top">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/inquiries/${row.id}`}
                    data-numeric
                    className="text-meta font-bold text-ink underline-offset-4 hover:underline"
                  >
                    {row.ticket_no}
                  </Link>
                  {row.order_id && (
                    <p className="mt-1 text-meta text-muted-text">주문 연결됨</p>
                  )}
                </td>
                <td className="px-4 py-4 text-meta text-muted-text">{formatKoDate(row.created_at)}</td>
                <td className="px-4 py-4 text-meta text-ink">{inquiryCategoryKo(row.category)}</td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/inquiries/${row.id}`}
                    className={cn(
                      'text-product underline-offset-4 hover:underline',
                      pending ? 'font-bold text-ink' : 'text-ink',
                    )}
                  >
                    {row.subject}
                  </Link>
                </td>
                <td className="px-4 py-4 text-meta text-muted-text">{row.contact_email}</td>
                <td className="px-4 py-4">
                  {pending ? (
                    <InvertedChip>{INQUIRY_STATUS_KO[row.status]}</InvertedChip>
                  ) : (
                    <span className="text-meta text-muted-text">{INQUIRY_STATUS_KO[row.status]}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
