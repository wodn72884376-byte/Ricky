import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { formatKrw } from '@/lib/money';
import { maskPccc } from '@/lib/customs';
import type { OrderStatus } from '@/lib/supabase/types';

/**
 * 주문 상세 (docs/IA.md §1).
 *
 * 표현 전용이다 — 조회와 접근 제어는 호출하는 쪽이 한다.
 * 그래야 실제 라우트와 개발 미리보기가 같은 화면을 공유한다.
 *
 * 규칙:
 *   - **개인통관고유부호는 마스킹해서만 보여준다** (PROJECT.md §3.4). 원문을 화면에 두지 않는다.
 *   - **가격을 분해하지 않는다** — 상품가와 배송비만. 원가·수수료·마진은 어떤 고객 화면에도 없다 (§3.1).
 *   - 관세는 결제 금액에 포함되지 않았음을 명시한다(DDU).
 */

export type OrderDetailItem = {
  slug: string;
  brand: string;
  name: string;
  option: string | null;
  qty: number;
  unitPriceKrw: number;
  imageUrl: string;
  imageAlt: string;
};

export type OrderDetail = {
  orderNo: string;
  status: OrderStatus;
  placedAt: string;
  receiverName: string;
  receiverPhone: string;
  postcode: string;
  address1: string;
  address2: string | null;
  /** 원문. 이 컴포넌트가 마스킹해서 렌더한다 */
  pccc: string;
  contactEmail: string | null;
  items: OrderDetailItem[];
  subtotalKrw: number;
  shippingKrw: number;
  totalKrw: number;
  estimatedTaxKrw: number;
  dutyFree: boolean;
  trackingNo: string | null;
  carrier: string | null;
};

/** 주문 상태 흐름. 취소·환불은 별도 분기라 타임라인에 넣지 않는다. */
const FLOW: { key: OrderStatus; label: string; hint: string }[] = [
  { key: 'paid', label: '결제 완료', hint: '주문이 접수됐어요.' },
  { key: 'sourcing', label: '현지 매입', hint: '캘거리에서 상품을 사고 있어요.' },
  { key: 'at_forwarder', label: '검수·포장', hint: '실물을 촬영하고 포장해요.' },
  { key: 'shipped', label: '출고', hint: '캘거리에서 인천으로 가고 있어요.' },
  { key: 'in_customs', label: '통관', hint: '수입 통관 중이에요.' },
  { key: 'delivered', label: '배송 완료', hint: '' },
];

