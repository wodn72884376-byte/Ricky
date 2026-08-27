'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Container } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { getLines, getLinesOnServer, remove, setQty, subscribe } from '@/lib/cart-store';
import { computeTotals, type CheckoutLine } from '@/lib/checkout';
import { findProduct, weightGOf } from '@/lib/catalog';
import { formatKrw } from '@/lib/money';

/**
 * 장바구니 (docs/wireframes/04-cart.md).
 *
 * 저장소에는 옵션과 수량만 있고 **가격은 여기서 카탈로그를 다시 읽어 계산한다** (IA §5-6).
 * 합산과세 안내가 이 화면의 핵심이다 — 같은 날 도착분은 합산 과세된다.
 */
export function CartView() {
  const stored = useSyncExternalStore(subscribe, getLines, getLinesOnServer);

  const lines: CheckoutLine[] = stored.flatMap((line) => {
    const p = findProduct(line.id);
    if (!p) return []; // 카탈로그에서 사라진 항목은 조용히 제외한다
    const v = p.variants[0]!;
    return [{
      id: p.slug, slug: p.slug, brand: p.brand, name: `${p.name} ${v.colorKo}`,
      imageUrl: v.cardImage, imageAlt: `${p.name} ${v.colorKo}`,
      size: line.size, qty: line.qty,
      unitPriceKrw: p.priceKrw, category: p.category,
      // 원산지 미확인이면 CKFTA를 적용하지 않는다 (§3.3)
      originCountry: p.originCountry ?? '',
      weightG: weightGOf(p),
      purchasable: true,
    }];
  });

  const totals = computeTotals(lines);

  if (lines.length === 0) {
    return (
      <Container as="section" className="py-16">
        <h1 className="text-headline font-bold">장바구니</h1>
        <EmptyState
          message="장바구니가 비어있어요."
          action={<ButtonLink href="/" chevron>상품 둘러보기</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container as="section" className="py-12 lg:py-16">
      <h1 className="text-headline font-bold">장바구니</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <ul className="border-t border-outline">
          {lines.map((line) => (
            <li key={`${line.id}-${line.size}`} className="flex gap-4 border-b border-outline py-6">
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
                  <span className="text-meta text-sale">지금은 주문할 수 없어요</span>
                )}

                <div className="mt-3 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-meta text-muted-text">
                    수량
                    <select
                      value={line.qty}
                      onChange={(e) => setQty(line.id, line.size, Number(e.target.value))}
                      className="h-11 rounded-ghost border border-outline-strong bg-paper px-2 text-util text-ink"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(line.id, line.size)}
                    className="min-h-11 text-meta text-muted-text underline underline-offset-4 hover:text-ink"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div data-numeric className="shrink-0 text-product font-bold text-ink">
                {formatKrw(line.unitPriceKrw * line.qty)}
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-[260px] lg:self-start">
          <div className="border border-outline p-6">
            <h2 className="text-editorial font-bold">결제 예정 금액</h2>

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
                ? '관세·부가세 면제 예상이에요.'
                : `관세·부가세 약 ${formatKrw(totals.customs.totalTaxKrw)} 예상 (통관 시 수취인 납부)`}
            </p>

            {/* 합산과세 — 같은 날 도착분은 합쳐서 과세된다 */}
            {totals.customs.dutyFree ? (
              <p className="mt-3 text-meta text-muted-text">
                {formatKrw(totals.headroomKrw)}까지 더 담아도 면세 예상이에요. 다만 같은 날 도착하는
                다른 주문이 있으면 합산해서 과세돼요.
              </p>
            ) : (
              <p className="mt-3 text-meta text-muted-text">
                미화 150달러를 넘어 과세 대상이에요. 같은 날 도착하는 다른 주문이 있으면 합산돼요.
              </p>
            )}

            <div className="mt-6">
              <ButtonLink
                href="/checkout"
                variant="inverted"
                size="lg"
                className={totals.hasBlocked ? 'pointer-events-none opacity-40' : 'w-full'}
              >
                주문하기
              </ButtonLink>
            </div>
            {totals.hasBlocked && (
              <p className="mt-3 text-meta text-sale">
                주문할 수 없는 상품이 있어요. 삭제하고 다시 시도해 주세요.
              </p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
