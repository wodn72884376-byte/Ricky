import {
  DocList,
  DocNote,
  DocSection,
  DocShell,
  DocTable,
  P,
  RelatedDocs,
} from '@/components/store/prose-page';

export const metadata = {
  title: '사이즈 가이드 — RICKY',
  description: '북미 사이즈 표기와 한국 사이즈의 차이, 브랜드별로 다른 핏을 정리했어요.',
};

export default function SizingGuidePage() {
  return (
    <DocShell
      eyebrow="SIZING"
      title="사이즈 가이드"
      lede="한국에 들어오지 않은 사이즈를 찾아 오시는 분이 많아요. 그만큼 사이즈를 잘못 고르면 반송 비용이 커요. 고르실 때 참고하실 내용을 정리했어요."
    >
      <DocSection id="how" title="숫자보다 실측을 보세요">
        <P>
          같은 &lsquo;M&rsquo;이어도 브랜드마다, 같은 브랜드 안에서도 라인마다 치수가 달라요. 그래서 알파벳이나 숫자로
          고르는 것보다 <strong className="font-bold">실측 치수를 비교하는 쪽이 훨씬 정확해요.</strong>
        </P>
        <DocList
          items={[
            '지금 잘 맞는 옷을 바닥에 펴고 가슴너비, 총장, 어깨너비, 소매길이를 재 보세요.',
            '상품 페이지의 실측 표와 비교하시면 됩니다. 재는 방식이 같아야 비교가 돼요.',
            '아우터는 안에 무엇을 입을지에 따라 달라져요. 미드레이어를 겹쳐 입으실 거면 한 치수 여유를 보세요.',
          ]}
        />
        <DocNote>
          상품 페이지의 실측은 해당 사이즈 한 벌을 잰 값이에요. 같은 사이즈여도 1~2cm 오차가 있을 수 있어요.
        </DocNote>
      </DocSection>

      <DocSection id="apparel" title="북미 표기와 한국 표기">
        <P>대략적인 대응이에요. 정확한 선택은 실측으로 확인해 주세요.</P>
        <P>
          <strong className="font-bold">남성 상의</strong>
        </P>
        <DocTable
          head={['북미', '한국', '가슴둘레 기준']}
          numericFrom={99}
          rows={[
            ['XS', '90', '약 88 – 92cm'],
            ['S', '95', '약 93 – 97cm'],
            ['M', '100', '약 98 – 102cm'],
            ['L', '105', '약 103 – 107cm'],
            ['XL', '110', '약 108 – 112cm'],
            ['XXL', '115', '약 113 – 117cm'],
          ]}
        />
        <P>
          <strong className="font-bold">여성 상의</strong>
        </P>
        <DocTable
          head={['북미', '한국', '가슴둘레 기준']}
          numericFrom={99}
          rows={[
            ['XS (0–2)', '44', '약 80 – 84cm'],
            ['S (4–6)', '55', '약 85 – 89cm'],
            ['M (8–10)', '66', '약 90 – 94cm'],
            ['L (12)', '77', '약 95 – 99cm'],
            ['XL (14)', '88', '약 100 – 104cm'],
          ]}
        />
        <P>
          <strong className="font-bold">하의 (허리 인치 → 한국 호칭)</strong>
        </P>
        <DocTable
          head={['북미 (inch)', '한국 (cm)']}
          numericFrom={99}
          rows={[
            ['28', '71'],
            ['30', '76'],
            ['32', '81'],
            ['34', '86'],
            ['36', '91'],
          ]}
        />
      </DocSection>

      <DocSection id="brands" title="브랜드별로 다른 점">
        <P>
          <strong className="font-bold">Arc&rsquo;teryx</strong> — 등산·클라이밍을 전제로 설계돼서 어깨와 팔은 여유가
          있고 허리는 들어가요. 같은 사이즈라도 라인마다 핏 이름이 달라요. Trim은 몸에 붙고, Regular는 미드레이어를
          한 겹 넣을 여유가 있고, Relaxed는 두꺼운 옷 위에 입는 걸 전제로 해요. 평소 입던 사이즈에서 시작하시되, 안에
          겹쳐 입으실 거면 핏 이름을 먼저 확인해 주세요.
        </P>
        <P>
          <strong className="font-bold">lululemon</strong> — 숫자 사이즈(0, 2, 4 …)를 써요. 하의는 같은 사이즈에도
          기장(inseam) 선택지가 여러 개라 사이즈만 고르시면 안 돼요. 요가·러닝 라인은 압박감이 있는 쪽이고, 라운지
          라인은 여유가 있어요. 원단 신축성이 라인마다 달라서 다른 라인끼리 사이즈를 그대로 옮기지 않는 편이 좋아요.
        </P>
        <P>
          <strong className="font-bold">Coach</strong> — 가방과 지갑은 사이즈 대신 실측 치수(가로 × 세로 × 폭)와
          스트랩 길이를 보세요. 노트북이나 A4가 들어가야 하면 가로 치수를 먼저 확인해 주세요. 의류와 신발은 북미 표기를
          그대로 따라요.
        </P>
      </DocSection>

      <DocSection id="shoes" title="신발">
        <P>
          북미 표기는 남녀가 달라요. 여성 US 8은 남성 US 6.5~7에 해당해요. 상품 페이지에는 mm 값을 함께 적어 두었으니
          발 길이를 재서 비교해 주세요.
        </P>
        <DocNote>
          발볼이 넓으시면 mm 값이 같아도 작게 느껴질 수 있어요. 등산화·트레일화는 내리막에서 발가락이 닿지 않도록
          평소보다 5mm 정도 크게 신으시는 분이 많아요.
        </DocNote>
      </DocSection>

      <DocSection id="exchange" title="사이즈를 잘못 고르셨다면">
        <P>
          수령일로부터 7일 이내에 교환 신청하실 수 있어요. 다만 해외에서 오가는 배송이라 단순 교환에도 왕복 배송비가
          실비로 들어요. 고민되시면 주문 전에 문의해 주세요 — 실측을 다시 재서 알려드릴게요.
        </P>
      </DocSection>

      <RelatedDocs
        links={[
          { label: '교환·반품 안내', href: '/policy/returns' },
          { label: '검수와 정품', href: '/guide/inspection' },
          { label: '고객센터', href: '/support' },
        ]}
      />
    </DocShell>
  );
}
