'use server';

import { revalidatePath } from 'next/cache';
import { hasSupabaseEnv } from '@/lib/env';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { computeSalePrice } from '@/lib/pricing';
import type { ProductCategory, ProductGender, ProductStatus, StockType } from '@/lib/supabase/types';
import {
  UpdateSchema,
  collectFieldErrors,
  missingForPublish,
  skuPart,
  splitList,
} from '../../schema';
import type { FormState } from '../../state';

/**
 * 상품 수정 서버 액션.
 *
 * 등록과 다른 점은 둘이다.
 *
 * 1. **가격은 원가를 다시 넣었을 때만 바뀐다.** 환율과 마진율은 저장하지 않으므로
 *    수정 화면이 지금 값을 되돌려 놓을 수가 없다. 되돌릴 수 없는 값을 기본값으로
 *    채워 두면 저장할 때마다 판매가가 조용히 움직인다 — 그래서 비워 두고,
 *    비어 있으면 지금 판매가를 그대로 둔다.
 *
 * 2. **옵션은 지우지 않는다.** `order_items.variant_id`가 `on delete restrict`라
 *    한 번이라도 팔린 옵션은 삭제되지 않는다. 목록에서 빠진 조합은 `active = false`로
 *    내리고, 다시 넣으면 되살린다. 조합을 (사이즈, 색상)으로 맞추므로
 *    URL 주소를 바꿔도 SKU만 달라질 뿐 기존 옵션은 유지된다.
 */
