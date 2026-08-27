import Link from 'next/link';
import { Container, NarrowShell } from '@/components/layout/container';
import { LookupForm } from './lookup-form';

export const metadata = { title: '주문 조회 — RICKY' };

export default function LookupPage() {
  return (
    <Container as="section" className="py-20">
      <NarrowShell width="form">
        <h1 className="text-headline font-bold">주문 조회</h1>
        <p className="mt-3 text-body text-muted-text">
          회원가입 없이 주문하셨다면 주문번호와 연락처로 확인하실 수 있어요.
        </p>

        <LookupForm />

        <p className="mt-10 text-meta text-muted-text">
          회원으로 주문하셨다면{' '}
          <Link href="/account/orders" className="text-ink underline underline-offset-4">
            주문 내역
          </Link>
          에서 바로 보실 수 있어요.
        </p>
      </NarrowShell>
    </Container>
  );
}
