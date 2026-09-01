import { ProductFilters } from '@/components/admin/product-filters';
import { ProductTable, type AdminProductRow } from '@/components/admin/product-table';
import { ButtonLink } from '@/components/ui/button';
import { EmptyResult, EmptyState } from '@/components/ui/states';
import { hasSupabaseEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { ProductStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: '상품' };

/**
 * 상품 목록 (docs/wireframes/08-admin.md).
 *
 * 이 화면이 답해야 하는 질문은 하나다 — **어떤 상품이 아직 못 팔리고 있고, 왜인가.**
 * 표의 마지막 열이 그 답이다 (components/admin/product-table.tsx 참고).
 *
 * 필터는 검색 파라미터로 다룬다. 상품을 고치고 목록으로 돌아왔을 때 조건이
 * 그대로 남아 있어야 한다 — 운영자는 한 번에 여러 건을 처리한다.
 */

/** ilike 와일드카드를 그대로 넘기면 검색어가 패턴이 된다. */
const escapeLike = (s: string) => s.replace(/[%_\\]/g, '');

export default async function AdminProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const brand = typeof sp.brand === 'string' ? sp.brand : '';

  /*
    내보내기는 **지금 보고 있는 조건 그대로** 받는다. 걸러 놓고 받았는데 전체가 나오면
    파일을 다시 걸러야 한다. 파라미터를 그대로 물려준다.
  */
  const exportQuery = new URLSearchParams(
    Object.entries({ q, status, brand }).filter(([, v]) => v),
  ).toString();
  const exportHref = `/admin/products/export${exportQuery ? `?${exportQuery}` : ''}`;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-headline font-bold text-ink">상품</h1>
        <p className="mt-1 text-body text-muted-text">등록한 상품을 여기서 고치고 상태를 바꿔요.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* 반전 블랙은 화면당 하나다 (DESIGN.md §4) — 그 자리는 `상품 등록`이 갖는다 */}
        <ButtonLink href={exportHref} variant="ghost" size="md" prefetch={false}>
          상품 엑셀
        </ButtonLink>
        {/* 캐나다구스는 색상마다 공식몰 주소가 다르다 — 자동화가 순회할 대상은 옵션이다 */}
        <ButtonLink
          href={`${exportHref}${exportQuery ? '&' : '?'}grain=variant`}
          variant="ghost"
          size="md"
          prefetch={false}
        >
          옵션 엑셀
        </ButtonLink>
        <ButtonLink href="/admin/products/new" variant="inverted" size="md">
          상품 등록
        </ButtonLink>
      </div>
    </div>
  );

  if (!hasSupabaseEnv()) {
    return (
      <>
        {header}
        <p role="status" className="mt-6 border border-outline p-4 text-body text-muted-text">
          데이터베이스에 연결되지 않았어요. <code>.env.local</code>의 Supabase 키를 채우면 등록한 상품이 나와요.
        </p>
      </>
    );
  }

  const supabase = await createClient();

  // 브랜드는 slug로 걸러 들어오므로 먼저 id로 바꾼다.
  let brandId: string | null = null;
  if (brand) {
    const { data } = await supabase.from('brands').select('id').eq('slug', brand).single();
    brandId = data?.id ?? null;
  }

  let query = supabase
    .from('products')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃고 결과가 통째로 에러 타입이 된다.
    .select('id, name, slug, category, gender, status, featured_rank, shipping_krw, smartstore_url, official_url, origin_country, material, care, manufacturer, as_contact, brands(name, official_site_url), product_variants(price_krw, active, smartstore_url)')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (q) query = query.ilike('name', `%${escapeLike(q)}%`);
  if (status) query = query.eq('status', status as ProductStatus);
  if (brandId) query = query.eq('brand_id', brandId);

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as AdminProductRow[];
  const filtering = Boolean(q || status || brand);

  return (
    <>
      {header}

      <div className="mt-8">
        <ProductFilters q={q} brand={brand} status={status} />
      </div>

      {error && (
        <p role="alert" className="mt-6 border border-outline p-4 text-body text-error">
          상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8">
          {filtering ? (
            <EmptyResult message="조건에 맞는 상품이 없어요" />
          ) : (
            <div className="border border-outline">
              <EmptyState
                className="items-center px-6 py-16 text-center"
                message="아직 등록한 상품이 없어요."
                action={
                  <ButtonLink href="/admin/products/new" chevron>
                    첫 상품 등록하기
                  </ButtonLink>
                }
              />
            </div>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <p className="mt-8 text-meta text-muted-text">
            <span data-numeric>{rows.length}</span>개
            {rows.length === 200 && ' (최근 200개까지 보여줘요)'}
          </p>
          <div className="mt-3">
            <ProductTable rows={rows} />
          </div>
        </>
      )}
    </>
  );
}
