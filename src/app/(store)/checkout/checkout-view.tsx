'use client';

import { useState, useSyncExternalStore } from 'react';
import { Container } from '@/components/layout/container';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { getLines, getLinesOnServer, subscribe } from '@/lib/cart-store';
import { computeTotals, type CheckoutLine } from '@/lib/checkout';
import { isValidPccc, normalizePccc } from '@/lib/customs';
import { resolveCartLines } from '@/lib/catalog';
import { formatKrw } from '@/lib/money';

/**
 * 체크아웃 (docs/wireframes/05-checkout.md).
 *
 * 회원 전용이다 (2026-08-29). 로그인 확인은 서버(`page.tsx`)에서 끝내고 여기는 폼만 그린다.
 * 연락 수단(이메일)은 계정과 별개로 **주문마다** 받는다 — 소셜 계정이 이메일을 주지 않을 수
 * 있고, 계정 이메일과 알림 받을 곳이 다를 수도 있다 (`orders.contact_email` not null).
 *
 * 개인통관고유부호는 민감정보다. 로그·에러 리포트에 원문을 남기지 않는다 (PROJECT.md §3.4).
 *
 * TODO(payment): Stripe Checkout 연동. KRW는 zero-decimal이므로 amount에 원 단위 정수를
 *                그대로 넘긴다(×100 금지, PROJECT.md §2).
 * TODO(stock): 결제 직전 재고 신선도를 서버에서 재검증한다 (§6.5). 지금은 화면 상태만 본다.
 */

type Errors = Partial<Record<'email' | 'name' | 'phone' | 'postcode' | 'address1' | 'pccc', string>>;

