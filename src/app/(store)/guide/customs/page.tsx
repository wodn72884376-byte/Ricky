import { ButtonLink } from '@/components/ui/button';
import {
  DocList,
  DocNote,
  DocSection,
  DocShell,
  DocTable,
  P,
  RelatedDocs,
} from '@/components/store/prose-page';
import { DEFAULT_CUSTOMS_CONFIG } from '@/lib/customs';

export const metadata = {
  title: '관세 안내 — RICKY',
  description:
    '미화 150달러 목록통관, CKFTA 관세 면제, 합산과세, 개인통관고유부호까지 한국 통관에 필요한 내용을 정리했어요.',
};

const { dutyFreeThresholdUsd, vatRate, dutyRates } = DEFAULT_CUSTOMS_CONFIG;

const CATEGORY_LABEL: Record<string, string> = {
  outerwear: '아우터',
  top: '상의',
  bottom: '하의',
  bag: '가방',
  shoes: '신발',
  accessory: '악세서리',
};

export default function CustomsGuidePage() {
  return (
    <DocShell
      eyebrow="CUSTOMS"
      title="관세 안내"
      lede="RICKY의 가격에는 한국 관세와 부가세가 포함되어 있지 않아요. 대신 결제 전에 예상 세액을 계산해서 보여드려요. 아래는 그 숫자가 어떻게 나오는지에 대한 설명이에요."
    >
      <DocSection id="threshold" title={`미화 ${dutyFreeThresholdUsd}달러 목록통관`}>
        <P>
          개인이 직접 쓰려고 들여오는 물건은 물품가가 미화 {dutyFreeThresholdUsd}달러 이하일 때 관세와
          부가세가 모두 면제돼요. 이걸 목록통관이라고 불러요. 캐나다에서 오는 상품의 기준은 150달러이고,
          미국발 200달러 기준과는 다르니 주의해 주세요.
        </P>
        <P>
          이 기준을 판정할 때 <strong className="font-bold">한국행 국제 배송비는 포함되지 않아요.</strong> 상품
          금액만으로 따져요. 그래서 RICKY는 배송비를 상품가에 녹이지 않고 항상 별도 줄로 분리해서 보여드려요.
        </P>
        <DocNote>
          기준을 판정하는 환율은 관세청이 매주 고시하는 과세환율이에요. 결제 시점에 보시는 예상 세액은 그 시점의
          고시환율로 계산한 값이고, 실제 통관은 물건이 도착한 주의 환율로 다시 계산돼요.
        </DocNote>
      </DocSection>

      <DocSection id="taxed" title="150달러를 넘으면 어떻게 되나요">
        <P>
          초과한 금액에만 세금이 붙는 게 아니라, <strong className="font-bold">전체 금액에 붙어요.</strong>{' '}
          151달러짜리 물건은 1달러가 아니라 151달러 전부가 과세 대상이 돼요. 계산 순서는 이래요.
        </P>
        <DocList
          items={[
            <>
              <strong className="font-bold">과세가격</strong> = 상품 금액 + 국제 배송비
            </>,
            <>
              <strong className="font-bold">관세</strong> = 과세가격 × 품목별 관세율
            </>,
            <>
              <strong className="font-bold">부가세</strong> = (과세가격 + 관세) × {vatRate * 100}%
            </>,
          ]}
        />
        <P>품목별 관세율은 아래와 같아요.</P>
        <DocTable
          head={['품목', '관세율']}
          rows={Object.entries(dutyRates).map(([key, rate]) => [
            CATEGORY_LABEL[key] ?? key,
            `${(rate * 100).toFixed(0)}%`,
          ])}
        />
        <DocNote>
          관세는 통관 시점에 세관이 확정해요. 화면의 숫자는 언제나 예상치이고, RICKY가 대신 납부하거나 청구하지
          않아요. 통관 시 배송사가 수취인에게 안내해요.
        </DocNote>
      </DocSection>

      <DocSection id="ckfta" title="캐나다산은 관세가 0%예요">
        <P>
          한국과 캐나다 사이에는 자유무역협정(CKFTA)이 있어서, 원산지가 캐나다인 물건은 관세율이 0%가 돼요.
          다만 <strong className="font-bold">부가세 {vatRate * 100}%는 그대로 부과돼요.</strong> 완전히 면세가 되는
          게 아니에요.
        </P>
        <P>
          원산지는 브랜드 국적이 아니라 실물 라벨 기준이에요. 아크테릭스는 캐나다 브랜드지만 제품 대부분은 베트남,
          중국, 방글라데시 등에서 생산돼요. 그래서 RICKY는 상품마다 실물 라벨을 확인해 원산지를 적고, 캐나다산일
          때만 CKFTA를 적용해 계산해요.
        </P>
      </DocSection>

      <DocSection id="combined" title="같은 날 도착하면 합쳐서 계산돼요">
        <P>
          같은 날 같은 수취인에게 도착한 물건은 합산해서 과세돼요. 각각 100달러짜리 두 건이 같은 날 도착하면
          200달러로 보고 세금이 붙어요. 따로 주문하셨더라도 마찬가지예요.
        </P>
        <P>
          장바구니 금액이 기준을 넘거나 최근 주문과 도착일이 겹칠 가능성이 있으면 결제 화면에서 미리 알려드려요.
          출고일을 나눠 드릴 수도 있으니 필요하시면 문의해 주세요.
        </P>
      </DocSection>

      <DocSection id="pccc" title="개인통관고유부호">
        <P>
          관세청이 개인정보 유출을 막기 위해 만든 번호예요. 해외에서 물건을 들여올 때 주민등록번호 대신 쓰고,
          <strong className="font-bold"> 직구에는 반드시 필요해요.</strong> RICKY에서도 주문할 때 꼭 입력하셔야
          해요.
        </P>
        <DocList
          items={[
            <>
              형식은 <strong className="font-bold">P로 시작하는 13자리</strong>예요. 예: P1234****9012
            </>,
            <>
              <strong className="font-bold">수취인 본인 명의</strong>의 번호여야 통관돼요. 주문자와 받는 분이 다르면
              받는 분의 번호를 넣어 주세요.
            </>,
            '발급하실 때는 본인 명의 휴대폰이나 공동인증서가 필요해요.',
            '이름·연락처가 발급 정보와 다르면 통관이 보류될 수 있어요.',
          ]}
        />
        <div className="pt-2">
          <ButtonLink
            href="https://unipass.customs.go.kr/csp/persIndex.do"
            target="_blank"
            rel="noreferrer noopener"
            variant="ghost"
            size="lg"
            chevron
          >
            관세청 유니패스에서 발급·조회하기
          </ButtonLink>
        </div>
        <DocNote>
          입력하신 번호는 통관 신고 목적으로만 쓰고, 화면에는 앞뒤 일부만 남기고 가려서 보여드려요. 고객센터 상담
          기록이나 오류 로그에도 원문을 남기지 않아요.
        </DocNote>
      </DocSection>

      <RelatedDocs
        links={[
          { label: '배송 안내 — 무게는 어떻게 계산되나요', href: '/policy/shipping' },
          { label: '검수와 정품', href: '/guide/inspection' },
          { label: '교환·반품 안내', href: '/policy/returns' },
        ]}
      />
    </DocShell>
  );
}
