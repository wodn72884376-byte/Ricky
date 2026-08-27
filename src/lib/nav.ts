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
  /** 드롭다운 컬럼 헤더. 라틴 표기를 그대로 쓴다 */
  label: string;
  categories: CategoryEntry[];
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

export const BRAND_COLUMNS: BrandColumn[] = [
  { slug: 'arcteryx', label: "Arc'teryx", categories: APPAREL },
  { slug: 'lululemon', label: 'lululemon', categories: APPAREL },
  { slug: 'coach', label: 'Coach', categories: LEATHER_GOODS },
];

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
  { key: 'arrivals', label: '이번 주 입고', href: '/arrivals', hasMenu: false },
] as const;
