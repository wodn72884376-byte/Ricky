import {
  DocList,
  DocNote,
  DocSection,
  DocShell,
  P,
  RelatedDocs,
} from '@/components/store/prose-page';

export const metadata = {
  title: '교환·반품 안내 — RICKY',
  description: '수령일로부터 7일 이내에 교환과 반품을 신청하실 수 있어요. 조건과 절차를 정리했어요.',
};

export default function ReturnsPolicyPage() {
  return (
    <DocShell
      eyebrow="RETURNS"
      title="교환·반품 안내"
      lede="해외에서 오는 상품이라 교환과 반품을 아예 받지 않는 곳이 많아요. RICKY는 받아요. 대신 조건과 비용을 먼저 정확히 알려드릴게요."
    >
      <DocSection id="window" title="언제까지 신청할 수 있나요">
        <DocList
          items={[
            <>
              <strong className="font-bold">수령일로부터 7일 이내</strong>에 신청하셔야 해요. 전자상거래법이 정한
              청약철회 기간이에요.
            </>,
            <>
              상품에 하자가 있거나 주문과 다른 물건이 왔다면{' '}
              <strong className="font-bold">사실을 안 날로부터 30일</strong>, 수령일로부터 3개월 이내에 신청하실 수
              있어요.
            </>,
            '신청은 고객센터로 먼저 연락 주세요. 저희가 확인한 뒤 반송 방법을 안내드려요.',
          ]}
        />
        <DocNote>
          연락 없이 먼저 보내시면 어느 주문인지 확인이 어려워서 처리가 늦어져요. 반송 안내를 받으신 뒤에 보내 주세요.
        </DocNote>
      </DocSection>

      <DocSection id="cost" title="비용은 누가 부담하나요">
        <P>기준은 하나예요. 원인이 어디에 있는지에 따라 나뉘어요.</P>
        <DocList
          items={[
            <>
              <strong className="font-bold">RICKY 부담</strong> — 상품 하자, 오배송, 설명과 다른 상품, 배송 중 파손·분실.
              왕복 배송비를 저희가 부담하고, 교환품은 다음 출고 편에 바로 보내드려요.
            </>,
            <>
              <strong className="font-bold">고객 부담</strong> — 단순 변심, 사이즈 교환, 주소나 개인통관고유부호 오기로
              인한 반송. 반송 비용과 재발송 비용이 실비로 발생해요.
            </>,
          ]}
        />
        <P>
          단순 변심으로 반품하실 때 드는 비용은 처음 보낼 때 든 국제 배송비와 돌아올 때 드는 반송비예요. 상품과 무게에
          따라 다르니 신청하실 때 정확한 금액을 알려드릴게요. 결제하신 배송비는 돌려드리지 않아요.
        </P>
        <DocNote>
          교환은 같은 상품의 다른 사이즈·색상으로만 가능해요. 다른 상품으로 바꾸시려면 반품하신 뒤 새로 주문해 주세요.
        </DocNote>
      </DocSection>

      <DocSection id="denied" title="교환·반품이 어려운 경우">
        <DocList
          items={[
            '착용하셨거나 사용 흔적이 있는 경우',
            '택, 라벨, 보증서, 부속품이 없거나 훼손된 경우',
            '향수·담배·반려동물 냄새가 배거나 오염된 경우',
            '고객님의 사용이나 보관 부주의로 상품 가치가 떨어진 경우',
            '수령일로부터 7일이 지난 경우',
            '주문하실 때 개별 주문 제작으로 안내드린 상품',
          ]}
        />
        <P>
          모니터 설정에 따른 색상 차이, 도난 방지 태그 자국, 브랜드가 의도한 워싱·마감 편차는 하자로 보지 않아요.
          다만 판단이 애매하면 검수 사진을 함께 보고 상의해요. 저희가 일방적으로 정하지 않아요.
        </P>
        <DocNote>
          상품 브랜드 박스는 상품의 일부예요. 박스가 없거나 테이프를 붙여 훼손되면 반품이 어려워요. 겉포장 박스를 하나
          더 써서 보내 주세요.
        </DocNote>
      </DocSection>

      <DocSection id="refund" title="환불은 언제 되나요">
        <DocList
          items={[
            '반송하신 상품을 확인한 날로부터 3영업일 이내에 환불해요.',
            '카드로 결제하셨다면 승인 취소로 처리돼요. 카드사 사정에 따라 명세서 반영까지 3~5영업일이 더 걸릴 수 있어요.',
            '결제일과 취소일이 결제 마감을 사이에 두고 있으면 한 번 청구된 뒤 다음 달에 환급될 수 있어요.',
            '부분 반품이면 남은 금액과 배송비를 다시 계산해서 알려드려요.',
          ]}
        />
        <P>
          통관할 때 이미 관세와 부가세를 납부하셨다면, 반품 시 관세청에 환급을 신청하실 수 있어요. 저희가 수출 신고
          자료를 준비해서 보내드려요. 이 환급은 관세청이 처리하는 절차라 RICKY가 직접 돌려드리는 금액은 아니에요.
        </P>
      </DocSection>

      <DocSection id="cancel" title="주문 취소">
        <P>
          결제 후 현지 매입이 시작되기 전까지는 전액 취소하실 수 있어요. 매입이 끝난 뒤에는 취소 대신 반품 절차로
          진행돼요.
        </P>
        <P>
          반대로 현지 매장에서 재고가 없어져 매입하지 못하면 저희가 주문을 취소하고 전액 환불해 드려요. 이 경우
          고객님께 드는 비용은 없어요.
        </P>
      </DocSection>

      <RelatedDocs
        links={[
          { label: '배송 안내', href: '/policy/shipping' },
          { label: '관세 안내', href: '/guide/customs' },
          { label: '고객센터', href: '/support' },
        ]}
      />
    </DocShell>
  );
}
