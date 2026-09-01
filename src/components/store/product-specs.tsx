import type { CatalogVariant } from '@/lib/catalog.generated';

/**
 * 제품 상세 스펙 (치수·소재·손잡이·스트랩·특징).
 *
 * 공식몰 표기를 옮긴 것이다. 지어낸 값이 아니므로 그대로 둔다.
 *
 * **선택한 색상의 값이다.** 코치는 한 상품 폴더에 스타일이 다른 제품을 묶어 두어서
 * 색상마다 치수와 소재가 다르다 — 상품 단위로 하나만 띄우면 절반이 틀린 값이 된다.
 * 색상은 URL(`?color=N`)에 있으므로 서버에서 그대로 고른다.
 *
 * 고시 표(`ProductDisclosureTable`)와 역할이 다르다. 저쪽은 전자상거래법이 요구하는
 * 항목이고 여기는 상품 자체의 사양이다. 둘을 합치면 법정 고지가 마케팅 정보에 묻힌다.
 */
export function ProductSpecs({ variant }: { variant: CatalogVariant }) {
  const specs = variant.specs ?? [];
  if (specs.length === 0) return null;

  return (
    <section className="mt-20 grid gap-8 border-t border-outline pt-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
      <h2 className="text-editorial font-bold text-ink">제품 정보</h2>

      {/* 보더로 행을 가르되 그림자는 쓰지 않는다 (DESIGN.md §6) */}
      <dl className="max-w-[var(--measure-prose)]">
        {specs.map(({ label, values }) => (
          <div key={label} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-outline py-4">
            <dt className="text-meta text-muted-text">{label}</dt>
            <dd className="text-body leading-relaxed text-ink">
              {values.length === 1 ? (
                values[0]
              ) : (
                <ul>
                  {values.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