const TERMINAL: Partial<Record<OrderStatus, string>> = {
  cancelled: '취소된 주문이에요.',
  refunded: '환불된 주문이에요.',
  pending_payment: '결제가 완료되지 않았어요.',
};

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const currentIndex = FLOW.findIndex((s) => s.key === order.status);
  const terminal = TERMINAL[order.status];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-body text-muted-text">주문번호</p>
          <h1 data-numeric className="mt-1 text-headline font-bold">{order.orderNo}</h1>
          <p className="mt-2 text-meta text-muted-text">{order.placedAt} 주문</p>
        </div>
        <ButtonLink href="/support" size="md" chevron>
          이 주문 문의하기
        </ButtonLink>
      </div>

      {terminal ? (
        <p className="mt-10 border border-outline p-5 text-body text-ink">{terminal}</p>
      ) : (
        <section className="mt-12">
          <h2 className="text-editorial font-bold">진행 상황</h2>
          {/* 색이 아니라 반전과 웨이트로 현재 단계를 표시한다 (§14) */}
          <ol className="mt-5 flex flex-col border border-outline">
            {FLOW.map((step, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <li
                  key={step.key}
                  className="flex items-start gap-4 border-b border-outline px-5 py-4 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className={
                      current
                        ? 'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-inverted bg-ink text-meta font-bold text-paper'
                        : 'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-inverted border border-outline text-meta text-muted-text'
                    }
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={current ? 'text-util font-bold text-ink' : done ? 'text-util text-ink' : 'text-util text-muted-text'}>
                      {step.label}
                      {current && <span className="ml-2 text-meta font-normal text-muted-text">진행 중</span>}
                    </p>
                    {current && step.hint && <p className="mt-1 text-meta text-muted-text">{step.hint}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {order.trackingNo ? (
            <p className="mt-4 text-util text-ink">
              {order.carrier} <span data-numeric className="font-bold">{order.trackingNo}</span>
            </p>
          ) : (
            <p className="mt-4 text-meta text-muted-text">출고되면 송장번호를 알려드려요.</p>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-editorial font-bold">주문 상품</h2>
        <ul className="mt-5 border-t border-outline">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.option}`} className="flex gap-4 border-b border-outline py-5">
              <Link href={`/products/${item.slug}`} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-skeleton">
                <Image src={item.imageUrl} alt={item.imageAlt} fill sizes="80px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-meta text-muted-text">{item.brand}</span>
                <Link href={`/products/${item.slug}`} className="text-product text-ink hover:underline">
                  {item.name}
                </Link>
                <span className="text-meta text-muted-text">
                  {item.option && `${item.option} · `}수량 {item.qty}
                </span>
              </div>
              <span data-numeric className="shrink-0 text-product font-bold text-ink">
                {formatKrw(item.unitPriceKrw * item.qty)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section>
          <h2 className="text-editorial font-bold">받는 분</h2>
          <dl className="mt-5 flex flex-col gap-3 text-util">
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-text">이름</dt>
              <dd className="text-ink">{order.receiverName}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-text">연락처</dt>
              <dd data-numeric className="text-ink">{order.receiverPhone}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-text">주소</dt>
              <dd className="text-ink">
                ({order.postcode}) {order.address1}
                {order.address2 && ` ${order.address2}`}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-text">통관부호</dt>
              {/* 원문을 렌더하지 않는다 */}
              <dd data-numeric className="text-ink">{maskPccc(order.pccc)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-editorial font-bold">결제 금액</h2>
          <dl className="mt-5 flex flex-col gap-3 text-util">
            <div className="flex justify-between">
              <dt className="text-muted-text">상품 금액</dt>
              <dd data-numeric className="text-ink">{formatKrw(order.subtotalKrw)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-text">국제 배송비</dt>
              <dd data-numeric className="text-ink">{formatKrw(order.shippingKrw)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-outline pt-4">
              <dt className="font-bold text-ink">결제 금액</dt>
              <dd data-numeric className="text-editorial font-bold text-ink">{formatKrw(order.totalKrw)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-meta text-muted-text">
            {order.dutyFree
              ? '관세·부가세 면제 예상이에요.'
              : `관세·부가세 약 ${formatKrw(order.estimatedTaxKrw)}이 통관 시 따로 부과돼요. 결제 금액에는 포함되어 있지 않아요.`}
          </p>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-editorial font-bold">검수 기록</h2>
        <p className="mt-3 max-w-[var(--measure-prose)] text-body text-ink">
          출고 전에 실물 택과 시리얼, 사이즈 라벨, 봉제를 촬영해서 남겨요. 매입 영수증과 인보이스는
          상자에 함께 넣어요.
        </p>
        {/* TODO(data): inspection_photos에서 이 주문의 사진을 읽는다. is_public과 무관하게 주문 소유자는 볼 수 있다 */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {['실물 택과 시리얼', '사이즈 라벨', '봉제 상태', '매입 영수증'].map((label) => (
            <figure key={label}>
              <div className="flex aspect-square items-center justify-center bg-skeleton">
                <span className="text-meta text-muted-text">출고 전 촬영</span>
              </div>
              <figcaption className="mt-2 text-meta text-muted-text">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-outline pt-8">
        <h2 className="text-util font-bold text-ink">교환·반품</h2>
        <p className="mt-2 max-w-[var(--measure-prose)] text-meta text-muted-text">
          해외 배송이어도 교환과 반품이 가능해요. 국제 배송 중 발생한 파손·분실에 대한 1차 책임은
          RICKY가 집니다. 조건과 절차는{' '}
          <Link href="/policy/returns" className="text-ink underline underline-offset-4">교환·반품 정책</Link>
          에서 확인해 주세요.
        </p>
      </section>
    </>
  );
}
