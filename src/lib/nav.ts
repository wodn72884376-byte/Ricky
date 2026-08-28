/**
 * 내비게이션 구조. 라우트와 라벨의 단일 출처다.
 *
 * 상단 축은 성별·큐레이션이고, 브랜드는 드롭다운의 컬럼으로 들어간다.
 * 홈은 여전히 브랜드 3분할이다 — 홈은 "무엇을 파는가"를 보여주고,
 * 내비게이션은 "어떻게 찾는가"를 맡는다 (docs/IA.md §2).
 */

export type Gender = 'men' | 'women';

/** 카테고리는 브랜드마다 다르다. 코치에 `아우터`를, 아크테릭스에 `지갑`을 두지 않는다. */
export type CategoryEntry = { label: string; value: string | null };

export type BrandColumn = {
  slug: string;
  /** 드롭다운 컬럼 헤더. 브랜드 공식 표기를 그대로 쓴다 (`lululemon` 소문자, `Arc'teryx` 아포스트로피) */
  label: string;
  /**
   * 헤더 3행처럼 조밀한 줄에서 쓰는 짧은 표기.
   * `Polo Ralph Lauren`을 7개 브랜드와 한 줄에 세우면 줄이 넘친다 — 없으면 `label`을 쓴다.
   */
  short?: string;
  categories: CategoryEntry[];
  /** 아직 매입하지 않은 브랜드. 목록은 열어 두되 빈 상태를 그대로 쓴다 (DESIGN.md §12-8) */
  comingSoon?: boolean;
};

const APPAREL: CategoryEntry[] = [
  { label: '전체', value: null },
  { label: '아우터', value: 'outerwear' },
  { label: '상의', value: 'top' },
  { label: '하의', value: 'bottom' },
  { label: '악세서리', value: 'accessory' },
];

const LEATHER_GOODS: CategoryEntry[] = [
  { label: '전체', value: null },
  { label: '가방', value: 'bag' },
  { label: '지갑', value: 'wallet' },
  { label: '신발', value: 'shoes' },
  { label: '악세서리', value: 'accessory' },
];

/** 아우터가 주력인 브랜드. 하의를 두지 않는다 — 없는 카테고리를 열어 두지 않는다 */
const OUTERWEAR_LED: CategoryEntry[] = [
  { label: '전체', value: null },
  { label: '아우터', value: 'outerwear' },
  { label: '상의', value: 'top' },
  { label: '악세서리', value: 'accessory' },
];

export const BRAND_COLUMNS: BrandColumn[] = [
  { slug: 'arcteryx', label: "Arc'teryx", categories: APPAREL },
  { slug: 'lululemon', label: 'lululemon', categories: APPAREL },
  { slug: 'coach', label: 'Coach', categories: LEATHER_GOODS },
  { slug: 'polo', label: 'Polo Ralph Lauren', short: 'Polo', categories: APPAREL, comingSoon: true },
  { slug: 'tommy', label: 'Tommy Hilfiger', short: 'Tommy', categories: APPAREL, comingSoon: true },
  { slug: 'canada-goose', label: 'Canada Goose', categories: OUTERWEAR_LED, comingSoon: true },
  { slug: 'nobis', label: 'Nobis', categories: OUTERWEAR_LED, comingSoon: true },
];

/** 헤더 3행·푸터처럼 좁은 줄에서 쓰는 표기 */
export function brandShort(brand: BrandColumn): string {
  return brand.short ?? brand.label;
}

/** 브랜드·성별·카테고리를 URL 검색 파라미터로 조합한다 (docs/IA.md §4). */
export function brandHref(slug: string, gender?: Gender, category?: string | null): string {
  const params = new URLSearchParams();
  if (gender) params.set('gender', gender);
  if (category) params.set('category', category);
  const query = params.toString();
  return `/brands/${slug}${query ? `?${query}` : ''}`;
}

export const PRIMARY_NAV = [
  { key: 'best', label: 'BEST', href: '/best', hasMenu: false },
  { key: 'men', label: "Men's", href: '/shop?gender=men', hasMenu: true, gender: 'men' as const },
  { key: 'women', label: "Women's", href: '/shop?gender=women', hasMenu: true, gender: 'women' as const },
] as const;
