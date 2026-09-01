import Link from 'next/link';
import { Container, NarrowShell } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { formatKoDate, formatKoDateTime } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';
import {
  INQUIRY_STATUS_KO,
  canReplyToInquiry,
  inquiryCategoryKo,
  normalizeTicketNo,
} from '@/lib/support/inquiry';
import type { InquiryStatus } from '@/lib/supabase/types';
import { FollowUpForm } from './follow-up-form';

export const dynamic = 'force-dynamic';

/**
 * 문의 단건 조회 (docs/IA.md §3 · docs/wireframes/07-support.md §5-5).
 *
 * **회원 전용, 본인 문의만.** 소유자 확인은 RLS `inquiries_self_read` 가 한다 —
 * 여기서 `customer_id` 를 다시 비교하지 않는다. 정책이 한 곳(마이그레이션)에만 있어야
 * 관리자 화면·목록과 어긋나지 않는다.
 *
 * 주소의 `[id]` 는 uuid 가 아니라 **접수번호**(`Q260831-4B7M5`)다. 접수 확인 화면과
 * 메일이 고객에게 건네는 이름이 이것뿐이고, uuid 를 쓰면 그 번호로 갈 수 있는 곳이 없다.
 * 번호를 찍어 봐도 남의 문의는 RLS 가 막는다.
 *
 * 없음과 볼 수 없음을 **같은 화면으로 처리한다** — 구분하면 접수번호의 존재 여부가
 * 새고, 그것만으로도 정보다 (`/orders/[orderNo]` 와 같은 규칙).
 */

export async function generateMetadata({ params }: PageProps<'/support/inquiry/[id]'>) {
  const { id } = await params;
  const ticketNo = normalizeTicketNo(id);
  return {
    title: ticketNo ? `문의 ${ticketNo}` : '문의',
    // 본인만 보는 화면이다. 검색 결과에 접수번호가 남을 이유가 없다.
    robots: { index: false, follow: false },
  };
}

type Thread = {
  id: string;
  ticketNo: string;
  status: InquiryStatus;
  category: string;
  subject: string;
  body: string;
  createdAt: string;
  contactEmail: string;
  orderNo: string | null;
  replies: { id: string; author: 'customer' | 'operator'; body: string; createdAt: string }[];
};

