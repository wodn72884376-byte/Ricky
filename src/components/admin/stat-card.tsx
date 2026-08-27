import Link from 'next/link';
import { ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

/**
 * 대시보드 수치 카드.
 *
 * 레퍼런스는 색 아이콘 칩 + 초록 증감 텍스트 + 그림자를 쓴다. 전부 안 쓴다 —
 * 이 시스템에는 시맨틱 색이 없고 지면은 평평하다 (§2, §6).
 *
 * 증감은 색이 아니라 **부호와 문장**으로 말한다. 나쁜 수치는 `#e8005d`만 허용한다(§14).
 */
export function StatCard({
  label,
  value,
  unit,
  note,
  alert = false,
  href,
}: {
  label: string;
  value: string;
  unit?: string;
  /** 비교 문장. `지난주 대비 +12%` — 색 없이 문장으로 */
  note?: string;
  /** 운영자가 지금 손대야 하는 수치 */
  alert?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-meta text-muted-text">{label}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span data-numeric className={cn('text-headline font-bold', alert ? 'text-sale' : 'text-ink')}>
          {value}
        </span>
        {unit && <span className="text-body text-muted-text">{unit}</span>}
      </div>
      {note && <div className="mt-2 text-meta text-muted-text">{note}</div>}
    </>
  );

  const shell = 'relative flex flex-col border border-outline p-5';

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <div className={cn(shell, 'group')}>
      {body}
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-util font-bold text-ink after:absolute after:inset-0 after:content-[''] group-hover:underline"
      >
        보기
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
