import { notFound } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { AlertLine, DotsLoader, EmptyResult, EmptyState, InvertedChip } from '@/components/ui/states';
import { Container, NarrowShell } from '@/components/layout/container';
import { AccountPreview } from './account-preview';
import { ProductCard, ProductCardSkeleton } from '@/components/store/product-card';
import { EditorialTile } from '@/components/store/editorial-tile';
import { PriceBlock } from '@/components/store/price-block';
import type { CustomsEstimate } from '@/lib/customs';

/**
 * 컴포넌트 프리뷰. 개발 환경 전용이다 — 프로덕션에서는 404를 낸다.
 * 스크린샷 회귀 확인과 상태 점검용이며, 실제 라우트가 아니다.
 */
export const dynamic = 'force-static';

const DUTY_FREE: CustomsEstimate = {
  declaredValueUsd: 112,
  dutyFree: true,
  dutiableValueKrw: 0,
  appliedDutyRate: 0,
  dutyKrw: 0,
  vatKrw: 0,
  totalTaxKrw: 0,
  ckftaApplied: false,
};

const TAXED: CustomsEstimate = {
  declaredValueUsd: 540,
  dutyFree: false,
  dutiableValueKrw: 760_000,
  appliedDutyRate: 0.13,
  dutyKrw: 98_800,
  vatKrw: 85_880,
  totalTaxKrw: 184_680,
  ckftaApplied: false,
};

const CKFTA: CustomsEstimate = { ...TAXED, appliedDutyRate: 0, dutyKrw: 0, totalTaxKrw: 76_000, ckftaApplied: true };

// 실촬영본이 없어 플레이스홀더를 쓴다.
// TODO(image): 검증된 Unsplash URL 또는 실촬영본으로 교체 (BRIEF §9)
const PLACEHOLDER = 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%225%22%3E%3Crect width=%224%22 height=%225%22 fill=%22%23f5f5f5%22/%3E%3C/svg%3E';

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-outline py-12">
      <h2 className="text-editorial font-bold">{title}</h2>
      {note && <p className="mt-1 text-meta text-muted-text">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function ComponentsPreview() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <Container as="main" className="py-16">
      <h1 className="text-headline font-bold">컴포넌트</h1>
      <p className="mt-2 text-body text-muted-text">
        DESIGN.md에 정의된 프리미티브. 개발 환경에서만 보인다.
      </p>

      <Row title="Button" note="변형은 둘뿐이다. 반전 블랙은 화면당 하나 (§4)">
        <div className="flex flex-wrap items-center gap-4">
          <Button chevron>더보기</Button>
          <Button variant="inverted">장바구니 담기</Button>
          <Button variant="inverted" size="sm">1:1 문의</Button>
          <Button disabled>재고를 확인하고 있어요</Button>
          <ButtonLink href="#" chevron>상품 둘러보기</ButtonLink>
        </div>
      </Row>

      <Row title="PriceBlock" note="가격은 상품명보다 커지지 않는다. 관세는 각주다 (§12-2, §12-9)">
        <div className="flex flex-col gap-6">
          <PriceBlock priceKrw={742_000} customs={DUTY_FREE} />
          <PriceBlock priceKrw={742_000} compareAtKrw={980_000} customs={TAXED} />
          <PriceBlock priceKrw={742_000} customs={CKFTA} size="lg" />
        </div>
      </Row>

      <Row title="ProductCard" note="사진 → 상품명 → 가격 → 관세 각주. 상태 3종">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          <ProductCard
            href="#" imageUrl={PLACEHOLDER} imageAlt="눈 덮인 능선에 선 사람이 입은 검정 하드셸 재킷"
            brand="Arc'teryx" name="Beta LT 자켓 블랙" priceKrw={742_000} customs={TAXED}
          />
          <ProductCard
            href="#" imageUrl={PLACEHOLDER} imageAlt="아침 스튜디오에서 촬영한 검정 스쿠바 후디"
            brand="lululemon" name="Scuba 오버사이즈 후디" priceKrw={121_000}
            compareAtKrw={178_000} customs={DUTY_FREE}
          />
          <ProductCard
            href="#" imageUrl={PLACEHOLDER} imageAlt="나무 카운터 위에 놓인 갈색 가죽 가방"
            brand="Coach" name="Tabby 26 브라운" priceKrw={398_000}
            customs={TAXED} availability="checking"
          />
          <ProductCard
            href="#" imageUrl={PLACEHOLDER} imageAlt="회색 니트 비니 정면"
            brand="Arc'teryx" name="Bird Head Toque" priceKrw={62_000}
            customs={DUTY_FREE} availability="sold_out"
          />
        </div>
      </Row>

      <Row title="ProductCardSkeleton" note="시머 금지. 가격은 `--`로 렌더한다 (§14)">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
        </div>
      </Row>

      <Row title="EditorialTile" note="캡션은 이미지 아래. 겹치지 않는다 (§7)">
        <div className="grid gap-8 md:grid-cols-2">
          <EditorialTile
            href="#" imageUrl={PLACEHOLDER} imageAlt="캘거리 매장 진열대"
            latinLabel="Arc'teryx" count="38개"
            title="캐나다에서 시작한 고기능 아웃도어"
          />
          <EditorialTile
            href="#" imageUrl={PLACEHOLDER} imageAlt="검수 중인 실물 택과 시리얼 번호"
            title="캘거리의 3월"
            description="현지 매장에서 직접 고른 이번 주 입고분을 같이 살펴봐요."
          />
        </div>
      </Row>

      <Row title="Field" note="보더는 #949494. 에러는 색만으로 전달하지 않는다">
        <NarrowShell width="form" className="ml-0 flex flex-col gap-8">
          <Field label="이메일" type="email" placeholder="you@example.com" required />
          <Field
            label="개인통관고유부호" required
            hint="P로 시작하는 13자리예요. 관세청 홈페이지에서 발급받을 수 있어요."
            defaultValue="P12345"
            error="개인통관고유부호는 P로 시작하는 13자리예요"
          />
        </NarrowShell>
      </Row>

      <Row title="AccountMenu" note="비로그인 두 어포던스 · 로그인 드롭다운. 반전 블랙을 쓰지 않는다">
        <AccountPreview />
      </Row>

      <Row title="States" note="일러스트 없음. 초록 체크마크 없음 (§14)">
        <div className="flex flex-col gap-10">
          <EmptyState message="장바구니가 비어있어요" action={<ButtonLink href="#" chevron>상품 둘러보기</ButtonLink>} />
          <EmptyResult />
          <DotsLoader />
          <div className="flex items-center gap-4">
            <AlertLine message="아크테릭스 3회 연속 실패" detail="마지막 성공 6시간 전" />
            <InvertedChip>승인 대기 4</InvertedChip>
          </div>
        </div>
      </Row>
    </Container>
  );
}
