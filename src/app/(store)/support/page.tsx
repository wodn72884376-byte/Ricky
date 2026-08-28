import { DocDefs, DocNote, DocSection, DocShell, P, RelatedDocs } from '@/components/store/prose-page';
import { InquiryForm } from './inquiry-form';
import { SupportFaq } from './faq';

export const metadata = {
  title: '고객센터 — RICKY',
  description: '자주 묻는 질문과 1:1 문의. 캘거리에서 운영해요.',
};

export default function SupportPage() {
  return (
    <DocShell
      eyebrow="HELP"
      title="고객센터"
      lede="캘거리에서 한 사람이 운영해요. 캐나다와 한국의 시차 때문에 답변이 다음 날 아침에 도착할 수 있어요."
    >
      <DocSection id="hours" title="운영 안내">
        <DocDefs
          items={[
            { term: '상담 시간', desc: '평일 10:00 – 15:00 (한국 시간)' },
            { term: '휴무', desc: '주말과 캐나다·한국 공휴일' },
            { term: '답변', desc: '접수 후 1영업일 이내' },
            { term: '출고', desc: '주 3회 — 캘거리 출고 후 영업일 기준 7~14일' },
          ]}
        />
        <DocNote>
          캐나다 공휴일이 한국과 달라서, 한국이 평일이어도 상담과 출고가 없는 날이 있어요.
        </DocNote>
      </DocSection>

      <DocSection id="faq" title="자주 묻는 질문">
        <P>먼저 여기를 확인해 주세요. 대부분의 문의가 아래에 있어요.</P>
        <SupportFaq />
      </DocSection>

      <DocSection id="inquiry" title="1:1 문의">
        <P>
          위에서 답을 찾지 못하셨으면 여기에 남겨 주세요. 주문과 관련된 문의라면 주문번호를 함께 적어 주시면 확인이
          빨라요.
        </P>
        <InquiryForm />
      </DocSection>

      <RelatedDocs
        links={[
          { label: '주문 조회', href: '/orders/lookup' },
          { label: '배송 안내', href: '/policy/shipping' },
          { label: '교환·반품 안내', href: '/policy/returns' },
          { label: '관세 안내', href: '/guide/customs' },
        ]}
      />
    </DocShell>
  );
}
