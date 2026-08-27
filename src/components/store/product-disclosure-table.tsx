import type { CatalogProduct } from '@/lib/catalog';

/**
 * 상품 정보 및 제공 고시.
 *
 * **법적 필수 항목이다.** 전자상거래법 시행규칙에 따라 의류·잡화는 종류·소재·색상·크기·
 * 제조자·제조국·취급 주의사항·품질보증기준·AS 책임자를 표시해야 한다.
 *
 * 우리는 아직 대부분을 모른다. **모르는 값을 지어내지 않는다** —
 * `상품 등록 시 입력`으로 두고 관리자 화면에서 채운다. 빈칸을 그럴듯한 문구로
 * 메우면 표시광고법 위반이 되고, 그건 디자인 문제가 아니라 법 문제다.
 */

type Row = { label: string; value: string | null; note?: string };

export function ProductDisclosureTable({ product }: { product: CatalogProduct }) {
  const KIND: Record<string, string> = {
    outerwear: '아우터', top: '상의', bottom: '하의', bag: '가방', accessory: '패션잡화',
  };

  const rows: Row[] = [
    { label: '종류', value: KIND[product.category] ?? null },
    { label: '소재', value: null },
    { label: '색상', value: product.variants.map((v) => v.colorKo).join(' / ') },
    { label: '크기', value: product.sizes.join(', ') },
    { label: '제조자', value: "Arc'teryx Equipment" },
    // 원산지는 실물 라벨 기준이다. 브랜드 국적으로 추정하지 않는다 (PROJECT.md §3.3)
    { label: '제조국', value: product.originCountry, note: '실물 라벨 확인 후 표기' },
    { label: '취급 시 주의사항', value: null },
    { label: '품질보증기준', value: '관련 법 및 소비자분쟁해결기준에 따름' },
    { label: '판매자', value: 'RICKY — 캐나다 알버타 소재 독립 사업자' },
    { label: 'A/S 책임자 및 연락처', value: null },
  ];

  return (
    <section className="mt-16">
      <h2 className="text-editorial font-bold">상품 정보 및 제공 고시</h2>
      <dl className="mt-5 border-t border-outline">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 border-b border-outline py-3 text-util">
            <dt className="w-32 shrink-0 text-muted-text sm:w-44">{row.label}</dt>
            <dd className={row.value ? 'text-ink' : 'text-muted-text'}>
              {row.value ?? (
                <>
                  {/* 지어내지 않는다. 비어 있다는 사실을 그대로 쓴다. */}
                  상품 등록 시 입력
                  {row.note && <span className="ml-2 text-meta">({row.note})</span>}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-meta text-muted-text">
        전자상거래 등에서의 상품 정보 제공에 관한 고시에 따른 표기예요.
      </p>
    </section>
  );
}
