import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ui/button';
import { InvertedChip } from '@/components/ui/states';
import { formatKoDateTime } from '@/lib/date';
import { hasSupabaseEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { INQUIRY_STATUS_KO, inquiryCategoryKo } from '@/lib/support/inquiry';
import { setInquiryStatus } from './actions';
import { ReplyForm } from './reply-form';

export const dynamic = 'force-dynamic';

/**
 * 문의 상세 · 답변.
 *
 * 운영자가 여기서 하는 일은 셋이다 — 읽고, 답을 쓰고, 처리했다고 표시한다.
 * **여기 쓴 답변은 고객의 문의 상세 화면(`/support/inquiry/[ticket_no]`)에 그대로 보인다**
 * (20260831000016). 다만 메일 알림은 아직 자동으로 나가지 않으므로, 급한 건은
 * 연락처를 눌러 메일로도 함께 보낼 수 있게 둔다.
 */

export async function generateMetadata({ params }: PageProps<'/admin/inquiries/[id]'>) {
  const { id } = await params;
  return { title: `문의 ${id.slice(0, 8)}` };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminInquiryPage({ params }: PageProps<'/admin/inquiries/[id]'>) {
  const { id } = await params;
  if (!hasSupabaseEnv() || !UUID.test(id)) notFound();

  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from('inquiries')
    // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃는다.
    .select('id, ticket_no, created_at, updated_at, category, subject, body, status, contact_email, order_id')
    .eq('id', id)
    .maybeSingle();
  if (!inquiry) notFound();

  /*
    답변 이력과 연결된 주문번호는 따로 읽는다. PostgREST 임베드를 쓰려면 손으로 유지하는
    `types.ts` 의 `Relationships` 가 채워져 있어야 하는데 비어 있어서 반환 타입이 무너진다.
  */
  const [{ data: replies }, { data: order }] = await Promise.all([
    supabase
      .from('inquiry_replies')
      .select('id, author, body, created_at')
      .eq('inquiry_id', id)
      .order('created_at'),
    inquiry.order_id
      ? supabase.from('orders').select('order_no').eq('id', inquiry.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // 메일 앱에서 바로 열리도록 접수번호를 제목에 넣는다 — 회신이 어느 건인지 알아야 한다
  const mailto = `mailto:${inquiry.contact_email}?subject=${encodeURIComponent(
    `[RICKY] ${inquiry.ticket_no} ${inquiry.subject}`,
  )}`;

  return (
    <>
      <Link href="/admin/inquiries" className="text-meta text-muted-text underline underline-offset-4">
        문의 목록
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span data-numeric className="text-meta font-bold text-ink">{inquiry.ticket_no}</span>
            {inquiry.status === 'open' ? (
              <InvertedChip>{INQUIRY_STATUS_KO[inquiry.status]}</InvertedChip>
            ) : (
              <span className="text-meta text-muted-text">{INQUIRY_STATUS_KO[inquiry.status]}</span>
            )}
          </div>
          <h1 className="mt-2 text-headline font-bold text-ink">{inquiry.subject}</h1>
          <p className="mt-2 text-meta text-muted-text">
            {formatKoDateTime(inquiry.created_at)} 접수 · {inquiryCategoryKo(inquiry.category)}
          </p>
        </div>

        {/* 알림 메일은 아직 자동이 아니다. 화면당 하나뿐인 반전 CTA 는 아래 `답변 남기기` 가 갖는다 */}
        <ButtonLink href={mailto} size="md" chevron>메일로 답장</ButtonLink>
      </div>

      <dl className="mt-8 grid gap-x-8 gap-y-3 border-y border-outline py-5 md:grid-cols-2">
        <Row term="연락처">
          <a href={mailto} className="text-ink underline underline-offset-4">{inquiry.contact_email}</a>
        </Row>
        <Row term="연결된 주문">
          {order?.order_no ? (
            <Link href={`/admin/orders?q=${order.order_no}`} data-numeric className="text-ink underline underline-offset-4">
              {order.order_no}
            </Link>
          ) : (
            <span className="text-muted-text">없음</span>
          )}
        </Row>
      </dl>

      <section className="mt-10">
        <h2 className="text-editorial font-bold text-ink">문의 내용</h2>
        {/* 줄바꿈을 살린다 — 고객이 문단으로 쓴 글을 한 덩어리로 뭉개지 않는다 */}
        <p className="mt-4 max-w-[var(--measure-prose)] whitespace-pre-wrap text-body leading-relaxed text-ink">
          {inquiry.body}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-editorial font-bold text-ink">주고받은 기록</h2>

        {(replies ?? []).length === 0 ? (
          <p className="mt-4 text-body text-muted-text">아직 기록된 답변이 없어요.</p>
        ) : (
          <ul className="mt-5 border-t border-outline">
            {(replies ?? []).map((r) => (
              <li key={r.id} className="border-b border-outline py-5">
                <p className="text-meta text-muted-text">
                  {r.author === 'operator' ? '운영자' : '고객'} · {formatKoDateTime(r.created_at)}
                </p>
                <p className="mt-2 max-w-[var(--measure-prose)] whitespace-pre-wrap text-body leading-relaxed text-ink">
                  {r.body}
                </p>
              </li>
            ))}
          </ul>
        )}

        <ReplyForm inquiryId={inquiry.id} />

        <p className="mt-3 max-w-[var(--measure-prose)] text-meta leading-relaxed text-muted-text">
          여기 적은 답변은 고객의 문의 화면에 바로 보여요. 다만 <span className="text-ink">알림 메일은
          아직 자동으로 나가지 않아요</span> — 고객이 그 화면에 다시 들어와야 읽으니, 급한 건은 위
          <span className="text-ink"> 메일로 답장</span>으로도 함께 보내 주세요.
        </p>
      </section>

      <section className="mt-12 border-t border-outline pt-8">
        <h2 className="text-util font-bold text-ink">상태</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {/* 답변 없이 종료하거나 다시 여는 경로. 지금 상태로는 바꿀 수 없게 뺀다 */}
          {(['open', 'answered', 'closed'] as const)
            .filter((s) => s !== inquiry.status)
            .map((s) => (
              <form key={s} action={setInquiryStatus}>
                <input type="hidden" name="id" value={inquiry.id} />
                <input type="hidden" name="status" value={s} />
                <Button type="submit" variant="ghost" size="md">
                  {INQUIRY_STATUS_KO[s]}(으)로 바꾸기
                </Button>
              </form>
            ))}
        </div>
      </section>
    </>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-util text-muted-text">{term}</dt>
      <dd className="min-w-0 text-util text-ink">{children}</dd>
    </div>
  );
}
