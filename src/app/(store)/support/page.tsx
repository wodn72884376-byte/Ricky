import { DocDefs, DocNote, DocSection, DocShell, P, RelatedDocs } from '@/components/store/prose-page';
import { getSessionUser } from '@/lib/supabase/auth';
import { InquiryForm } from './inquiry-form';
import { MyInquiries } from './my-inquiries';
import { SupportFaq } from './faq';

export const metadata = {
  title: '고객센터',
  description: '자주 묻는 질문과 1:1 문의. 캘거리에서 운영합니다.',
};

/**
 * FAQ 는 공개다. **1:1 문의만 회원 전용**이다 (2026-08-29) —
 * 답변을 어디로 보낼지와 이전 문의를 어디에 쌓을지가 계정 없이는 정해지지 않는다.
 *
 * 로그인 벽을 페이지 전체에 세우지 않는 이유: 문의의 대부분은 FAQ 에 답이 있고,
 * 그걸 보려고 로그인을 요구하면 답을 찾아온 사람을 돌려보내는 셈이다.
 */
export default async function SupportPage() {
  const user = await getSessionUser();

  return (
    <DocShell
      eyebrow="HELP"
      title="고객센터"
      lede="캘거리에서 한 사람이 운영합니다. 캐나다와 한국의 시차 때문에 답변이 다음 날 아침에 도착할 수 있습니다."
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
          캐나다 공휴일이 한국과 달라서, 한국이 평일이어도 상담과 출고가 없는 날이 있습니다.
        </DocNote>
      </DocSection>

      <DocSection id="faq" title="자주 묻는 질문">
        <P>먼저 여기를 확인해 주십시오. 대부분의 문의가 아래에 있습니다.</P>
        <SupportFaq />
      </DocSection>

      <DocSection id="inquiry" title="1:1 문의">
        <P>
          위에서 답을 찾지 못하셨으면 여기에 남겨 주십시오. 주문과 관련된 문의라면 주문번호를 함께 적어 주시면 확인이
          빠릅니다.
        </P>
        {/*
          지난 문의를 폼보다 먼저 둔다. 답변이 이미 와 있는데 새 문의를 또 남기는 일을
          줄이는 것이 이 자리의 목적이다 — 로그인한 사람에게만, 있을 때만 보인다.
        */}
        {user && <MyInquiries />}
        <InquiryForm signedIn={user !== null} defaultEmail={user?.email ?? ''} />
      </DocSection>

      <RelatedDocs
        links={[
          { label: '주문 내역', href: '/account/orders' },
          { label: '배송 안내', href: '/policy/shipping' },
          { label: '교환·반품 안내', href: '/policy/returns' },
          { label: '관세 안내', href: '/guide/customs' },
        ]}
      />
    </DocShell>
  );
}
