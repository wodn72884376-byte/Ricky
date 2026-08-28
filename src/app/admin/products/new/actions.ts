'use server';

import { revalidatePath } from 'next/cache';
import { hasSupabaseEnv } from '@/lib/env';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { computeSalePrice } from '@/lib/pricing';
import type { ProductCategory, ProductGender, StockType } from '@/lib/supabase/types';
import {
  CreateSchema,
  collectFieldErrors,
  missingForPublish,
  skuPart,
  splitList,
} from '../schema';
import type { FormState } from '../state';

/**
 * 상품 등록 서버 액션.
 *
 * **판매가는 서버에서 다시 계산한다.** 화면의 미리보기는 참고값이고,
 * 저장되는 값은 여기서 원가·환율·마진율로 산출한 결과다 —
 * 클라이언트가 보낸 가격을 그대로 믿으면 가격이 폼 조작 대상이 된다.
 *
 * 원가(CAD)·환율·마진율은 관리자 전용이므로 어떤 응답에도 싣지 않는다 (PROJECT.md §3.1).
 */
export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = CreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: 'error',
      message: '입력을 확인해 주세요.',
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const input = parsed.data;
  const publish = input.publish === 'active';

  // 고시 항목은 게시할 때만 필수다. 등록 도중에는 막지 않는다 —
  // DB 제약과 같은 규칙을 화면에서 먼저 설명해 주는 것뿐이다.
  if (publish) {
    const missing = missingForPublish(input);
    if (Object.keys(missing).length > 0) {
      return {
        status: 'error',
        message: '게시에 필요한 항목이 비어 있어요. 임시저장은 지금도 할 수 있어요.',
        fieldErrors: missing,
      };
    }
  }

  if (!hasSupabaseEnv()) {
    return {
      status: 'error',
      message: '데이터베이스에 연결되지 않았어요. `.env.local`의 Supabase 키를 채워 주세요.',
    };
  }

  // 라우트 레벨(admin/layout)에서 이미 막지만 액션은 직접 호출될 수 있다.
  const user = await getSessionUser();
  if (!user?.isAdmin) return { status: 'error', message: '권한이 없어요.' };

  const sizes = splitList(input.sizes);
  const colors = splitList(input.colors);

  // 판매가는 여기서 산출한다. 화면이 보낸 값을 쓰지 않는다.
  const { priceKrw, landedCostCadCents } = computeSalePrice({
    unitCostCadCents: Math.round(input.unitCostCad * 100),
    cadKrwRate: input.cadKrwRate,
    marginRate: input.marginPercent / 100,
  });

  const supabase = await createClient();

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', input.brandSlug)
    .single();

  if (brandError || !brand) {
    return {
      status: 'error',
      message: '브랜드를 찾지 못했어요.',
      fieldErrors: { brandSlug: '등록되지 않은 브랜드예요.' },
    };
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      brand_id: brand.id,
      name: input.name,
      name_en: input.nameEn || null,
      slug: input.slug,
      category: input.category as ProductCategory,
      gender: input.gender as ProductGender,
      featured_rank: input.featuredRank === '' || input.featuredRank === undefined
        ? null
        : Number(input.featuredRank),
      hs_code: input.hsCode || null,
      origin_country: input.originCountry || null,
      description: input.description || null,
      material: input.material || null,
      care: input.care || null,
      manufacturer: input.manufacturer || null,
      as_contact: input.asContact || null,
      kr_retail_krw: input.krRetailKrw ? Number(input.krRetailKrw) : null,
      // `=== ''`로 판단한다. `!input.shippingKrw`면 0(무료배송)이 null로 새어 계산값으로 덮인다.
      shipping_krw: input.shippingKrw === '' || input.shippingKrw === undefined
        ? null
        : Number(input.shippingKrw),
      smartstore_url: input.smartstoreUrl || null,
      status: publish ? 'active' : 'draft',
    })
    .select('id, slug, name')
    .single();

  if (productError || !product) {
    const duplicate = productError?.code === '23505';
    return {
      status: 'error',
      message: duplicate ? '같은 URL 주소가 이미 있어요.' : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      fieldErrors: duplicate ? { slug: '이미 쓰이고 있는 주소예요.' } : undefined,
    };
  }

  const rows = sizes.flatMap((size) =>
    colors.map((color) => ({
      product_id: product.id,
      sku: `${skuPart(input.brandSlug)}-${skuPart(input.slug)}-${skuPart(size)}-${skuPart(color)}`,
      size,
      color,
      cost_cad_cents: landedCostCadCents,
      price_krw: priceKrw,
      weight_g: input.weightG,
      length_mm: input.lengthMm || null,
      width_mm: input.widthMm || null,
      height_mm: input.heightMm || null,
      stock_type: input.stockType as StockType,
    })),
  );

  const { error: variantError } = await supabase.from('product_variants').insert(rows);

  if (variantError) {
    // 옵션이 없는 상품은 팔 수 없다. 상품만 남기지 않고 되돌린다.
    await supabase.from('products').delete().eq('id', product.id);
    return {
      status: 'error',
      message: '옵션을 저장하지 못해 등록을 취소했어요. 사이즈·색상에 중복이 없는지 확인해 주세요.',
    };
  }

  revalidatePath('/admin/products');

  return {
    status: 'ok',
    saved: {
      slug: product.slug,
      name: product.name,
      variants: rows.length,
      status: publish ? 'active' : 'draft',
    },
  };
}
