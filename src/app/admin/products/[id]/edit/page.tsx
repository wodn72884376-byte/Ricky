import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { hasSupabaseEnv } from '@/lib/env';
import { BRAND_COLUMNS } from '@/lib/nav';
import { createClient } from '@/lib/supabase/server';
import { EMPTY_DEFAULTS, ProductForm, type FormDefaults } from '../../product-form';
import { updateProduct } from './actions';

export const dynamic = 'force-dynamic';

/**
 * 상품 수정.
 *
 * 등록과 같은 폼을 쓰고, 지금 저장돼 있는 값으로 채워 넣는다.
 * **환율·마진율은 저장하지 않으므로 되돌려 놓지 않는다** — 비워 두는 것이
 * "지금 가격을 그대로 둔다"는 뜻이다 (edit/actions.ts 참고).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VariantRow = {
  size: string | null;
  color: string | null;
  price_krw: number | null;
  weight_g: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  stock_type: string;
  active: boolean;
};

/** null·0을 구분해 문자열로. `0`은 무료배송이라는 뜻이므로 빈 문자열로 접으면 안 된다. */
const str = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/** 중복 없이 순서를 지켜 콤마로 잇는다. 폼이 다시 같은 순서로 조합을 만든다. */
function joinDistinct(values: (string | null)[]): string {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].join(', ');
}

export async function generateMetadata({ params }: PageProps<'/admin/products/[id]/edit'>) {
  const { id } = await params;
  if (!hasSupabaseEnv() || !UUID.test(id)) return { title: '상품 수정 — RICKY 운영' };
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('name').eq('id', id).single();
  return { title: data?.name ? `${data.name} 수정 — RICKY 운영` : '상품 수정 — RICKY 운영' };
}

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]/edit'>) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  if (!hasSupabaseEnv()) {
    return (
      <div className="max-w-[var(--measure-prose)]">
        <h1 className="text-headline font-bold text-ink">상품 수정</h1>
        <p className="mt-4 text-body text-muted-text">
          데이터베이스에 연결되지 않았어요. <code>.env.local</code>의 Supabase 키를 채우면 상품을 불러와요.
        </p>
        <div className="mt-8">
          <ButtonLink href="/admin/products" size="md" chevron>
            상품 목록
          </ButtonLink>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: product }, { data: variants }] = await Promise.all([
    supabase
      .from('products')
      // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 문자열 리터럴을 잃고
      // 결과가 통째로 `GenericStringError`가 된다.
      .select('id, slug, name, name_en, category, gender, featured_rank, hs_code, origin_country, description, material, care, manufacturer, as_contact, kr_retail_krw, shipping_krw, smartstore_url, status, brands(slug)')
      .eq('id', id)
      .single(),
    supabase
      .from('product_variants')
      .select('size, color, price_krw, weight_g, length_mm, width_mm, height_mm, stock_type, active')
      .eq('product_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!product) notFound();

  const rows = (variants ?? []) as VariantRow[];
  // 판매 중인 조합만 폼에 되돌린다. 내려 둔 옵션까지 채우면 저장하는 순간 되살아난다.
  const live = rows.filter((v) => v.active);
  const source = live.length > 0 ? live : rows;
  const first = source[0];

  const brandSlug =
    (product.brands as unknown as { slug: string } | { slug: string }[] | null) === null
      ? ''
      : Array.isArray(product.brands)
        ? ((product.brands[0] as { slug: string } | undefined)?.slug ?? '')
        : (product.brands as unknown as { slug: string }).slug;

  const defaults: FormDefaults = {
    ...EMPTY_DEFAULTS,
    brandSlug,
    name: product.name ?? '',
    nameEn: product.name_en ?? '',
    slug: product.slug ?? '',
    category: product.category ?? 'outerwear',
    gender: product.gender ?? 'unisex',
    stockType: first?.stock_type ?? 'on_demand',
    description: product.description ?? '',
    featuredRank: str(product.featured_rank),
    // 원가·환율·마진율은 되돌리지 않는다. 비어 있는 것이 "가격 그대로"라는 뜻이다.
    unitCostCad: '',
    cadKrwRate: '',
    marginPercent: '',
    krRetailKrw: str(product.kr_retail_krw),
    shippingKrw: str(product.shipping_krw),
    smartstoreUrl: product.smartstore_url ?? '',
    weightG: str(first?.weight_g),
    lengthMm: str(first?.length_mm),
    widthMm: str(first?.width_mm),
    heightMm: str(first?.height_mm),
    originCountry: product.origin_country ?? '',
    hsCode: product.hs_code ?? '',
    material: product.material ?? '',
    care: product.care ?? '',
    manufacturer: product.manufacturer ?? '',
    asContact: product.as_contact ?? '',
    sizes: joinDistinct(source.map((v) => v.size)),
    colors: joinDistinct(source.map((v) => v.color)),
    publish: product.status ?? 'draft',
  };

  const brands = BRAND_COLUMNS.map((b) => ({ value: b.slug, label: b.label }));

  return (
    <ProductForm
      mode="edit"
      brands={brands}
      action={updateProduct.bind(null, id)}
      defaults={defaults}
      current={{
        priceKrw: first?.price_krw ?? 0,
        variantCount: live.length,
        slug: product.slug ?? '',
      }}
    />
  );
}
