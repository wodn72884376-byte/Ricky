import {
  DocList,
  DocNote,
  DocSection,
  DocShell,
  DocTable,
  P,
  RelatedDocs,
} from '@/components/store/prose-page';
import { formatKrw } from '@/lib/money';
import { DEFAULT_SHIPPING_CONFIG, quoteShipping } from '@/lib/shipping';

export const metadata = {
  title: '배송 안내 — RICKY',
  description:
    '캘거리에서 주 3회 출고해요. 운임은 실무게와 부피무게 중 무거운 값으로 계산해요.',
};

const { volumetricDivisor, oversizeMaxSideMm, oversizeFeeKrw } = DEFAULT_SHIPPING_CONFIG;

/**
 * 요금표를 문서에 손으로 적지 않는다 — `quoteShipping()`으로 생성한다.
 * 요율을 바꾸면 계산과 안내가 같이 움직여야 하고, 둘이 어긋나면 그건 고지 위반이다.
 */
const STEPS = Array.from({ length: 20 }, (_, i) => (i + 1) * 500);

function rateRows(steps: number[]) {
  return steps.map((g) => {
    const from = ((g - 500) / 1000).toFixed(2);
    const to = (g / 1000).toFixed(2);
    return [`${from} – ${to} kg`, formatKrw(quoteShipping(g).shippingKrw)];
  });
}

export default function ShippingPolicyPage() {
  return (
    <DocShell
      eyebrow="SHIPPING"
      title="배송 안내"
      lede="캘거리에서 주 3회 출고해요. 출고 후 한국 자택까지는 영업일 기준 4~10일 걸려요."
    >
      <DocSection id="schedule" title="출고와 소요 기간">
        <DocList
          items={[
            <>
              <strong className="font-bold">주 3회 출고</strong> — 결제가 확인된 순서대로 다음 출고 편에 실어요.
            </>,
            <>
              <strong className="font-bold">선매입 상품</strong>은 결제 확인 후 다음 출고 편에 바로 나가요.
            </>,
            <>
              <strong className="font-bold">주문매입 상품</strong>은 현지 매장에서 매입한 뒤 출고해요. 매입에 1~3
              영업일이 더 걸려요.
            </>,
            '캘거리 출고 후 인천 도착·통관·국내 배송까지 영업일 기준 4~10일이에요.',
            '통관 상황이나 항공 스케줄에 따라 늦어질 수 있고, 그런 경우에는 개별로 연락드려요.',
          ]}
        />
        <DocNote>
          영업일은 캐나다와 한국의 공휴일을 모두 제외한 날이에요. 캐나다 공휴일이 한국과 달라서, 한국이 평일이어도
          출고가 없는 날이 있어요.
        </DocNote>
      </DocSection>

      <DocSection id="weight" title="무게는 어떻게 계산되나요">
        <P>
          항공 운송은 무게뿐 아니라 차지하는 공간에도 값을 매겨요. 그래서 운임은{' '}
          <strong className="font-bold">실무게와 부피무게 중 무거운 값</strong>으로 계산해요. 국제 항공 화물의 공통
          규칙이에요.
        </P>
        <DocDefsInline />
        <P>
          예를 들어 다운 재킷은 가볍지만 부피가 커요. 실무게가 800g이어도 60×40×30cm로 포장되면 부피무게는 12kg이
          되고, 운임은 12kg 기준으로 나와요. 반대로 지갑처럼 작고 무거운 물건은 실무게로 계산돼요.
        </P>
        <DocNote>
          그래서 RICKY는 상품마다 무게와 치수를 등록해요. 상품 페이지와 장바구니에서 보시는 배송비는 그 값으로 미리
          계산한 금액이에요.
        </DocNote>
      </DocSection>

      <DocSection id="rates" title="배송 요금표">
        <P>500g 단위로 올려서 계산해요. 1.2kg이면 1.5kg 구간을 적용해요.</P>
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          <DocTable head={['적용 무게', '배송비']} rows={rateRows(STEPS.slice(0, 10))} />
          <DocTable head={['적용 무게', '배송비']} rows={rateRows(STEPS.slice(10))} />
        </div>
        <DocList
          items={[
            <>
              가장 긴 변이 {oversizeMaxSideMm / 10}cm를 넘으면 대형 화물로 분류돼 {formatKrw(oversizeFeeKrw)}이
              더해져요.
            </>,
            '10kg을 넘는 주문은 별도로 안내드려요. 결제 전에 미리 알려드릴게요.',
            '여러 상품을 함께 주문하시면 하나로 합쳐 포장하고, 합친 무게로 한 번만 계산해요.',
          ]}
        />
      </DocSection>

      <DocSection id="customs" title="관세와 부가세">
        <P>
          판매가에는 한국 관세와 부가세가 포함되어 있지 않아요. 미화 150달러를 넘는 주문은 통관할 때 수취인이
          납부하시게 돼요. 얼마가 나올지는 결제 전에 예상 금액으로 보여드려요.
        </P>
        <P>
          주문하실 때 개인통관고유부호를 꼭 입력해 주세요. 수취인 본인 명의 번호여야 하고, 이름과 연락처도 발급
          정보와 같아야 통관이 진행돼요.
        </P>
        <DocNote>자세한 계산 방식은 관세 안내에 정리해 두었어요.</DocNote>
      </DocSection>

      <DocSection id="liability" title="파손·분실이 생기면">
        <P>
          국제 배송 중에 생긴 파손이나 분실의 1차 책임은 RICKY가 부담해요. 고객님이 배송사와 직접 다투셔야 하는 구조가
          아니에요. 수령하신 뒤 24시간 안에 개봉 영상이나 사진과 함께 알려 주시면 저희가 처리해요.
        </P>
        <P>
          다만 주소나 개인통관고유부호를 잘못 적으셔서 반송되거나 통관이 거부된 경우, 그리고 부재로 반송된 경우의
          재발송 비용은 고객님이 부담하세요.
        </P>
      </DocSection>

      <RelatedDocs
        links={[
          { label: '관세 안내', href: '/guide/customs' },
          { label: '교환·반품 안내', href: '/policy/returns' },
          { label: '주문 조회', href: '/orders/lookup' },
        ]}
      />
    </DocShell>
  );
}

/** 두 무게의 정의. 표가 아니라 정의이므로 DocDefs를 쓴다. */
function DocDefsInline() {
  return (
    <dl className="flex flex-col">
      <div className="flex flex-col gap-1 border-b border-outline py-4 md:flex-row md:gap-6">
        <dt className="text-product font-bold text-ink md:w-32 md:shrink-0">실무게</dt>
        <dd className="flex-1 text-product text-ink">저울로 잰 포장 상태 그대로의 무게예요.</dd>
      </div>
      <div className="flex flex-col gap-1 border-b border-outline py-4 md:flex-row md:gap-6">
        <dt className="text-product font-bold text-ink md:w-32 md:shrink-0">부피무게</dt>
        <dd className="flex-1 text-product text-ink">
          <span className="tabular-nums">가로 × 세로 × 높이 (cm) ÷ {volumetricDivisor.toLocaleString('ko-KR')}</span>
          로 나온 값이에요.
        </dd>
      </div>
    </dl>
  );
}
