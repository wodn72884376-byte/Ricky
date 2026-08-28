import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/layout/container';

export const metadata = { title: '없는 주소예요 — RICKY' };

/**
 * 404.
 *
 * DESIGN.md §14 Error(화면 차단)를 그대로 따른다 — 흰 화면, 한 줄, 고스트 CTA 하나.
 * 일러스트도 마스코트도 큰 숫자 `404`도 없다. 없는 주소라는 사실 외에 할 말이 없다.
 *
 * 헤더·푸터가 없다. 이 파일은 스토어 셸(`(store)/layout.tsx`) 바깥에서 렌더되므로
 * 돌아갈 길을 본문이 직접 줘야 한다.
 */
export default function NotFound() {
  return (
    <Container as="main" className="flex min-h-[70vh] flex-col items-start justify-center gap-6 py-24">
      <div className="flex flex-col gap-3">
        <p className="text-meta font-bold tracking-wide text-muted-text">NOT FOUND</p>
        <h1 className="text-editorial font-bold text-ink">없는 주소예요</h1>
        <p className="max-w-[var(--measure-prose)] text-body text-muted-text">
          주소가 바뀌었거나, 판매가 끝난 상품일 수 있어요.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/" variant="ghost" size="lg" chevron>
          홈으로
        </ButtonLink>
        <ButtonLink href="/shop" variant="ghost" size="lg" chevron>
          전체 상품 보기
        </ButtonLink>
      </div>
    </Container>
  );
}
