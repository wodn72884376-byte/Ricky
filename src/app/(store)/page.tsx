import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { ProductRail } from '@/components/store/product-rail';
import { ProductSection } from '@/components/store/product-section';
import { PromiseCards, type Promise as PromiseCard } from '@/components/store/promise-cards';
import { VideoHero } from '@/components/store/video-hero';
import { allProducts, bestSellers, categoryTabs, toCardProps } from '@/lib/catalog';

/**
 * 홈 (docs/wireframes/01-home.md).
 *
 *   1. 영상 히어로      — 무엇을 파는 곳인지, 어디부터 볼지
 *   2. BEST 레일        — 히어로 CTA가 가리키는 것을 바로 잇는다
 *   3. 전체 상품 그리드  — 그냥 둘러보기
 *   4. 약속 카드         — 왜 여기서 사도 되는지
 *
 * 순서가 곧 논지다. 물건을 먼저 보여주고, 신뢰는 마지막에 증명한다 —
 * 신뢰 문구를 앞세우면 방어적으로 읽힌다.
 *
 * **브랜드 벤토는 홈에서 내렸다** (2026-08-31 운영자 요청). 영상 히어로가 그 역할을 대신한다.
 * 지우지는 않았다 — 타일 데이터는 `src/lib/home-bento.ts`, 컴포넌트는
 * `components/store/brand-bento.tsx` 에 그대로 있다. 되살리려면 그 둘을 import 해서
 * `<BrandBento tiles={HOME_BRAND_TILES} />` 한 줄을 원하는 자리에 넣으면 된다.
 *
 * 상품 데이터는 `아크테릭스/` 폴더 + 가격표에서 임포트한 실제 카탈로그다 (npm run catalog:import).
 * TODO(data): DB 연결 후 `store_variants` 뷰 조회로 교체한다 — 호출부는 그대로다.
 * TODO(image): 사진은 전부 임시본이다. public/images/gateways/ATTRIBUTION.md 참조.
 *               특히 약속 카드는 검수 사진·영수증·포장 사진이 들어갈 자리인데 실물이 없어
 *               관련 없는 임시 컷을 쓰고 있다. alt는 **실제 사진 내용**을 쓴다 —
 *               없는 것을 있다고 적으면 스크린리더 사용자에게 거짓말이 된다.
 */

/*
  문구는 운영자가 직접 준 것을 그대로 쓴다 (2026-08-31). 종결이 `~합니다` 인 것은
  실수가 아니라 **브랜드 톤 변경**이다 — .omd/preferences.md #20 참조.
  DESIGN.md §10은 아직 `~해요` 로 적혀 있으므로, 여기 문구를 "고치기" 전에 그 항목을 볼 것.
*/
const PROMISES: PromiseCard[] = [
  {
    label: '정품',
    title: '캐나다 공식 스토어 100% 직접 바잉',
    body: '현지 파트너나 도매상을 거치지 않고, 캘거리 현지에서 직접 매입 및 발송합니다. 글로벌 워런티 접수에 필요한 정식 매입 영수증(인보이스) 원본을 상품과 함께 동봉해 드립니다.',
    imageUrl: '/images/samples/accessories.webp',
    imageAlt: '가죽 지갑과 선글라스, 시계 등 소품이 평면으로 놓여 있다',
    href: '/guide/inspection',
    cta: '검수 방식 보기',
  },
  {
    label: '검수',
    title: '출고 전 꼼꼼한 실물 검수와 기록',
    body: '포장 전 모든 상품의 택, 시리얼 넘버, 주요 봉제 상태 등을 사진으로 꼼꼼히 기록합니다. 고객님이 온전히 믿으실 수 있도록 어떠한 보정도 거치지 않은 원본 그대로 검수합니다.',
    imageUrl: '/images/samples/jacket-black.webp',
    imageAlt: '카멜색 후드 재킷을 입은 뒷모습, 배경은 안개',
    href: '/guide/inspection',
    cta: '검수 사진 보기',
  },
  {
    label: '배송',
    title: '주 3회 정기 항공 출고',
    body: '캘거리 현지에서 신속하게 주 3회 정기 출고를 진행합니다. 밴쿠버를 거쳐 한국(인천)까지, 출고일 기준 영업일 7~14일 이내에 가장 안전한 경로로 배송됩니다.',
    imageUrl: '/images/samples/bag-leather.webp',
    imageAlt: '나무 테이블 위에 놓인 갈색 가죽 가방과 노트',
    href: '/policy/shipping',
    cta: '배송 안내 보기',
  },
  {
    label: '교환·반품',
    title: '해외 직구 안심 교환·반품 시스템',
    body: '해외 직구의 불안감을 덜어드립니다. 국제 배송 중 발생하는 파손 및 분실 사고는 100% 책임지고 보상해 드리며, 투명한 기준에 따라 교환 및 반품 절차를 지원합니다.',
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
      <VideoHero />

      <Container as="section" className="py-14 lg:py-24">
        <ProductRail products={best} />
      </Container>

      <Container as="section" className="py-14 lg:py-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-editorial font-bold lg:text-headline">전체 상품</h2>
            <p className="mt-1 text-body text-muted-text">캘거리 현지에서 직접 고른 상품입니다.</p>
          </div>
        </div>

        <ProductSection products={products} tabs={tabs} previewRows={3} />

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/shop" chevron>
            상품 더 보기
          </ButtonLink>
        </div>
      </Container>

      <Container as="section" className="py-14 lg:py-24">
        <h2 className="text-editorial font-bold lg:text-headline">믿고 구매하실 수 있는 이유</h2>
        <p className="mt-1 mb-8 text-body text-muted-text">
          말뿐인 약속이 아닌, 투명한 절차와 확실한 증빙으로 보여드립니다.
        </p>
        <PromiseCards promises={PROMISES} />
      </Container>

      <Container as="section" className="py-14 pb-24 lg:py-24">
        <h2 className="text-editorial font-bold lg:text-headline">관세 안내</h2>
        <p className="mt-4 max-w-[640px] text-body text-ink">
          미화 150달러 이하는 관세와 부가세가 면제됩니다. 이를 넘으면 상품가와 국제 운임을 합한
          금액 전체에 관세와 부가세 10%가 부과되며, 통관 시 수취인이 납부합니다. 상품마다 예상
          세액을 미리 계산해 보여드립니다.
        </p>
        <ButtonLink href="/guide/customs" chevron className="mt-8">
          자세히 보기
        </ButtonLink>
      </Container>
    </>
  );
}