export async function updateProduct(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: 'error',
      message: '입력을 확인해 주세요.',
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const input = parsed.data;
  const status = input.publish as ProductStatus;

  if (status === 'active') {
    const missing = missingForPublish(input);
    if (Object.keys(missing).length > 0) {
      return {
        status: 'error',
        message: '판매 중으로 두려면 아래 항목이 필요해요. 임시저장은 지금도 할 수 있어요.',
        fieldErrors: missing,
      };
    }
  }

  // 셋 중 하나만 채우면 무엇을 의도한 건지 알 수 없다. 조용히 기본값으로 메우지 않는다.
  const priceInputs = [input.unitCostCad, input.cadKrwRate, input.marginPercent];
  const filled = priceInputs.filter((v) => v !== '' && v !== undefined).length;
  const repricing = filled === 3;

  if (filled > 0 && !repricing) {
    const blank = (v: unknown) => v === '' || v === undefined;
    return {
      status: 'error',
      message:
        '가격을 다시 계산하려면 매입가·환율·마진율을 모두 채워 주세요. 셋 다 비우면 지금 가격을 그대로 둬요.',
      fieldErrors: {
        ...(blank(input.unitCostCad) ? { unitCostCad: '매입가가 비어 있어요.' } : {}),
        ...(blank(input.cadKrwRate) ? { cadKrwRate: '환율이 비어 있어요.' } : {}),
        ...(blank(input.marginPercent) ? { marginPercent: '마진율이 비어 있어요.' } : {}),
      },
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: 'error',
      message: '데이터베이스에 연결되지 않았어요. `.env.local`의 Supabase 키를 채워 주세요.',
    };
  }

  const user = await getSessionUser();
  if (!user?.isAdmin) return { status: 'error', message: '권한이 없어요.' };

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

  const { data: existing, error: existingError } = await supabase
    .from('product_variants')
    .select('id, size, color, price_krw, cost_cad_cents')
    .eq('product_id', id)
    .order('created_at', { ascending: true });

  if (existingError || !existing || existing.length === 0) {
    return { status: 'error', message: '이 상품의 옵션을 읽지 못했어요.' };
  }

  const priced = repricing
    ? computeSalePrice({
        unitCostCadCents: Math.round(Number(input.unitCostCad) * 100),
        cadKrwRate: Number(input.cadKrwRate),
        marginRate: Number(input.marginPercent) / 100,
      })
    : null;

  // 새로 생기는 조합이 물려받을 값. 다시 계산하지 않는다면 기존 옵션의 값을 따른다.
  const basePriceKrw = priced?.priceKrw ?? existing[0].price_krw;
  const baseCostCadCents = priced?.landedCostCadCents ?? existing[0].cost_cad_cents;

  const { error: productError } = await supabase
    .from('products')
    .update({
      brand_id: brand.id,
      name: input.name,
      name_en: input.nameEn || null,
      slug: input.slug,
      category: input.category as ProductCategory,
      gender: input.gender as ProductGender,
      featured_rank:
        input.featuredRank === '' || input.featuredRank === undefined
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
      shipping_krw:
        input.shippingKrw === '' || input.shippingKrw === undefined
          ? null
          : Number(input.shippingKrw),
      smartstore_url: input.smartstoreUrl || null,
      status,
    })
    .eq('id', id);

  if (productError) {
    const duplicate = productError.code === '23505';
    return {
      status: 'error',
      message: duplicate
        ? '같은 URL 주소가 이미 있어요.'
        : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      fieldErrors: duplicate ? { slug: '이미 쓰이고 있는 주소예요.' } : undefined,
    };
  }

  // ── 옵션 맞추기 ────────────────────────────────────────────────
  // (사이즈, 색상)이 옵션의 정체성이다 — DB에도 같은 조합으로 unique가 걸려 있다.
  // 구분자는 탭이다. 사이즈나 색상에 들어갈 일이 없다.
  const key = (size: string | null, color: string | null) => `${size ?? ''}\t${color ?? ''}`;

  const sizes = splitList(input.sizes);
  const colors = splitList(input.colors);
  const desired = sizes.flatMap((size) => colors.map((color) => ({ size, color })));
  const desiredKeys = new Set(desired.map((d) => key(d.size, d.color)));
  const existingByKey = new Map(existing.map((v) => [key(v.size, v.color), v]));

  const shared = {
    weight_g: input.weightG,
    length_mm: input.lengthMm || null,
    width_mm: input.widthMm || null,
    height_mm: input.heightMm || null,
    stock_type: input.stockType as StockType,
    active: true,
    ...(priced ? { price_krw: priced.priceKrw, cost_cad_cents: priced.landedCostCadCents } : {}),
  };

  const keptIds = desired
    .map((d) => existingByKey.get(key(d.size, d.color))?.id)
    .filter((v): v is string => Boolean(v));

  if (keptIds.length > 0) {
    const { error } = await supabase.from('product_variants').update(shared).in('id', keptIds);
    if (error) return { status: 'error', message: '옵션을 저장하지 못했어요.' };
  }

  const added = desired.filter((d) => !existingByKey.has(key(d.size, d.color)));
  if (added.length > 0) {
    const { error } = await supabase.from('product_variants').insert(
      added.map(({ size, color }) => ({
        product_id: id,
        sku: `${skuPart(input.brandSlug)}-${skuPart(input.slug)}-${skuPart(size)}-${skuPart(color)}`,
        size,
        color,
        price_krw: basePriceKrw,
        cost_cad_cents: baseCostCadCents,
        ...shared,
      })),
    );
    if (error) {
      return {
        status: 'error',
        message: '새 옵션을 추가하지 못했어요. 사이즈·색상에 중복이 없는지 확인해 주세요.',
      };
    }
  }

  // 목록에서 빠진 조합은 내려 두기만 한다. 지우면 주문 기록이 끊긴다.
  const removedIds = existing
    .filter((v) => !desiredKeys.has(key(v.size, v.color)))
    .map((v) => v.id);

  if (removedIds.length > 0) {
    const { error } = await supabase
      .from('product_variants')
      .update({ active: false })
      .in('id', removedIds);
    if (error) return { status: 'error', message: '빠진 옵션을 정리하지 못했어요.' };
  }

  revalidatePath('/admin/products');
  revalidatePath(`/products/${input.slug}`);

  return {
    status: 'ok',
    saved: { slug: input.slug, name: input.name, variants: desired.length, status },
  };
}
