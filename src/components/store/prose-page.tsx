import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container, NarrowShell } from '@/components/layout/container';
import { cn } from '@/lib/utils/cn';

/**
 * 문서 페이지의 공통 지면 (가이드 · 정책 · 고객센터).
 *
 * 이 화면들은 상품 지면과 달리 **읽히는 것이 목적**이므로 640px 읽기 폭을 지킨다
 * (DESIGN.md §5 — 폭을 제한하는 유일한 경우). 사진이 없으니 위계는 타이포그래피가 전부다.
 *
 * 틴트 박스·경고 아이콘·색 배지를 쓰지 않는다. 강조는 여백과 웨이트로만 한다 (§6·§7).
 */

export function DocShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  /** 대문자 라틴 라벨 — 잡지 목차의 레지스터 (§3) */
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <Container as="section" className="py-20 lg:py-28">
      <NarrowShell>
        <p className="text-meta font-bold tracking-wide text-muted-text">{eyebrow}</p>
        <h1 className="mt-3 text-headline font-bold text-ink">{title}</h1>
        {lede && <p className="mt-5 text-body text-ink">{lede}</p>}
        {children}
      </NarrowShell>
    </Container>
  );
}

/** 문서의 절. `id`를 주면 교차 링크의 앵커가 된다 (docs/IA.md §3). */
export function DocSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-16 scroll-mt-32">
      <h2 className="text-editorial font-bold text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** 본문 한 문단. */
export function P({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <p className={cn('text-body', muted ? 'text-muted-text' : 'text-ink')}>{children}</p>;
}

/**
 * 목록. 불릿을 그리지 않고 들여쓰기와 행간으로만 구분한다 —
 * 이 지면에서 점 하나도 장식이다.
 */
export function DocList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-body text-ink">
          <span aria-hidden="true" className="mt-[0.7em] size-1 shrink-0 rounded-full bg-ink" />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 표. 좁은 화면에서 열을 숨기지 않고 가로 스크롤로 감싼다 (§8).
 * 숫자 열은 `tabular-nums`로 자리를 맞춘다 (§3).
 */
export function DocTable({
  head,
  rows,
  numericFrom = 1,
}: {
  head: string[];
  rows: ReactNode[][];
  /** 이 인덱스 이상인 열을 숫자 열로 취급한다 */
  numericFrom?: number;
}) {
  return (
    <div className="-mx-[var(--gutter-mobile)] overflow-x-auto px-[var(--gutter-mobile)] md:mx-0 md:px-0">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink">
            {head.map((cell, i) => (
              <th
                key={cell}
                scope="col"
                className={cn(
                  'py-3 text-meta font-bold text-ink',
                  i >= numericFrom && 'text-right tabular-nums',
                )}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-outline">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={cn(
                    'py-3 text-product text-ink',
                    i >= numericFrom && 'text-right tabular-nums',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 정의 목록 — `용어 → 뜻`, `항목 → 값`.
 * 사업자 정보·처리 목적처럼 짝으로 읽히는 고지에 쓴다.
 */
export function DocDefs({ items }: { items: { term: string; desc: ReactNode }[] }) {
  return (
    <dl className="flex flex-col">
      {items.map((item) => (
        <div key={item.term} className="flex flex-col gap-1 border-b border-outline py-4 md:flex-row md:gap-6">
          <dt className="text-product font-bold text-ink md:w-40 md:shrink-0">{item.term}</dt>
          <dd className="flex-1 text-product text-ink">{item.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 각주 위계의 주석. 색도 아이콘도 쓰지 않는다 (§7 — 관세는 각주이지 경고가 아니다). */
export function DocNote({ children }: { children: ReactNode }) {
  return <p className="text-meta leading-relaxed text-muted-text">{children}</p>;
}

/** 조문 형식 본문 — 약관·방침 전용. `~합니다` 종결이 허용되는 유일한 지면이다 (§10). */
export function Clause({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="text-product font-bold text-ink">
        {no} ({title})
      </h3>
      <div className="mt-3 flex flex-col gap-2 text-product leading-relaxed text-ink">{children}</div>
    </section>
  );
}

/** 문서 하단의 옆걸음 링크. 가이드끼리 서로를 알고 있어야 한다 (docs/IA.md §3). */
export function RelatedDocs({ links }: { links: { label: string; href: string }[] }) {
  return (
    <nav aria-label="관련 안내" className="mt-20 border-t border-outline pt-8">
      <h2 className="text-label font-bold text-ink">MORE</h2>
      <ul className="mt-2 flex flex-col">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-11 items-center text-product text-ink no-underline hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