export function CheckoutView({ defaultEmail = '' }: { defaultEmail?: string }) {
  const stored = useSyncExternalStore(subscribe, getLines, getLinesOnServer);
  const [errors, setErrors] = useState<Errors>({});
  const [blocked, setBlocked] = useState(false);

  // 장바구니와 같은 함수를 쓴다. 두 화면이 따로 계산하면 금액이 갈린다.
  const lines: CheckoutLine[] = resolveCartLines(stored);

  const totals = computeTotals(lines);

  if (lines.length === 0) {
    return (
      <Container as="section" className="py-16">
        <h1 className="text-headline font-bold">주문</h1>
        <p className="mt-6 text-body text-muted-text">장바구니가 비어 있습니다.</p>
      </Container>
    );
  }

  function validate(form: FormData): Errors {
    const next: Errors = {};
    const email = String(form.get('email') ?? '').trim();
    const name = String(form.get('name') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const postcode = String(form.get('postcode') ?? '').trim();
    const address1 = String(form.get('address1') ?? '').trim();
    const pccc = normalizePccc(String(form.get('pccc') ?? ''));

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = '이메일 형식이 올바르지 않습니다.';
    if (!name) next.name = '수령인 이름을 입력해 주십시오.';
    if (!/^[0-9-]{9,}$/.test(phone)) next.phone = '연락처를 숫자로 입력해 주십시오.';
    if (!/^\d{5}$/.test(postcode)) next.postcode = '우편번호는 5자리 숫자입니다.';
    if (!address1) next.address1 = '주소를 입력해 주십시오.';
    // 형식 오류 문구에 입력값을 넣지 않는다 — 에러 리포트에 원문이 새면 안 된다
    if (!isValidPccc(pccc)) next.pccc = '개인통관고유부호는 P로 시작하는 13자리입니다.';

    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // 첫 오류 필드로 포커스를 옮긴다 — 스크롤만 하면 어디를 고쳐야 할지 모른다
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }

    /*
      **가짜 주문번호를 만들지 않는다.** 예전에는 여기서 `previewOrderNo()` 로 번호를 지어내고
      장바구니를 비운 뒤 완료 화면으로 보냈다 — 아무것도 접수되지 않았는데 접수된 것처럼 보였고,
      장바구니만 실제로 날아갔다.

      결제는 스마트스토어가 한다(20260828000007). 이 화면으로 주문이 생기는 경로는 지금 없다.
      없으면 없다고 쓴다 (DESIGN.md §12-8).
    */
    setBlocked(true);
  }

  return (
    <Container as="section" className="py-12 lg:py-16">
      <h1 className="text-headline font-bold">주문</h1>
      <p className="mt-2 text-body text-muted-text">배송지와 개인통관고유부호만 확인하면 됩니다.</p>

      {blocked && (
        <div role="alert" className="mt-8 max-w-[var(--measure-prose)] border border-outline p-5">
          <p className="text-product font-bold text-ink">이 화면으로는 주문이 접수되지 않습니다</p>
          <p className="mt-2 text-meta leading-relaxed text-muted-text">
            결제는 상품 페이지의 <span className="text-ink">N Pay로 구매하기</span> 버튼에서
            네이버 스마트스토어로 이어집니다. 장바구니는 그대로 두었으니 담아 두신 상품의
            상세 페이지에서 결제해 주십시오.
          </p>
          <div className="mt-4">
            <ButtonLink href="/cart" size="md" chevron>장바구니로 돌아가기</ButtonLink>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="flex flex-col gap-10">
          <fieldset>
            <legend className="text-editorial font-bold">연락처</legend>
            <p className="mt-2 text-meta text-muted-text">
              주문 확인과 배송 알림을 보낼 곳입니다.
            </p>
            <div className="mt-5">
              <Field label="이메일" name="email" type="email" required autoComplete="email"
                defaultValue={defaultEmail}
                placeholder="you@example.com" error={errors.email} />
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-editorial font-bold">받는 분</legend>
            <div className="mt-5 flex flex-col gap-5">
              <Field label="이름" name="name" required autoComplete="name" error={errors.name} />
              <Field label="연락처" name="phone" type="tel" required autoComplete="tel"
                placeholder="010-1234-5678" error={errors.phone} />
              <Field label="우편번호" name="postcode" required inputMode="numeric"
                autoComplete="postal-code" placeholder="06236" error={errors.postcode} />
              <Field label="주소" name="address1" required autoComplete="street-address" error={errors.address1} />
              <Field label="상세 주소" name="address2" autoComplete="address-line2" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-editorial font-bold">개인통관고유부호</legend>
            <p className="mt-2 max-w-[var(--measure-prose)] text-meta text-muted-text">
              세관 통관 시 검증이 강화되었습니다. <strong className="font-bold">받는 분의 성명 · 연락처 ·
              통관부호 · 주소가 모두 일치</strong>해야 하며, 하나라도 다르면 통관이 지연될 수 있습니다.
            </p>
            <div className="mt-5 max-w-[var(--measure-form)]">
              <Field
                label="개인통관고유부호"
                name="pccc"
                required
                placeholder="P123456789012"
                hint="P로 시작하는 13자리입니다. 관세청 홈페이지에서 발급받을 수 있습니다."
                error={errors.pccc}
              />
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-[260px] lg:self-start">
          <div className="border border-outline p-6">
            <h2 className="text-editorial font-bold">주문 내역</h2>

            <ul className="mt-4 flex flex-col gap-3 border-b border-outline pb-4">
              {lines.map((line) => (
                <li key={`${line.id}-${line.size}`} className="flex justify-between gap-3 text-meta">
                  <span className="min-w-0 text-ink">
                    {line.name}
                    {line.size && <span className="text-muted-text"> · {line.size}</span>}
                    <span className="text-muted-text"> × {line.qty}</span>
                  </span>
                  <span data-numeric className="shrink-0 text-ink">
                    {formatKrw(line.unitPriceKrw * line.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 flex flex-col gap-3 text-util">
              <div className="flex justify-between">
                <dt className="text-muted-text">상품 금액</dt>
                <dd data-numeric className="text-ink">{formatKrw(totals.subtotalKrw)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-text">국제 배송비</dt>
                <dd data-numeric className="text-ink">{formatKrw(totals.shippingKrw)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-outline pt-4">
                <dt className="font-bold text-ink">결제 금액</dt>
                <dd data-numeric className="text-editorial font-bold text-ink">{formatKrw(totals.totalKrw)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-meta text-muted-text">
              {totals.customs.dutyFree
                ? '관세·부가세 면제 예상입니다.'
                : `관세·부가세 약 ${formatKrw(totals.customs.totalTaxKrw)}이 통관 시 따로 부과됩니다. 결제 금액에는 포함되어 있지 않습니다.`}
            </p>

            {/* 이 버튼으로 결제가 일어나지 않는다 — 누르면 위에 어디서 사는지 안내가 뜬다 */}
            <Button type="submit" variant="inverted" size="lg" className="mt-6 w-full">
              {formatKrw(totals.totalKrw)} 결제하기
            </Button>

            <p className="mt-4 text-meta text-muted-text">
              주문하면 이용약관과 개인정보처리방침에 동의하는 것으로 봅니다.
            </p>
          </div>
        </aside>
      </form>
    </Container>
  );
}
