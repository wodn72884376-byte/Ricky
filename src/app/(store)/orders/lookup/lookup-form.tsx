'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

/**
 * 비회원 주문조회.
 *
 * **열거 공격 방어가 이 화면의 디자인을 규정한다** (docs/IA.md §5-2):
 *   1. 실패 사유를 구분하지 않는다 — `주문번호 없음`과 `연락처 불일치`가 같은 문구다.
 *      구분하면 주문번호의 존재 여부가 새고, 그것만으로도 정보다.
 *   2. 최소 응답 시간을 강제한다 — 빨리 실패하면 타이밍으로 존재 여부를 알 수 있다.
 *   3. rate limit은 서버가 `order_lookup_attempts` 기준으로 건다.
 *
 * TODO(server): 지금은 형식 검증만 한다. 실제 조회는 security definer RPC로 옮긴다.
 */

const MIN_RESPONSE_MS = 400;

export function LookupForm() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'notfound'>('idle');
  const [errors, setErrors] = useState<{ orderNo?: string; contact?: string }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const orderNo = String(form.get('orderNo') ?? '').trim().toUpperCase();
    const contact = String(form.get('contact') ?? '').trim();

    const next: typeof errors = {};
    if (!/^R\d{6}-[0-9A-HJKMNP-TV-Z]{6}$/.test(orderNo)) {
      next.orderNo = '주문번호 형식이 올바르지 않아요. R로 시작하는 형식이에요.';
    }
    if (!contact) next.contact = '주문할 때 입력한 이메일이나 연락처를 입력해 주세요.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('checking');
    const started = Date.now();

    // TODO(server): 여기서 RPC 조회. 지금은 항상 못 찾은 것으로 둔다.
    const found = false;

    // 성공이든 실패든 같은 시간을 쓴다 — 응답 속도로 존재 여부가 새지 않게
    const elapsed = Date.now() - started;
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
    }

    setStatus(found ? 'idle' : 'notfound');
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-10 flex flex-col gap-6">
        <Field
          label="주문번호"
          name="orderNo"
          required
          placeholder="R260826-7F3K9Q"
          hint="주문 확인 메일에 적혀 있어요."
          error={errors.orderNo}
        />
        <Field
          label="이메일 또는 연락처"
          name="contact"
          required
          placeholder="you@example.com"
          error={errors.contact}
        />
        <Button type="submit" variant="inverted" size="lg" disabled={status === 'checking'}>
          {status === 'checking' ? '확인 중' : '주문 조회'}
        </Button>
      </form>

      {status === 'notfound' && (
        // 사유를 구분하지 않는다. 이 문구 하나가 모든 실패를 덮는다.
        <p role="alert" className="mt-6 text-body text-error">
          주문을 찾지 못했어요. 주문번호와 연락처를 다시 확인해 주세요.
        </p>
      )}
    </>
  );
}
