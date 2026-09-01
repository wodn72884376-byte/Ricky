import Link from 'next/link';
import { INQUIRY_CATEGORIES, INQUIRY_STATUS_KO } from '@/lib/support/inquiry';

/**
 * 문의 목록 필터.
 *
 * **GET 폼이다.** 조건이 주소에 남아야 문의 하나를 처리하고 돌아왔을 때 목록이
 * 그대로다 — 운영자는 한 번에 여러 건을 처리한다 (`product-filters.tsx` 와 같은 이유).
 */

const STATUS_FILTERS = [
  { value: '', label: '전체 상태' },
  ...Object.entries(INQUIRY_STATUS_KO).map(([value, label]) => ({ value, label })),
];

const CONTROL =
  'h-11 rounded-ghost border border-outline-strong bg-paper px-4 text-body text-ink ' +
  'transition-colors duration-[var(--motion-quick)] focus:border-ink';

export function InquiryFilters({
  q,
  status,
  category,
}: {
  q: string;
  status: string;
  category: string;
}) {
  const filtering = Boolean(q || status || category);

  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-meta font-bold text-ink">제목·접수번호</span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Q260831-K7M2P"
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

      <label className="flex flex-col gap-2">
        <span className="text-meta font-bold text-ink">유형</span>
        <select name="category" defaultValue={category} className={CONTROL}>
          <option value="">전체 유형</option>
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </label>

      <button type="submit" className="h-11 rounded-ghost border border-outline bg-paper px-5 text-cta font-bold text-ink">
        거르기
      </button>

      {filtering && (
        <Link href="/admin/inquiries" className="flex h-11 items-center text-meta text-muted-text underline underline-offset-4">
          조건 지우기
        </Link>
      )}
    </form>
  );
}
