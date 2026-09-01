import Link from 'next/link';
import { shortUrl } from '@/lib/admin/official-url';
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

const GENDER_LABEL: Record<string, string> = { men: '남성', women: '여성', unisex: '공용', kids: '아동' };

type BrandRef = { name: string; official_site_url: string | null };

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
  official_url: string | null;
  origin_country: string | null;
  material: string | null;
  care: string | null;
  manufacturer: string | null;
  as_contact: string | null;
  brands: BrandRef | BrandRef[] | null;
  product_variants: { price_krw: number | null; active: boolean; smartstore_url: string | null }[] | null;
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

const brandOf = (b: AdminProductRow['brands']): BrandRef | null =>
  (Array.isArray(b) ? b[0] : b) ?? null;

/**
 * 공식몰 링크. **상품 페이지가 있으면 그쪽을 우선한다.**
 *
 * 브랜드 홈으로 떨어지는 경우를 그냥 링크로 두면 운영자가 눌러 보고서야
 * "이 상품이 아니네"를 안다. 어느 쪽인지 라벨로 갈라 둔다.
 */
function officialLink(row: AdminProductRow, brand: BrandRef | null) {
  if (row.official_url) return { href: row.official_url, label: shortUrl(row.official_url), exact: true };
  if (brand?.official_site_url) {
    return { href: brand.official_site_url, label: shortUrl(brand.official_site_url), exact: false };
  }
  return null;
}

/**
 * 구매 경로가 색상 단위인지 상품 단위인지.
 *
 * 스마트스토어 상품 URL 은 옵션을 실어 나를 수 없어서, 상품 단위 주소로 보내면 고객이
 * 우리 화면에서 고른 색을 저쪽에서 **다시 고른다.** 색상마다 스토어 상품을 따로 등록하면
 * 그 마찰이 사라지는데, 일부만 채워 두면 안 채운 색은 다른 색 페이지로 떨어진다 —
 * 그러니 몇 개가 자기 주소를 가졌는지 세어서 보여준다.
 */
function buyPathScope(row: AdminProductRow) {
  const variants = (row.product_variants ?? []).filter((v) => v.active);
  const own = variants.filter((v) => v.smartstore_url).length;

  if (own === 0) return row.smartstore_url ? { label: '상품 주소 하나', warn: false } : null;
  if (own === variants.length) return { label: `색상별 ${own}개`, warn: false };
  // 섞여 있는 것이 제일 위험하다. 안 채운 색은 다른 색 페이지로 간다.
  return { label: `색상별 ${own}/${variants.length}`, warn: true };
}

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
            <Th>구매 경로</Th>
            <Th>공식몰</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const variants = (row.product_variants ?? []).filter((v) => v.active);
            const price = variants[0]?.price_krw ?? null;
            const missing = publishBlockers(row);
            const brand = brandOf(row.brands);
            const official = officialLink(row, brand);
            const buyPath = buyPathScope(row);

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
                <td className="px-4 py-4 text-meta text-ink">{brand?.name ?? '—'}</td>
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
                <td className="px-4 py-4">
                  {buyPath === null ? (
                    <span className="text-meta text-muted-text">—</span>
                  ) : (
                    <span className={cn('text-meta', buyPath.warn ? 'font-bold text-sale' : 'text-ink')}>
                      {buyPath.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {official ? (
                    <>
                      <a
                        href={official.href}
                        target="_blank"
                        // 새 탭으로 여는 외부 링크에는 반드시 붙인다 — 없으면 열린 쪽이
                        // window.opener 로 이 탭을 조작할 수 있다.
                        rel="noopener noreferrer"
                        title={official.href}
                        className="text-meta text-ink underline underline-offset-4"
                      >
                        {official.label}
                      </a>
                      {!official.exact && (
                        <p className="mt-1 text-meta text-muted-text">브랜드 홈 — 상품 주소 없음</p>
                      )}
                    </>
                  ) : (
                    <span className="text-meta text-muted-text">—</span>
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
