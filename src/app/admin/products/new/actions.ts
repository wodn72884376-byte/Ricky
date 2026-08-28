'use server';

import { z } from 'zod';
import { hasSupabaseEnv } from '@/lib/env';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { computeSalePrice } from '@/lib/pricing';
import type { ProductCategory, ProductGender, StockType } from '@/lib/supabase/types';
import type { CreateState } from './state';

/**
 * 상품 등록 서버 액션.
 *
 * **판매가는 서버에서 다시 계산한다.** 화면의 미리보기는 참고값이고,
 * 저장되는 값은 여기서 원가·환율·마진율로 산출한 결과다 —
 * 클라이언트가 보낸 가격을 그대로 믿으면 가격이 폼 조작 대상이 된다.
 *
 * 원가(CAD)·환율·마진율은 관리자 전용이므로 어떤 응답에도 싣지 않는다 (PROJECT.md §3.1).
 */

const CATEGORIES = ['outerwear', 'top', 'bottom', 'bag', 'wallet', 'shoes', 'accessory'] as const;

/** 콤마·줄바꿈으로 나눈 뒤 공백과 중복을 정리한다. 순서는 입력 순서를 유지한다. */
function splitList(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !seen.has(s) && seen.add(s));
}

/** SKU에 쓸 수 있는 형태로 줄인다. 한글은 유니코드 그대로 두면 시스템 간 이동에서 깨진다. */
function skuPart(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase() || 'X'
  );
}

const numeric = (label: string) =>
  z.coerce.number({ message: `${label}을 숫자로 입력해 주세요.` });

const Schema = z.object({
  brandSlug: z.string().min(1, '브랜드를 골라 주세요.'),
  name: z.string().trim().min(1, '한국어 상품명을 입력해 주세요.'),
  nameEn: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'URL 주소는 영소문자·숫자·하이픈만 쓸 수 있어요.'),
  category: z.enum(CATEGORIES),
  gender: z.enum(['men', 'women', 'unisex']),
  stockType: z.enum(['preheld', 'on_demand']),
  description: z.string().trim().optional(),

  unitCostCad: numeric('매입가').positive('매입가는 0보다 커야 해요.'),
  cadKrwRate: numeric('환율').positive('환율은 0보다 커야 해요.'),
  marginPercent: numeric('마진율').min(0, '마진율은 0 이상이어야 해요.'),
  krRetailKrw: z.union([z.literal(''), numeric('정발가').positive()]).optional(),

  weightG: numeric('무게').int().positive('무게를 입력해 주세요.'),
  lengthMm: numeric('가로').int().nonnegative(),
  widthMm: numeric('세로').int().nonnegative(),
  heightMm: numeric('높이').int().nonnegative(),

  originCountry: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, '원산지는 두 글자 국가코드예요. 예: VN, CA, CN')
    .or(z.literal('')),
  hsCode: z.string().trim().optional(),

  material: z.string().trim().optional(),
  care: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  asContact: z.string().trim().optional(),

  sizes: z.string().trim().min(1, '사이즈를 하나 이상 입력해 주세요.'),
  colors: z.string().trim().min(1, '색상을 하나 이상 입력해 주세요.'),

  publish: z.enum(['draft', 'active']),
});

export async function createProduct(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: 'error', message: '입력을 확인해 주세요.', fieldErrors };
  }

  const input = parsed.data;
  const publish = input.publish === 'active';

  // 고시 항목은 게시할 때만 필수다. 등록 도중에는 막지 않는다 —
  // DB 제약과 같은 규칙을 화면에서 먼저 설명해 주는 것뿐이다.
  if (publish) {
    const missing: Record<string, string> = {};
    if (!input.originCountry) missing.originCountry = '게시하려면 실물 라벨의 원산지가 필요해요.';
    if (!input.material) missing.material = '게시하려면 소재 표기가 필요해요.';
    if (!input.care) missing.care = '게시하려면 취급 시 주의사항이 필요해요.';
    if (!input.manufacturer) missing.manufacturer = '게시하려면 제조자가 필요해요.';
    if (!input.asContact) missing.asContact = '게시하려면 A/S 책임자와 연락처가 필요해요.';
    if (Object.keys(missing).length > 0) {
      return {
        status: 'error',
        message: '상품 정보 제공 고시 항목이 비어 있어요. 임시저장은 지금도 할 수 있어요.',
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
    return { status: 'error', message: '브랜드를 찾지 못했어요.', fieldErrors: { brandSlug: '등록되지 않은 브랜드예요.' } };
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
      hs_code: input.hsCode || null,
      origin_country: input.originCountry || null,
      description: input.description || null,
      material: input.material || null,
      care: input.care || null,
      manufacturer: input.manufacturer || null,
      as_contact: input.asContact || null,
      kr_retail_krw: input.krRetailKrw ? Number(input.krRetailKrw) : null,
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
    return { status: 'error', message: '옵션을 저장하지 못해 등록을 취소했어요. 사이즈·색상에 중복이 없는지 확인해 주세요.' };
  }

  return {
    status: 'ok',
    created: { slug: product.slug, name: product.name, variants: rows.length, published: publish },
  };
}
