'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Disclosure } from '@/components/store/disclosure';

/**
 * 자주 묻는 질문. 카테고리 단위 아코디언이다.
 *
 * 정책의 원본은 각 정책 페이지이고 여기는 요약이다 —
 * 같은 내용을 두 곳에 적으면 반드시 어긋난다. 그래서 각 항목은 원본으로 링크한다.
 */

function A({ children }: { children: ReactNode }) {
  return <p className="text-util leading-relaxed text-ink">{children}</p>;
}

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex min-h-11 items-center text-meta text-muted-text underline underline-offset-4 hover:text-ink"
    >
      {label}
    </Link>
  );
}

const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: '회원가입 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          주문하시려면 로그인이 필요합니다. 구글·네이버·카카오 계정 중 쓰시던 걸 누르면 가입과 로그인이
          한 번에 됩니다.
        </A>
        <A>
          비밀번호는 만들지 않습니다. 저희가 비밀번호를 저장하지 않는다는 뜻이기도 합니다.
        </A>
        <A>
          가입하시면 주문 내역이 남고, 다음 주문부터 배송지와 개인통관고유부호를 다시 입력하지 않으셔도 됩니다.
        </A>
        <More href="/login" label="로그인·가입하기" />
      </div>
    ),
  },
  {
    title: '주문 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>주문은 이런 순서로 진행됩니다.</A>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-util leading-relaxed text-ink">
          <li>로그인 — 구글·네이버·카카오 중 하나</li>
          <li>상품을 고르고 장바구니에 담기</li>
          <li>배송지와 개인통관고유부호 입력</li>
          <li>카드 결제</li>
          <li>주문번호 확인 — 주문 내역에도 남습니다</li>
        </ol>
        <A>
          선매입 상품은 이미 캘거리에 재고가 있습니다. 주문매입 상품은 결제 후에 현지 매장에서 매입합니다. 어느 쪽인지는
          상품 페이지에 적혀 있습니다.
        </A>
        <A>
          현지 재고를 최근에 확인하지 못한 상품은 &lsquo;재고를 확인하고 있습니다&rsquo;로 표시하고 결제를 열지 않습니다.
          재고를 모르는 채로 주문을 받지 않기 위해서입니다.
        </A>
        <More href="/account/orders" label="주문 내역 보기" />
      </div>
    ),
  },
  {
    title: '결제 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          국내외 신용·체크카드로 결제하실 수 있습니다. 결제는 Stripe가 처리하고, RICKY는 카드번호를 저장하지 않습니다.
        </A>
        <A>
          결제 금액은 원화 하나입니다. 상품 금액과 국제 배송비만 나뉘고, 그 밖의 수수료를 따로 붙이지 않습니다. 한국
          관세와 부가세는 이 금액에 들어 있지 않습니다.
        </A>
        <A>
          해외 결제 승인 절차 때문에 카드사에서 확인 연락이 갈 수 있습니다. 승인이 거절되면 카드사에 해외 승인 차단
          여부를 확인해 주십시오.
        </A>
      </div>
    ),
  },
  {
    title: '배송 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          캘거리에서 주 3회 출고합니다. 출고 후 한국 자택까지 영업일 기준 7~14일 걸립니다. 통관 상황과 항공 스케줄에 따라
          늦어질 수 있습니다.
        </A>
        <A>
          배송비는 실무게와 부피무게 중 무거운 값으로 계산합니다. 여러 상품을 함께 주문하시면 합쳐서 한 번만 계산합니다.
        </A>
        <More href="/policy/shipping" label="배송 안내 자세히 보기" />
      </div>
    ),
  },
  {
    title: '관세·통관 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          미화 150달러 이하 주문은 관세와 부가세가 면제됩니다. 넘으면 초과분이 아니라 전체 금액에 세금이 붙고, 통관할 때
          수취인이 납부하시게 됩니다. 얼마가 나올지는 결제 전에 예상 금액으로 보여드립니다.
        </A>
        <A>
          개인통관고유부호는 수취인 본인 명의여야 합니다. 이름과 연락처도 발급 정보와 같아야 통관이 진행됩니다.
        </A>
        <More href="/guide/customs#pccc" label="개인통관고유부호 안내" />
      </div>
    ),
  },
  {
    title: '교환·반품 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          수령일로부터 7일 이내에 신청하실 수 있습니다. 상품 하자나 오배송이면 왕복 배송비를 저희가 부담하고, 단순
          변심이면 반송비가 실비로 발생합니다.
        </A>
        <A>보내시기 전에 먼저 문의해 주십시오. 어느 주문인지 확인하고 반송 방법을 안내드립니다.</A>
        <More href="/policy/returns" label="교환·반품 안내 자세히 보기" />
      </div>
    ),
  },
  {
    title: '환불 안내',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          반송하신 상품을 확인한 날로부터 3영업일 이내에 환불합니다. 카드 결제는 승인 취소로 처리되고, 카드사 사정에
          따라 명세서 반영까지 3~5영업일이 더 걸릴 수 있습니다.
        </A>
        <A>현지 재고가 없어 매입하지 못한 경우에는 저희가 주문을 취소하고 전액 환불해 드립니다.</A>
        <More href="/policy/returns#refund" label="환불 조건 보기" />
      </div>
    ),
  },
  {
    title: '검수와 정품',
    body: (
      <div className="flex flex-col gap-4">
        <A>
          모든 상품은 캐나다 공식 매장에서 매입합니다. 출고 전에 실물 택, 시리얼, 사이즈 라벨, 봉제를 촬영해 남기고,
          매입 영수증과 인보이스를 함께 보내드립니다.
        </A>
        <A>검수 사진은 보정하지 않고 워터마크도 얹지 않습니다. 크롭만 합니다.</A>
        <More href="/guide/inspection" label="검수 방식 보기" />
      </div>
    ),
  },
];

export function SupportFaq() {
  return (
    <div className="mt-6 border-t border-outline">
      {SECTIONS.map((section) => (
        <Disclosure key={section.title} title={section.title}>
          {section.body}
        </Disclosure>
      ))}
    </div>
  );
}
