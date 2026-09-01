import type { BentoTile } from '@/components/store/brand-bento';

/**
 * 홈 브랜드 관문 타일.
 *
 * **지금은 어느 화면에서도 쓰지 않는다** (2026-08-31 운영자 요청 — 홈에서 내렸다).
 * 지우지 않고 여기 세워 둔다: 브랜드 관문은 DESIGN.md §4가 규격을 가진 홈의 단위이고,
 * 사진·대체텍스트·CTA 문구를 다시 쓰는 것이 이 파일을 남겨 두는 것보다 비싸다.
 *
 * 되살리는 법 — 원하는 화면에서:
 *
 *     import { BrandBento } from '@/components/store/brand-bento';
 *     import { HOME_BRAND_TILES } from '@/lib/home-bento';
 *     …
 *     <BrandBento tiles={HOME_BRAND_TILES} />
 *
 * 사진은 전부 임시본이다 — `public/images/gateways/ATTRIBUTION.md` 참조.
 */
export const HOME_BRAND_TILES: BentoTile[] = [
  {
    href: '/brands/arcteryx',
    imageUrl: '/images/gateways/arcteryx.webp',
    imageAlt: '큰 배낭을 멘 사람이 아침 안개가 걸린 능선에 서서 골짜기를 내려다보고 있다',
    label: "Arc'teryx",
    cta: '아크테릭스 보기',
    feature: true,
  },
  {
    href: '/brands/lululemon',
    imageUrl: '/images/gateways/lululemon.webp',
    imageAlt: '해질 무렵 산을 배경으로 한 사람이 자전거를 타고 도로를 지나간다',
    label: 'lululemon',
    cta: '룰루레몬 보기',
  },
  {
    href: '/brands/coach',
    imageUrl: '/images/gateways/coach.webp',
    imageAlt: '흰 니트를 입고 어깨가방을 멘 사람이 승강장에 서 있고 뒤로 열차가 흐릿하게 지나간다',
    label: 'Coach',
    cta: '코치 보기',
  },
];
