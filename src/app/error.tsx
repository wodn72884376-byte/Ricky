'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/layout/container';

/**
 * 서버 장애 전용 화면 (DESIGN.md §14 Error — 화면 차단).
 *
 * 흰 화면, 한 줄, 고스트 CTA. 스택 트레이스를 화면에 뿌리지 않는다 —
 * 고객에게 의미가 없고, 개인통관고유부호 같은 값이 메시지에 섞여 나올 수 있다.
 * `digest`만 보여준다: 문의할 때 서버 로그를 찾을 수 있는 유일한 실마리다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(observability): 에러 리포터를 붙이면 여기서 보낸다.
    // 개인통관고유부호는 원문을 남기지 않는다 (CLAUDE.md 규칙 4).
    console.error(error);
  }, [error]);

  return (
    <Container as="main" className="flex min-h-[70vh] flex-col items-start justify-center gap-6 py-24">
      <div className="flex flex-col gap-3">
        <p className="text-meta font-bold tracking-wide text-muted-text">ERROR</p>
        <h1 className="text-editorial font-bold text-ink">화면을 불러오지 못했습니다</h1>
        <p className="max-w-[var(--measure-prose)] text-body text-muted-text">
          잠시 후 다시 시도해 주십시오. 계속 같은 화면이 나오면 고객센터로 알려 주십시오.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" size="lg" onClick={reset}>
          다시 시도하기
        </Button>
        <ButtonLink href="/support#inquiry" variant="ghost" size="lg" chevron>
          문의하기
        </ButtonLink>
      </div>

      {error.digest && (
        <p data-numeric className="text-meta text-muted-text">
          오류 번호 {error.digest}
        </p>
      )}
    </Container>
  );
}
