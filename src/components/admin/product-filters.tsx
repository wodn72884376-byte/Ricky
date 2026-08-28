import Link from 'next/link';
import { BRAND_COLUMNS } from '@/lib/nav';

/**
 * 상품 목록 필터.
 *
 * **GET 폼이다.** 조건이 주소에 남아야 뒤로가기·새로고침·링크 공유가 살아 있다.
 * 클라이언트 상태로 들고 있으면 운영자가 상품을 고치고 돌아왔을 때 필터가 풀린다.
 *
 * 컨트롤 보더는 `#949494`(outline-strong)다 — 보더가 사라지면 입력인지 알 수 없는
 * 곳이라 버튼용 `#c4c4c4`를 쓰지 않는다 (DESIGN.md §4 Inputs).
 */

const STATUS_FILTERS = [
  { value: '', label: '전체 상태' },
  { value: 'active', label: '판매 중' },
  { value: 'draft', label: '임시저장' },
  { value: 'paused', label: '일시중지' },
  { value: 'archived', label: '보관' },
];

const CONTROL =
  'h-11 rounded-ghost border border-outline-strong bg-paper px-4 text-body text-ink ' +
  'transition-colors duration-[var(--motion-quick)] focus:border-ink';

export function ProductFilters({
  q,
  brand,
  status,
}: {
  q: string;
  brand: string;
  status: string;
}) {
  const filtering = Boolean(q || brand || status);

  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-meta font-bold text-ink">상품명</span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="베타 LT"
          className={`${CONTROL} w-56 placeholder:text-muted-text`}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-meta font-bold text-ink">브랜드</span>
        <select name="brand" defaultValue={brand} className={CONTROL}>
          <option value="">전체 브랜드</option>
          {BRAND_COLUMNS.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-meta font-bold text-ink">상태</span>
        <select name="status" defaultValue={status} className={CONTROL}>
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="h-11 rounded-ghost border border-outline bg-paper px-4 text-cta font-bold text-ink transition-colors duration-[var(--motion-quick)] hover:border-ink"
      >
        찾기
      </button>

      {filtering && (
        <Link
          href="/admin/products"
          className="flex h-11 items-center px-2 text-product text-muted-text hover:text-ink"
        >
          조건 지우기
        </Link>
      )}
    </form>
  );
}
