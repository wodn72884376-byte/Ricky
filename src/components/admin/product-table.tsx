import Link from 'next/link';
import { InvertedChip } from '@/components/ui/states';
import { STATUS_LABEL } from '@/app/admin/products/state';
import { formatKrw } from '@/lib/money';
import { cn } from '@/lib/utils/cn';

/**
 * 관리자 상품 표 (DESIGN.md §9 "대시보드 상품 테이블").
 *
 * 흰 배경, 행 사이 `1px solid #c4c4c4`, 숫자 열은 `tabular-nums` 우측 정렬.
 * 그림자도, 헤더 배경 틴트도 없다.
 *
 * 마지막 열이 **게시 조건**이다. 고시 항목이나 스마트스토어 주소가 비면
 * DB 제약(`products_disclosure_complete`)이 `active`를 막으므로,
 * 저장에서 거절당하기 전에 여기서 먼저 이유를 보여준다.
 *
 * 색을 새로 만들지 않는다 (§14 대시보드) — 판매 중은 반전 칩, 못 파는 이유는
 * `#e8005d` 한 줄, 보관은 opacity 0.4다.
 */

const CATEGORY_LABEL: Record<string, string> = {
  outerwear: '아우터',
  top: '상의',
  bottom: '하의',
  bag: '가방',
  wallet: '지갑',
  shoes: '신발',
  accessory: '악세서리',
};

const GENDER_LABEL: Record<string, string> = { men: '남성', women: '여성', unisex: '공용' };

/** Supabase 중첩 조회는 관계에 따라 객체 또는 배열로 온다 — 둘 다 받는다. */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  gender: string;
  status: string;
  featured_rank: number | null;
  shipping_krw: number | null;
  smartstore_url: string | null;
  origin_country: string | null;
  material: string | null;
  care: string | null;
  manufacturer: string | null;
  as_contact: string | null;
  brands: { name: string } | { name: string }[] | null;
  product_variants: { price_krw: number | null; active: boolean }[] | null;
};

/** 게시를 막고 있는 것들. DB의 products_disclosure_complete와 같은 목록이다. */
export function publishBlockers(row: AdminProductRow): string[] {
  const missing: string[] = [];
  if (!row.smartstore_url) missing.push('구매 경로');
  if (!row.origin_country) missing.push('원산지');
  if (!row.material) missing.push('소재');
  if (!row.care) missing.push('취급주의');
  if (!row.manufacturer) missing.push('제조자');
  if (!row.as_contact) missing.push('A/S');
  return missing;
}

const brandName = (b: AdminProductRow['brands']) =>
  Array.isArray(b) ? (b[0]?.name ?? '—') : (b?.name ?? '—');

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-4 py-3 text-label font-bold text-ink',
        right ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

export function ProductTable({ rows }: { rows: AdminProductRow[] }) {
  return (
    // 열을 숨기지 않는다 — 운영자는 전체 숫자를 봐야 한다 (DESIGN.md §8)
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr className="border-y border-outline">
            <Th>상품</Th>
            <Th>브랜드</Th>
            <Th>분류</Th>
            <Th right>옵션</Th>
            <Th right>판매가</Th>
            <Th right>배송비</Th>
            <Th>상태</Th>
            <Th>게시 조건</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const variants = (row.product_variants ?? []).filter((v) => v.active);
            const price = variants[0]?.price_krw ?? null;
            const missing = publishBlockers(row);

            return (
              <tr
                key={row.id}
                className={cn('border-b border-outline align-top', row.status === 'archived' && 'opacity-40')}
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/products/${row.id}/edit`}
                    className="text-product font-bold text-ink underline-offset-4 hover:underline"
                  >
                    {row.name}
                  </Link>
                  <p className="mt-1 text-meta text-muted-text">
                    /{row.slug}
                    {row.featured_rank !== null && ` · BEST ${row.featured_rank}`}
                  </p>
                </td>
                <td className="px-4 py-4 text-meta text-ink">{brandName(row.brands)}</td>
                <td className="px-4 py-4 text-meta text-ink">
                  {GENDER_LABEL[row.gender] ?? row.gender} ·{' '}
                  {CATEGORY_LABEL[row.category] ?? row.category}
                </td>
                <td data-numeric className="px-4 py-4 text-right text-meta font-bold text-ink">
                  {variants.length}
                </td>
                <td data-numeric className="px-4 py-4 text-right text-meta font-bold text-ink">
                  {price === null ? '—' : formatKrw(price)}
                </td>
                <td data-numeric className="px-4 py-4 text-right text-meta text-ink">
                  {row.shipping_krw === null ? (
                    // 비어 있는 것은 "안 정함"이 아니라 "무게로 계산함"이다. 그대로 쓴다.
                    <span className="text-muted-text">무게 기준</span>
                  ) : row.shipping_krw === 0 ? (
                    '무료'
                  ) : (
                    <span className="font-bold">{formatKrw(row.shipping_krw)}</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {row.status === 'active' ? (
                    <InvertedChip>판매 중</InvertedChip>
                  ) : (
                    <span className="text-meta text-muted-text">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {missing.length === 0 ? (
                    <span className="text-meta text-muted-text">갖춰졌어요</span>
                  ) : (
                    <span className="text-meta font-bold text-sale">{missing.join(' · ')} 없음</span>
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
