'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Container } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { NaverPayButton } from '@/components/store/naver-pay-button';
import { EmptyState } from '@/components/ui/states';
import { getLines, getLinesOnServer, remove, setQty, subscribe } from '@/lib/cart-store';
import { computeTotals, type CheckoutLine } from '@/lib/checkout';
import { resolveCartLines } from '@/lib/catalog';
import { formatKrw } from '@/lib/money';

/**
 * 장바구니 (docs/wireframes/04-cart.md).
 *
 * 저장소에는 옵션과 수량만 있고 **가격은 여기서 카탈로그를 다시 읽어 계산한다** (IA §5-6).
 * 합산과세 안내가 이 화면의 핵심이다 — 같은 날 도착분은 합산 과세된다.
 *
 * **결제는 여기서 일어나지 않는다.** 스마트스토어가 상품 하나씩 처리하므로
 * 이 화면은 "담아 두고 총액을 확인하는 곳"이고, 구매 버튼은 줄마다 하나씩 있다
 * (2026-08-28). 합계 옆에 `주문하기` 하나를 두면 한 번에 결제되는 것처럼 읽혀서 그렇게 두지 않는다.
 */
export function CartView() {
  const stored = useSyncExternalStore(subscribe, getLines, getLinesOnServer);

  const lines: CheckoutLine[] = resolveCartLines(stored);

  const totals = computeTotals(lines);

  if (lines.length === 0) {
    return (
      <Container as="section" className="py-16">
        <h1 className="text-headline font-bold">장바구니</h1>
        <EmptyState
          message="장바구니가 비어있습니다."
          action={<ButtonLink href="/" chevron>상품 둘러보기</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container as="section" className="py-12 lg:py-16">
      <h1 className="text-headline font-bold">장바구니</h1>

      {/*
        목록 컬럼에 폭 상한을 둔다. 1fr로 두면 넓은 화면에서 한 줄이 2000px가 되어
        상품명과 가격 사이가 텅 빈다 (2026-08-28 운영자 지적).
        §5의 "폭 캡 없음"은 사진이 무게를 지는 지면의 규칙이고, 장바구니는 목록이다 —
        읽는 것이므로 폭을 제한한다. 남는 공간은 `justify-start`가 오른쪽으로 보낸다.
      */}
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,760px)_380px] lg:justify-start lg:gap-12">
        <ul className="border-t border-outline">
          {lines.map((line) => (
            <li key={`${line.id}-${line.size}-${line.color ?? ''}`} className="flex gap-4 border-b border-outline py-6">
              <Link href={`/products/${line.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-skeleton">
                <Image src={line.imageUrl} alt={line.imageAlt} fill sizes="96px" className="object-cover" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-meta text-muted-text">{line.brand}</span>
                <Link href={`/products/${line.slug}`} className="text-product text-ink hover:underline">
                  {line.name}
                </Link>
                {line.size && <span className="text-meta text-muted-text">사이즈 {line.size}</span>}
                {!line.purchasable && (
                  <span className="text-meta text-sale">지금은 주문할 수 없습니다</span>
                )}

                <div className="mt-3 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-meta text-muted-text">
                    수량
                    <select
                      value={line.qty}
                      onChange={(e) => setQty(line.id, line.size, line.color ?? null, Number(e.target.value))}
                      className="h-11 rounded-ghost border border-outline-strong bg-paper px-2 text-util text-ink"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(line.id, line.size, line.color ?? null)}
                    className="min-h-11 text-meta text-muted-text underline underline-offset-4 hover:text-ink"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span data-numeric className="text-product font-bold text-ink">
                  {formatKrw(line.unitPriceKrw * line.qty)}
                </span>
                <span data-numeric className="text-meta text-muted-text">
                  배송비 {formatKrw(line.shippingKrw * line.qty)}
                </span>
                {/* 구매는 줄 단위다. 합포장이 없으므로 상품마다 따로 결제한다 */}
                {line.smartstoreUrl ? (
                  <NaverPayButton href={line.smartstoreUrl} className="mt-1 !h-11 !w-auto px-4" />
                ) : (
                  <span className="mt-1 text-meta text-muted-text">아직 판매 준비 중입니다</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-[260px] lg:self-start">
          <div className="border border-outline p-6">
            <h2 className="text-editorial font-bold">담은 상품 합계</h2>

            <dl className="mt-5 flex flex-col gap-3 text-util">
              <div className="flex justify-between">
                <dt className="text-muted-text">상품 금액</dt>
                <dd data-numeric className="text-ink">{formatKrw(totals.subtotalKrw)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-text">국제 배송비</dt>
                <dd data-numeric className="text-ink">{formatKrw(totals.shippingKrw)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-outline pt-4">
                <dt className="font-bold text-ink">합계</dt>
                <dd data-numeric className="text-editorial font-bold text-ink">{formatKrw(totals.totalKrw)}</dd>
              </div>
            </dl>

            {/* 관세는 각주 위계로. 경고색·아이콘·틴트 배경을 쓰지 않는다 (§12-9) */}
            <p className="mt-4 text-meta text-muted-text">
              {totals.customs.dutyFree
                ? '관세·부가세 면제 예상입니다.'
                : `관세·부가세 약 ${formatKrw(totals.customs.totalTaxKrw)} 예상 (통관 시 수취인 납부)`}
            </p>

            {/* 합산과세 — 같은 날 도착분은 합쳐서 과세된다 */}
            {totals.customs.dutyFree ? (
              <p className="mt-3 text-meta text-muted-text">
                {formatKrw(totals.headroomKrw)}까지 더 담아도 면세 예상입니다. 다만 같은 날 도착하는
                다른 주문이 있으면 합산해서 과세됩니다.
              </p>
            ) : (
              <p className="mt-3 text-meta text-muted-text">
                미화 150달러를 넘어 과세 대상입니다. 같은 날 도착하는 다른 주문이 있으면 합산됩니다.
              </p>
            )}

            {/*
              합계 옆에 결제 버튼을 두지 않는다. 상품마다 따로 결제하는 구조에서
              `주문하기` 하나를 두면 한 번에 결제되는 것처럼 읽힌다 — 그건 거짓말이다.
            */}
            <p className="mt-6 border-t border-outline pt-4 text-meta leading-relaxed text-muted-text">
              결제는 상품마다 따로 합니다. 합포장을 하지 않아서 배송도 상품별로 나갑니다.
              왼쪽 목록에서 상품마다 <span className="text-ink">N Pay로 구매하기</span>를 눌러 주십시오.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