async function loadThread(ticketNo: string): Promise<Thread | null> {
  try {
    const supabase = await createClient();

    const { data: inquiry } = await supabase
      .from('inquiries')
      // 셀렉트 문자열은 한 줄이어야 한다. 이어 붙이면 타입 추론이 리터럴을 잃고 결과가 무너진다.
      .select('id, ticket_no, status, category, subject, body, created_at, contact_email, order_id')
      .eq('ticket_no', ticketNo)
      .maybeSingle();
    if (!inquiry) return null;

    /*
      답변 이력과 연결된 주문은 따로 읽는다. PostgREST 임베드를 쓰려면 손으로 유지하는
      `supabase/types.ts` 의 `Relationships` 가 채워져 있어야 하는데 비어 있어서
      반환 타입이 조용히 무너진다. `npm run db:types` 로 갈아탄 뒤 합칠 것.

      둘 다 RLS 가 본인 것만 통과시킨다(`inquiry_replies_self_read` · `orders_self_read`).
    */
    const [{ data: replies }, { data: order }] = await Promise.all([
      supabase
        .from('inquiry_replies')
        .select('id, author, body, created_at')
        .eq('inquiry_id', inquiry.id)
        .order('created_at'),
      inquiry.order_id
        ? supabase.from('orders').select('order_no').eq('id', inquiry.order_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      id: inquiry.id,
      ticketNo: inquiry.ticket_no,
      status: inquiry.status,
      category: inquiryCategoryKo(inquiry.category),
      subject: inquiry.subject,
      body: inquiry.body,
      createdAt: inquiry.created_at,
      contactEmail: inquiry.contact_email,
      orderNo: order?.order_no ?? null,
      replies: (replies ?? []).map((r) => ({
        id: r.id,
        author: r.author,
        body: r.body,
        createdAt: r.created_at,
      })),
    };
  } catch {
    // Supabase 미설정·네트워크 장애. 여기서 던지면 화면이 통째로 500이 된다.
    return null;
  }
}

export default async function InquiryThreadPage({ params }: PageProps<'/support/inquiry/[id]'>) {
  const { id } = await params;
  const ticketNo = normalizeTicketNo(id);
  const thread = ticketNo ? await loadThread(ticketNo) : null;

  if (!thread) return <Unavailable />;

  const canReply = canReplyToInquiry(thread.status);

  return (
    <Container as="section" className="py-20 lg:py-28">
      <NarrowShell>
        <Link
          href="/support#inquiry"
          className="text-meta text-muted-text underline underline-offset-4"
        >
          고객센터
        </Link>

        <p data-numeric className="mt-6 text-meta font-bold text-ink">{thread.ticketNo}</p>
        <h1 className="mt-2 text-headline font-bold text-ink">{thread.subject}</h1>
        <p className="mt-3 text-meta text-muted-text">
          {formatKoDate(thread.createdAt)} 접수 · {thread.category} ·{' '}
          {INQUIRY_STATUS_KO[thread.status]}
        </p>
        <p className="mt-2 text-meta leading-relaxed text-muted-text">
          <StatusNote status={thread.status} answered={thread.replies.length > 0} />
        </p>

        <dl className="mt-10 flex flex-col border-t border-outline">
          <Row term="답변 받을 곳">{thread.contactEmail}</Row>
          <Row term="연결된 주문">
            {thread.orderNo ? (
              <Link
                href={`/orders/${thread.orderNo}`}
                data-numeric
                className="text-ink underline underline-offset-4"
              >
                {thread.orderNo}
              </Link>
            ) : (
              <span className="text-muted-text">없음</span>
            )}
          </Row>
        </dl>

        <section className="mt-16">
          <h2 className="text-editorial font-bold text-ink">주고받은 이야기</h2>

          <ul className="mt-6 border-t border-outline">
            {/* 처음 남긴 글도 대화의 한 줄이다. 위에 따로 떼어 두면 순서가 끊긴다 */}
            <Message who="나" at={thread.createdAt} body={thread.body} />
            {thread.replies.map((r) => (
              <Message
                key={r.id}
                who={r.author === 'operator' ? 'RICKY' : '나'}
                at={r.createdAt}
                body={r.body}
              />
            ))}
          </ul>

          {canReply ? (
            /*
              보낸 뒤 상자를 비우는 일은 이 `key` 가 한다. 서버가 새 줄을 실어 다시 그리면
              답변 수가 바뀌고 폼이 통째로 새로 마운트되며 빈칸이 된다.
            */
            <FollowUpForm key={thread.replies.length} ticketNo={thread.ticketNo} />
          ) : (
            <div className="mt-8">
              <p className="text-body text-ink">이 문의는 종료되었습니다.</p>
              <p className="mt-2 text-meta text-muted-text">
                이어서 궁금한 점이 있으시면 새로 남겨 주십시오. 이 접수번호를 함께 적어 주시면
                지난 이야기를 보고 답해 드리겠습니다.
              </p>
              <div className="mt-6">
                <ButtonLink href="/support#inquiry" chevron>새 문의 남기기</ButtonLink>
              </div>
            </div>
          )}
        </section>

        <p className="mt-16 border-t border-outline pt-6 text-meta leading-relaxed text-muted-text">
          개인통관고유부호나 카드번호는 적지 말아 주십시오. 필요하면 저희가 안전한 경로로 따로
          여쭙겠습니다.
        </p>
      </NarrowShell>
    </Container>
  );
}

/**
 * 지금 어떤 상태인지 한 문장으로 쓴다. 상태 단어(`접수`·`답변함`)만으로는
 * 다음에 무슨 일이 일어나는지 알 수 없다 (DESIGN.md §12-8).
 */
function StatusNote({ status, answered }: { status: InquiryStatus; answered: boolean }) {
  if (status === 'closed') return <>종료된 문의입니다. 아래에서 지난 이야기를 다시 볼 수 있습니다.</>;
  if (status === 'answered') {
    return answered ? (
      <>답변을 보내드렸습니다. 아래에서 확인해 주십시오.</>
    ) : (
      // 운영자가 메일로만 답한 경우다. 여기 없는 것을 있다고 쓰지 않는다.
      <>답변을 보내드렸습니다. 위에 적힌 이메일을 확인해 주십시오.</>
    );
  }
  return <>평일 10시~15시에 순서대로 답합니다. 접수 후 1영업일 안에 답변을 보내드립니다.</>;
}

/** 대화 한 줄. 말풍선을 그리지 않는다 — 이 지면은 편집 목록이다 (DESIGN.md §6). */
function Message({ who, at, body }: { who: string; at: string; body: string }) {
  return (
    <li className="border-b border-outline py-6">
      <p className="text-meta text-muted-text">
        <span className="font-bold text-ink">{who}</span> · {formatKoDateTime(at)}
      </p>
      {/* 줄바꿈을 살린다 — 문단으로 쓴 글을 한 덩어리로 뭉개지 않는다 */}
      <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-ink">{body}</p>
    </li>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline py-4 md:flex-row md:gap-6">
      <dt className="text-product text-muted-text md:w-32 md:shrink-0">{term}</dt>
      <dd className="min-w-0 break-words text-product text-ink">{children}</dd>
    </div>
  );
}

/** 없음과 볼 수 없음을 같은 화면으로 처리한다 — 구분하면 접수번호의 존재가 샌다. */
function Unavailable() {
  return (
    <Container as="section" className="py-20">
      <NarrowShell>
        <h1 className="text-headline font-bold">문의를 볼 수 없습니다</h1>
        <p className="mt-4 text-body text-ink">
          접수번호가 맞지 않거나, 이 문의를 볼 권한이 없습니다. 문의를 남기신 계정으로
          로그인하셨는지 확인해 주십시오.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/support#inquiry" chevron>고객센터</ButtonLink>
          <ButtonLink href="/account/orders">주문 내역</ButtonLink>
        </div>
        <p className="mt-8 text-meta text-muted-text">
          다른 계정으로 남기셨다면{' '}
          <Link href="/login" className="text-ink underline underline-offset-4">로그인</Link>
          {' '}후 다시 시도해 주십시오.
        </p>
      </NarrowShell>
    </Container>
  );
}
