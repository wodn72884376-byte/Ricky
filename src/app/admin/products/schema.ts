import { z } from 'zod';

/**
 * 상품 등록·수정이 공유하는 입력 규격.
 *
 * 등록과 수정은 같은 폼을 쓰므로 검증도 같아야 한다. 두 벌로 두면 한쪽에만
 * 규칙을 고치게 되고, 그때 어긋나는 것은 **화면이 아니라 DB 제약**이다 —
 * 게시 게이트(products_disclosure_complete)는 양쪽 모두에 걸린다.
 *
 * 차이는 둘뿐이다.
 *   1. 원가·환율·마진율 — 등록에는 필수, 수정에는 선택.
 *      환율과 마진율은 저장하지 않으므로 수정 화면에 되돌려 놓을 수가 없다.
 *      비워 두면 지금 판매가를 그대로 둔다는 뜻이고, 셋을 채우면 다시 계산한다.
 *   2. 상태 — 등록은 임시저장/게시 둘, 수정은 네 가지 전부.
 */

export const CATEGORIES = [
  'outerwear', 'top', 'bottom', 'bag', 'wallet', 'shoes', 'accessory',
] as const;

export const STATUSES = ['draft', 'active', 'paused', 'archived'] as const;


/** 콤마·줄바꿈으로 나눈 뒤 공백과 중복을 정리한다. 순서는 입력 순서를 유지한다. */
export function splitList(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !seen.has(s) && seen.add(s));
}

/** SKU에 쓸 수 있는 형태로 줄인다. 한글은 유니코드 그대로 두면 시스템 간 이동에서 깨진다. */
export function skuPart(value: string): string {
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

/** 비울 수 있는 숫자. `''`와 `0`은 다른 뜻이므로 빈 문자열을 유지한 채 통과시킨다. */
const optionalNumeric = (label: string, min = 0) =>
  z.union([z.literal(''), numeric(label).min(min)]).optional();

const shared = {
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

  krRetailKrw: z.union([z.literal(''), numeric('정발가').positive()]).optional(),
  /** BEST 큐레이션 순서. 비우면 BEST가 아니다 */
  featuredRank: optionalNumeric('BEST 순서'),

  weightG: numeric('무게').int().positive('무게를 입력해 주세요.'),
  // 비우면 무게·부피 계산값을 쓴다. 0은 "무료배송"이라는 뜻이므로 빈값과 구분한다.
  shippingKrw: z
    .union([z.literal(''), numeric('배송비').int().nonnegative('배송비는 0 이상이어야 해요.')])
    .optional(),
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

  // 결제로 가는 유일한 경로. 형식은 DB check와 같은 규칙이다.
  smartstoreUrl: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .regex(
          /^https:\/\/(smartstore|brand)\.naver\.com\/\S+$/,
          '스마트스토어 상품 주소를 넣어 주세요. https://smartstore.naver.com/… 형태예요.',
        ),
    ])
    .optional(),

  sizes: z.string().trim().min(1, '사이즈를 하나 이상 입력해 주세요.'),
  colors: z.string().trim().min(1, '색상을 하나 이상 입력해 주세요.'),
};

export const CreateSchema = z.object({
  ...shared,
  unitCostCad: numeric('매입가').positive('매입가는 0보다 커야 해요.'),
  cadKrwRate: numeric('환율').positive('환율은 0보다 커야 해요.'),
  marginPercent: numeric('마진율').min(0, '마진율은 0 이상이어야 해요.'),
  publish: z.enum(['draft', 'active']),
});

export const UpdateSchema = z.object({
  ...shared,
  unitCostCad: z.union([z.literal(''), numeric('매입가').positive()]).optional(),
  cadKrwRate: z.union([z.literal(''), numeric('환율').positive()]).optional(),
  marginPercent: optionalNumeric('마진율'),
  publish: z.enum(STATUSES),
});

/** 게시하려면 있어야 하는 것들. DB의 products_disclosure_complete와 같은 목록이다. */
export function missingForPublish(input: {
  originCountry: string;
  material?: string;
  care?: string;
  manufacturer?: string;
  asContact?: string;
  smartstoreUrl?: string;
}): Record<string, string> {
  const missing: Record<string, string> = {};
  if (!input.originCountry) missing.originCountry = '게시하려면 실물 라벨의 원산지가 필요해요.';
  if (!input.material) missing.material = '게시하려면 소재 표기가 필요해요.';
  if (!input.care) missing.care = '게시하려면 취급 시 주의사항이 필요해요.';
  if (!input.manufacturer) missing.manufacturer = '게시하려면 제조자가 필요해요.';
  if (!input.asContact) missing.asContact = '게시하려면 A/S 책임자와 연락처가 필요해요.';
  if (!input.smartstoreUrl)
    missing.smartstoreUrl = '게시하려면 스마트스토어 상품 주소가 필요해요. 결제가 거기서 일어나요.';
  return missing;
}

/** zod 이슈를 필드명 → 한 문장으로 접는다. 첫 이슈만 남긴다 — 한 필드에 두 줄은 읽히지 않는다. */
export function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
