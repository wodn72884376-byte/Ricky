import { Container, NarrowShell } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';

export const metadata = { title: '주문 완료 — RICKY' };

/**
 * 주문 완료 (DESIGN.md §14 Success).
 *
 * 초록 체크마크를 쓰지 않는다. 주문번호와 다음 할 일만 담백하게 놓는다.
 * 주문번호를 외우게 만들지 않는다 — 바로 주문 상세로 갈 수 있게 한다.
 *
 * TODO(data): 실제 주문을 조회해 항목·금액·PCCC 마스킹 표시를 채운다.
 *             PCCC는 `maskPccc`로만 표시한다 (PROJECT.md §3.4).
 */
export default async function CompletePage({ params }: PageProps<'/checkout/complete/[orderNo]'>) {
  const { orderNo } = await params;

  return (
    <Container as="section" className="py-20">
      <NarrowShell width="prose">
        <p className="text-body text-muted-text">주문이 접수됐어요.</p>
        <h1 data-numeric className="mt-3 text-headline font-bold">{orderNo}</h1>

        <p className="mt-6 text-body text-ink">
          주문 확인 메일을 보냈어요. 캘거리에서 매입과 검수를 마치면 출고 알림을 다시 보내드려요.
          주 3회 출고하고, 출고 후 한국 자택까지 영업일 기준 4~10일 걸려요.
        </p>

        <div className="mt-8 border border-outline p-5">
          <h2 className="text-util font-bold text-ink">주문번호를 적어두지 않으셔도 돼요</h2>
          <p className="mt-2 text-meta text-muted-text">
            주문 확인 메일에 조회 링크가 들어 있어요. 메일을 못 받으셨으면 주문조회에서
            주문번호와 연락처로 확인하실 수 있어요.
          </p>
        </div>

        <p className="mt-8 text-meta text-muted-text">
          관세·부가세는 결제 금액에 포함되어 있지 않아요. 통관할 때 받는 분이 납부하세요.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={`/orders/${orderNo}`} chevron>주문 상세 보기</ButtonLink>
          <ButtonLink href="/">계속 둘러보기</ButtonLink>
        </div>
      </NarrowShell>
    </Container>
  );
}
