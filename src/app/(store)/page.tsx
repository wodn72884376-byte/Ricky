import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { BrandBento, type BentoTile } from '@/components/store/brand-bento';
import { ProductRail } from '@/components/store/product-rail';
import { ProductSection } from '@/components/store/product-section';
import { PromiseCards, type Promise as PromiseCard } from '@/components/store/promise-cards';
import { allProducts, bestSellers, categoryTabs, toCardProps } from '@/lib/catalog';

/**
 * 홈 (docs/wireframes/01-home.md).
 *
 *   1. 브랜드 벤토      — 어디로 갈지 고른다
 *   2. BEST 레일        — 지금 잘 나가는 것
 *   3. 전체 상품 그리드  — 그냥 둘러보기
 *   4. 약속 카드         — 왜 여기서 사도 되는지
 *
 * 순서가 곧 논지다. 물건을 먼저 보여주고, 신뢰는 마지막에 증명한다 —
 * 신뢰 문구를 앞세우면 방어적으로 읽힌다.
 *
 * 상품 데이터는 `아크테릭스/` 폴더 + 가격표에서 임포트한 실제 카탈로그다 (npm run catalog:import).
 * TODO(data): DB 연결 후 `store_variants` 뷰 조회로 교체한다 — 호출부는 그대로다.
 * TODO(image): 사진은 전부 임시본이다. public/images/gateways/ATTRIBUTION.md 참조.
 *               특히 약속 카드는 검수 사진·영수증·포장 사진이 들어갈 자리인데 실물이 없어
 *               관련 없는 임시 컷을 쓰고 있다. alt는 **실제 사진 내용**을 쓴다 —
 *               없는 것을 있다고 적으면 스크린리더 사용자에게 거짓말이 된다.
 */

const BRAND_TILES: BentoTile[] = [
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

const PROMISES: PromiseCard[] = [
  {
    label: '정품',
    title: '캐나다 공식 매장에서 직접 매입해요',
    body: '대행이 아니라 우리가 사서 우리 이름으로 팔아요. 매입 영수증과 인보이스를 상자에 함께 넣어요.',
    imageUrl: '/images/samples/accessories.webp',
    imageAlt: '가죽 지갑과 선글라스, 시계 등 소품이 평면으로 놓여 있다',
    href: '/guide/inspection',
    cta: '검수 방식 보기',
  },
  {
    label: '검수',
    title: '출고 전에 실물을 촬영해서 남겨요',
    body: '택과 시리얼, 사이즈 라벨, 봉제를 찍어요. 보정하지 않고 워터마크도 얹지 않아요.',
    imageUrl: '/images/samples/jacket-black.webp',
    imageAlt: '카멜색 후드 재킷을 입은 뒷모습, 배경은 안개',
    href: '/guide/inspection',
    cta: '검수 사진 보기',
  },
  {
    label: '배송',
    title: '주 3회 출고해요',
    body: '캘거리에서 밴쿠버를 거쳐 인천으로 가요. 출고 후 영업일 기준 7~14일 걸려요.',
    imageUrl: '/images/samples/bag-leather.webp',
    imageAlt: '나무 테이블 위에 놓인 갈색 가죽 가방과 노트',
    href: '/policy/shipping',
    cta: '배송 안내 보기',
  },
  {
    label: '교환·반품',
    title: '해외 배송이어도 교환과 반품이 가능해요',
    body: '국제 배송 중 생긴 파손과 분실은 우리가 먼저 책임져요. 조건과 절차를 미리 밝혀둘게요.',
    imageUrl: '/images/samples/boots-tan.webp',
    imageAlt: '카디건과 부츠를 착용하고 스툴에 앉은 인물',
    href: '/policy/returns',
    cta: '정책 보기',
  },
];

export default function Home() {
  const products = allProducts().map(toCardProps);
  const best = bestSellers(6).map(toCardProps);
  const tabs = categoryTabs(allProducts());

  return (
    <>
      <Container as="section" className="py-14 lg:py-24">
        <BrandBento tiles={BRAND_TILES} />
      </Container>

      <Container as="section" className="py-14 lg:py-24">
        <ProductRail products={best} />
      </Container>

      <Container as="section" className="py-14 lg:py-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-editorial font-bold lg:text-headline">전체 상품</h2>
            <p className="mt-1 text-body text-muted-text">캘거리에서 직접 고른 것들이에요.</p>
          </div>
        </div>

        <ProductSection products={products} tabs={tabs} />

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/shop" chevron>
            상품 더 보기
          </ButtonLink>
        </div>
      </Container>

      <Container as="section" className="py-14 lg:py-24">
        <h2 className="text-editorial font-bold lg:text-headline">왜 여기서 사도 되는지</h2>
        <p className="mt-1 mb-8 text-body text-muted-text">
          선언 대신 문서로 증명할게요.
        </p>
        <PromiseCards promises={PROMISES} />
      </Container>

      <Container as="section" className="py-14 pb-24 lg:py-24">
        <h2 className="text-editorial font-bold lg:text-headline">관세 안내</h2>
        <p className="mt-4 max-w-[640px] text-body text-ink">
          미화 150달러 이하는 관세와 부가세가 면제돼요. 넘으면 상품가와 국제 운임을 합한 금액 전체에
          관세와 부가세 10%가 부과되고, 통관할 때 수취인이 납부해요. 상품마다 예상 세액을 미리
          계산해서 보여드려요.
        </p>
        <ButtonLink href="/guide/customs" chevron className="mt-8">
          자세히 보기
        </ButtonLink>
      </Container>
    </>
  );
}
