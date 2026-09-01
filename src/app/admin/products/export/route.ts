import { NextResponse, type NextRequest } from 'next/server';
import {
  exportFileName,
  productsCsv,
  variantsCsv,
  type AdminVariantRow,
} from '@/lib/admin/product-export';
import type { AdminProductRow } from '@/components/admin/product-table';
import { hasSupabaseEnv } from '@/lib/env';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import type { ProductStatus } from '@/lib/supabase/types';

/**
 * 상품 목록 CSV 내보내기.
 *
 * ## 권한을 여기서 다시 본다
 * `src/app/admin/layout.tsx` 의 관리자 확인은 **라우트 핸들러에 적용되지 않는다** —
 * 레이아웃은 페이지를 감쌀 뿐이다. 여기서 안 막으면 로그인만 한 사람이 URL 을 직접 쳐서
 * 전 상품 목록을 받아갈 수 있다. RLS 가 한 겹 더 있지만 그것에 기대지 않는다.
 *
 * ## 화면과 같은 조건으로 뽑는다
 * 필터를 검색 파라미터로 그대로 받는다. 걸러 놓고 받으면 걸러진 것이 나와야지,
 * 화면과 파일이 다르면 어느 쪽이 맞는지 알 수 없다.
 *
 * ## grain=variant
 * 옵션(색상·사이즈) 한 줄에 한 행. 캐나다구스는 색상마다 공식몰 페이지가 따로라
 * 상품 단위로는 나머지 색상 주소를 담을 수 없다.
 */

/** ilike 와일드카드를 그대로 넘기면 검색어가 패턴이 된다 (page.tsx 와 같은 규칙). */
const escapeLike = (s: string) => s.replace(/[%_\\]/g, '');

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL('/login?next=/admin/products', request.url));
  // 관리자가 아니면 존재를 알리지 않는다 — 403 은 "여기 뭔가 있다"는 정보다.
  if (!user.isAdmin) return new NextResponse('찾을 수 없어요', { status: 404 });

  if (!hasSupabaseEnv()) {
    return new NextResponse('데이터베이스에 연결되지 않았어요.', { status: 503 });
  }

  const sp = request.nextUrl.searchParams;
  const q = sp.get('q')?.trim() ?? '';
  const status = sp.get('status') ?? '';
  const brand = sp.get('brand') ?? '';
  const variantGrain = sp.get('grain') === 'variant';

  const supabase = await createClient();

  let brandId: string | null = null;
  if (brand) {
    const { data } = await supabase.from('brands').select('id').eq('slug', brand).single();
    brandId = data?.id ?? null;
  }

  if (variantGrain) return variantExport(supabase, { q, status, brandId });

  let query = supabase
    .from('products')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
    .select('id, name, slug, category, gender, status, featured_rank, shipping_krw, smartstore_url, official_url, origin_country, material, care, manufacturer, as_contact, brands(name, official_site_url), product_variants(price_krw, active, smartstore_url)')
    .order('updated_at', { ascending: false })
    // 화면은 200개까지만 보여주지만 파일은 전부 담는다 — 스프레드시트는 스크롤이 싸다.
    .limit(5000);

  if (q) query = query.ilike('name', `%${escapeLike(q)}%`);
  if (status) query = query.eq('status', status as ProductStatus);
  if (brandId) query = query.eq('brand_id', brandId);

  const { data, error } = await query;
  if (error) return new NextResponse('상품을 불러오지 못했어요.', { status: 502 });

  return csvResponse(productsCsv((data ?? []) as unknown as AdminProductRow[]), exportFileName('상품'));
}

/**
 * 옵션 단위. 필터는 상품에 걸리므로 **중첩 조회 쪽에서** 건다 —
 * `product_variants` 를 기준으로 잡고 `products!inner` 로 좁힌다.
 */
async function variantExport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: { q: string; status: string; brandId: string | null },
) {
  let query = supabase
    .from('product_variants')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
    .select('sku, size, color, price_krw, weight_g, official_url, smartstore_url, active, products!inner(name, slug, official_url, smartstore_url, brand_id, status, brands(name))')
    .order('sku')
    .limit(20000);

  if (filters.q) query = query.ilike('products.name', `%${escapeLike(filters.q)}%`);
  if (filters.status) query = query.eq('products.status', filters.status as ProductStatus);
  if (filters.brandId) query = query.eq('products.brand_id', filters.brandId);

  const { data, error } = await query;
  if (error) return new NextResponse('옵션을 불러오지 못했어요.', { status: 502 });

  return csvResponse(variantsCsv((data ?? []) as unknown as AdminVariantRow[]), exportFileName('옵션'));
}

function csvResponse(csv: string, name: string) {
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      /*
        한글 파일명은 `filename=` 만으로는 깨진다. RFC 5987 의 `filename*` 를 함께 준다 —
        브라우저는 `filename*` 를 우선하고, 못 읽는 쪽은 ASCII 이름으로 떨어진다.
      */
      'Content-Disposition':
        `attachment; filename="ricky-export.csv"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'no-store',
    },
  });
}
