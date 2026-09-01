import { DocList, DocNote, DocSection, DocShell, P, RelatedDocs } from '@/components/store/prose-page';

export const metadata = {
  title: 'RICKY 소개',
  description: '캐나다 알버타주 캘거리에서 직접 사서 한국으로 보냅니다.',
};

export default function AboutPage() {
  return (
    <DocShell
      eyebrow="ABOUT"
      title="RICKY 소개"
      lede="한국에 없는 것을, 캘거리에서 직접 사서 보냅니다."
    >
      <DocSection id="what" title="무엇을 하나요">
        <P>
          RICKY는 캐나다 알버타주 캘거리를 거점으로 아크테릭스, 룰루레몬, 코치 같은 프리미엄 브랜드를 한국 고객에게
          판매하는 셀렉트 리테일입니다.
        </P>
        <P>
          중요한 건 <strong className="font-bold">직접 산다</strong>는 부분입니다. 고객님의 심부름을 대신하고 수수료를
          받는 것이 아니라, 저희 자본으로 물건을 사서 저희 이름으로 되팝니다. 그래서 청구서에는 원가와 수수료가 나뉘어
          찍히지 않고 통합된 원화 가격 하나만 나옵니다. 배송 중 파손이나 분실의 1차 책임도 고객님이 아니라 저희가 집니다.
        </P>
      </DocSection>

      <DocSection id="why-calgary" title="왜 캘거리인갑니다">
        <P>
          캐나다의 소비세는 연방 GST 5%와 주별 PST로 나뉩니다. 그런데{' '}
          <strong className="font-bold">알버타주에는 PST가 없습니다.</strong> GST 5%만 붙습니다.
        </P>
        <P>
          PST를 더해 12%(브리티시컬럼비아)나 13%(온타리오)를 내는 다른 주와 비교하면, 같은 물건을 살 때 매입 시점에
          이미 7~8%p 유리합니다. 이 차이가 판매가에 그대로 반영됩니다.
        </P>
        <P>
          소싱은 캘거리 북부의 크로스아이언 밀스를 비롯한 현지 매장에서 합니다. 배송은 캘거리에서 밴쿠버를 거쳐 인천으로
          가는 항공 화물입니다.
        </P>
      </DocSection>

      <DocSection id="promise" title="네 가지 약속">
        <DocList
          items={[
            <>
              <strong className="font-bold">100% 정품.</strong> 모든 상품을 캐나다 공식 매장에서 매입합니다. 증명은
              선언이 아니라 문서로 합니다 — 매입 영수증과 인보이스를 함께 보내드립니다.
            </>,
            <>
              <strong className="font-bold">검수 사진.</strong> 출고 전에 실물 택, 시리얼, 사이즈 라벨, 봉제를 촬영해
              남깁니다. 보정하지 않고, 워터마크도 얹지 않습니다.
            </>,
            <>
              <strong className="font-bold">주 3회 출고.</strong> 캘거리 출고 후 한국 자택까지 영업일 기준 7~14일이
              걸립니다.
            </>,
            <>
              <strong className="font-bold">교환·반품 가능.</strong> 해외 배송에서 흔히 피하는 지점입니다. 저희는
              피하지 않습니다. 대신 조건과 비용을 먼저 정확히 알려드립니다.
            </>,
          ]}
        />
      </DocSection>

      <DocSection id="not" title="하지 않는 것">
        <DocList
          items={[
            '상시 세일 배너와 할인 압박. 최저가라고 쓰지 않습니다.',
            '카운트다운 타이머와 마감 임박 문구. 급하게 만들지 않습니다.',
            '통관 비용의 사후 통보. 예상 세액은 결제 전에 계산해서 보여드립니다.',
            '재고를 확인하지 않은 채 주문부터 받는 것. 현지 재고가 최근에 확인되지 않았으면 결제를 열지 않습니다.',
          ]}
        />
        <P>
          대신 받아들이는 것이 있습니다. 긴 편집, 사진을 주 목소리로 삼는 것, 그리고 고객은 구매자이기 전에 읽는 사람이라는
          생각입니다.
        </P>
      </DocSection>

      <DocSection id="price" title="가격은 하나로만 말합니다">
        <P>
          보시는 금액은 마진이 포함된 최종 원화 가격 하나입니다. 원가와 수수료를 나눠 보여드리지 않습니다. 배송비만 별도
          줄로 분리하는데, 한국 관세 기준을 계산할 때 국제 배송비가 제외되기 때문입니다.
        </P>
        <DocNote>
          판매가에 한국 관세와 부가세는 포함되어 있지 않습니다. 미화 150달러를 넘는 주문은 통관할 때 수취인이
          납부하시게 되고, 얼마가 나올지는 결제 전에 예상 금액으로 보여드립니다.
        </DocNote>
      </DocSection>

      <RelatedDocs
        links={[
          { label: '검수와 정품', href: '/guide/inspection' },
          { label: '관세 안내', href: '/guide/customs' },
          { label: '배송 안내', href: '/policy/shipping' },
          { label: '이용약관', href: '/policy/terms' },
        ]}
      />
    </DocShell>
  );
}
