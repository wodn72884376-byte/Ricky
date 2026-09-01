import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InvertedChip } from '@/components/ui/states';
import { formatElapsed, formatKoDateTime } from '@/lib/date';
import { maskPccc } from '@/lib/customs';
import { hasSupabaseEnv } from '@/lib/env';
import { formatKrw } from '@/lib/money';
import { ORDER_STATUS_KO, isOrderInFlight } from '@/lib/orders';
import { createClient } from '@/lib/supabase/server';
import { StatusControl, TrackingControl } from './order-controls';

export const dynamic = 'force-dynamic';

/**
 * 주문 상세 · 처리.
 *
 * **`select('*')` 를 쓰지 않는다.** `orders` · `order_items` · `shipments` 는 컬럼 단위
 * grant라 원가·환율 컬럼이 `authenticated` 에 없다 — `*` 는 그 컬럼까지 요구해서
 * 통째로 permission denied 가 난다 (20260830000011).
 *
 * 마진을 여기 두지 않는다. 그건 `/admin/reports` 의 일이고, 그 화면은 service_role 로
 * 읽어야 한다 (CLAUDE.md 규칙 1 · 위 마이그레이션 주석).
 */

export async function generateMetadata({ params }: PageProps<'/admin/orders/[id]'>) {
  const { id } = await params;
  return { title: `주문 ${id.slice(0, 8)}` };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminOrderPage({ params }: PageProps<'/admin/orders/[id]'>) {
  const { id } = await params;
  if (!hasSupabaseEnv() || !UUID.test(id)) notFound();

  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
    .select('id, order_no, placed_at, paid_at, status, receiver_name, receiver_phone, postcode, address1, address2, pccc, contact_email, subtotal_krw, shipping_krw, discount_krw, total_krw, duty_free_expected')
    .eq('id', id)
    .maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: shipments }] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, product_name_snapshot, option_snapshot, qty, unit_price_krw, origin_snapshot')
      .eq('order_id', id)
      .order('created_at'),
    supabase
      .from('shipments')
      .select('id, carrier, tracking_no, customs_state, shipped_at, delivered_at')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const shipment = shipments?.[0] ?? null;

  return (
    <>
      <Link href="/admin/orders" className="text-meta text-muted-text underline underline-offset-4">
        주문 목록
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 data-numeric className="text-headline font-bold text-ink">{order.order_no}</h1>
            {isOrderInFlight(order.status) ? (
              <InvertedChip>{ORDER_STATUS_KO[order.status]}</InvertedChip>
            ) : (
              <span className="text-meta text-muted-text">{ORDER_STATUS_KO[order.status]}</span>
            )}
          </div>
          <p className="mt-2 text-meta text-muted-text">
            {formatKoDateTime(order.placed_at)} 접수 · {formatElapsed(order.placed_at)}
            {order.paid_at && ` · ${formatKoDateTime(order.paid_at)} 결제`}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-editorial font-bold text-ink">주문 상품</h2>
        <ul className="mt-4 border-t border-outline">
          {(items ?? []).map((it) => (
            <li key={it.id} className="flex items-start gap-4 border-b border-outline py-4">
              <div className="min-w-0 flex-1">
                <p className="text-product text-ink">{it.product_name_snapshot}</p>
                <p className="mt-1 text-meta text-muted-text">
                  {it.option_snapshot && `${it.option_snapshot} · `}수량 {it.qty}
                  {/* 원산지는 CKFTA 판정 근거다. 비어 있으면 비어 있다고 쓴다 (CLAUDE.md 규칙 5) */}
                  {it.origin_snapshot ? ` · 원산지 ${it.origin_snapshot}` : ' · 원산지 미확인'}
                </p>
              </div>
              <span data-numeric className="shrink-0 text-product font-bold text-ink">
                {formatKrw(it.unit_price_krw * it.qty)}
              </span>
            </li>
          ))}
          {(items ?? []).length === 0 && (
            <li className="border-b border-outline py-4 text-body text-muted-text">품목이 없어요.</li>
          )}
        </ul>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section>
          <h2 className="text-editorial font-bold text-ink">받는 분</h2>
          <dl className="mt-4 flex flex-col gap-3 text-util">
            <Row term="이름">{order.receiver_name}</Row>
            <Row term="연락처"><span data-numeric>{order.receiver_phone}</span></Row>
            <Row term="주소">
              ({order.postcode}) {order.address1}
              {order.address2 && ` ${order.address2}`}
            </Row>
            <Row term="알림 메일">{order.contact_email ?? <span className="text-muted-text">없음</span>}</Row>
            <Row term="통관부호">
              {/*
                기본은 마스킹이다 (CLAUDE.md 규칙 4). 다만 운영자는 통관 신고에 원문이
                필요하므로 펼쳐서 볼 수 있게 둔다 — 표에 늘 띄워 두지는 않는다.
              */}
              <details>
                <summary data-numeric className="cursor-pointer list-none text-ink">
                  {maskPccc(order.pccc)}
                  <span className="ml-2 text-meta text-muted-text">전체 보기</span>
                </summary>
                <span data-numeric className="mt-1 block text-ink">{order.pccc}</span>
              </details>
            </Row>
          </dl>
        </section>

        <section>
          <h2 className="text-editorial font-bold text-ink">금액</h2>
          <dl className="mt-4 flex flex-col gap-3 text-util">
            <Amount term="상품 금액" value={order.subtotal_krw} />
            <Amount term="국제 배송비" value={order.shipping_krw} />
            {order.discount_krw > 0 && <Amount term="할인" value={-order.discount_krw} />}
            <div className="mt-2 flex justify-between border-t border-outline pt-4">
              <dt className="font-bold text-ink">결제 금액</dt>
              <dd data-numeric className="text-editorial font-bold text-ink">{formatKrw(order.total_krw)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-meta text-muted-text">
            {order.duty_free_expected === true
              ? '목록통관 면세 예상 건이에요.'
              : '관세·부가세는 통관 시 수취인이 납부해요(DDU).'}
          </p>
        </section>
      </div>

      <section className="mt-12 border-t border-outline pt-8">
        <h2 className="text-editorial font-bold text-ink">처리</h2>
        <StatusControl orderId={order.id} current={order.status} />
      </section>

      <section className="mt-10">
        <h2 className="text-editorial font-bold text-ink">배송</h2>
        <TrackingControl
          orderId={order.id}
          carrier={shipment?.carrier ?? null}
          trackingNo={shipment?.tracking_no ?? null}
        />
        {shipment?.shipped_at && (
          <p className="mt-3 text-meta text-muted-text">
            {formatKoDateTime(shipment.shipped_at)} 출고
            {shipment.delivered_at && ` · ${formatKoDateTime(shipment.delivered_at)} 배송 완료`}
          </p>
        )}
      </section>
    </>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-muted-text">{term}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}

function Amount({ term, value }: { term: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-text">{term}</dt>
      <dd data-numeric className="text-ink">{formatKrw(value)}</dd>
    </div>
  );
}
