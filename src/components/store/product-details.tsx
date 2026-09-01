import type { CatalogProduct } from '@/lib/catalog.generated';

/**
 * 공식몰 상품 상세 (설명 · 주요 특성 · 구조 · 포켓 …).
 *
 * 아크테릭스만 있다 — 공식몰 PDP의 `Product details`를 그대로 옮긴 것이다.
 *
 * **한국어로 옮겨서 보여준다.** 번역은 `scripts/arcteryx-ko.mjs` 의 문장 사전이 하고,
 * 사전에 없는 문장은 원문을 그대로 내보내며 임포트가 경고한다 — 지어내지 않는다.
 * 원단 이름과 규격(GORE-TEX®·Coreloft™·데니어·gsm)은 옮기지 않는다. 옮기면 대조가 안 된다.
 * 어느 쪽이든 출처를 밝혀 고객이 원문을 확인할 수 있게 한다.
 *
 * 코치의 `ProductSpecs`(치수·소재)와 역할이 겹치지 않는다. 저쪽은 색상별 사양,
 * 여기는 상품 단위 설명이다.
 */
export function ProductDetails({ product }: { product: CatalogProduct }) {
  const d = product.details;
  if (!d) return null;

  const hasBody = d.description || d.productTip || d.fit || d.groups.length > 0;
  if (!hasBody) return null;

  return (
    <section className="mt-20 grid gap-8 border-t border-outline pt-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
      <h2 className="text-editorial font-bold text-ink">제품 상세</h2>

      <div className="max-w-[var(--measure-prose)]">
        {d.description && (
          <div className="text-body leading-relaxed text-ink">
            {d.description.split('\n\n').map((para) => (
              <p key={para.slice(0, 40)} className="mt-4 first:mt-0">
                {para}
              </p>
            ))}
          </div>
        )}

        {d.productTip && (
          // 팁은 본문에 딸린 주석이다. 배경을 칠하지 않고 위계로만 낮춘다 (DESIGN.md §6)
          <p className="mt-6 border-l border-outline pl-4 text-meta leading-relaxed text-muted-text">
            {d.productTip}
          </p>
        )}

        {d.fit && (
          <div className="mt-8 border-t border-outline pt-6">
            <p className="text-product font-bold text-ink">핏 · {d.fit.label}</p>
            {d.fit.text && <p className="mt-2 text-body leading-relaxed text-ink">{d.fit.text}</p>}
          </div>
        )}

        {d.groups.length > 0 && (
          <dl className="mt-8 border-t border-outline">
            {d.groups.map((g) => (
              <div key={g.label} className="grid grid-cols-[104px_minmax(0,1fr)] gap-4 border-b border-outline py-4">
                <dt className="text-meta text-muted-text">{g.label}</dt>
                <dd className="text-body leading-relaxed text-ink">
                  {g.values.length === 1 ? (
                    g.values[0]
                  ) : (
                    <ul>
                      {g.values.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {d.sourceUrl && (
          <p className="mt-6 text-meta text-muted-text">
            {product.brand} 캐나다 공식몰 표기를 한국어로 옮긴 내용입니다.{' '}
            <a
              href={d.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4"
            >
              원문 보기
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
