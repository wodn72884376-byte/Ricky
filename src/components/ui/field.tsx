'use client';

import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 박스형 입력 (DESIGN.md §4 Inputs & Forms).
 *
 * 보더는 `#949494`(outline-strong)다. 입력은 보더가 사라지면 컨트롤인지 알 수 없으므로
 * 버튼용 `#c4c4c4`(1.74:1)를 쓰지 않는다 — WCAG SC 1.4.11이 3:1을 요구한다.
 *
 * 에러는 색만으로 전달하지 않는다. 항상 문장이 함께 온다 (PRODUCT.md 접근성).
 */

type FieldProps = {
  label: string;
  /** 형식 안내 등. 에러가 아닌 상시 도움말 */
  hint?: ReactNode;
  /** 한 문장. `개인통관고유부호는 P로 시작하는 13자리예요` (§14 Error 인라인) */
  error?: string;
  required?: boolean;
  className?: string;
} & Omit<ComponentProps<'input'>, 'className' | 'required'>;

export function Field({ label, hint, error, required, className, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-meta font-bold text-ink">
        {label}
        {required && (
          <>
            {' '}
            {/* 별표만으로 필수를 표시하지 않는다 — 스크린리더가 읽을 단어를 준다 */}
            <span className="font-normal text-muted-text">(필수)</span>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-meta text-muted-text">
          {hint}
        </p>
      )}

      <input
        id={id}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={cn(hint ? hintId : '', invalid ? errorId : '').trim() || undefined}
        className={cn(
          'h-13 rounded-ghost border bg-paper px-4 text-body text-ink',
          'placeholder:text-muted-text',
          'transition-colors duration-[var(--motion-quick)]',
          invalid ? 'border-error' : 'border-outline-strong focus:border-ink',
        )}
        {...props}
      />

      {invalid && (
        <p id={errorId} role="alert" className="text-label text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type TextAreaProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
} & Omit<ComponentProps<'textarea'>, 'className' | 'required'>;

/** 긴 입력. 규격은 `Field`와 같고 높이만 다르다 — 두 컨트롤이 달라 보이면 안 된다. */
export function TextAreaField({ label, hint, error, required, className, ...props }: TextAreaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-meta font-bold text-ink">
        {label}
        {required && (
          <>
            {' '}
            <span className="font-normal text-muted-text">(필수)</span>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-meta text-muted-text">
          {hint}
        </p>
      )}

      <textarea
        id={id}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={cn(hint ? hintId : '', invalid ? errorId : '').trim() || undefined}
        className={cn(
          'min-h-40 resize-y rounded-ghost border bg-paper px-4 py-3 text-body leading-relaxed text-ink',
          'placeholder:text-muted-text',
          'transition-colors duration-[var(--motion-quick)]',
          invalid ? 'border-error' : 'border-outline-strong focus:border-ink',
        )}
        {...props}
      />

      {invalid && (
        <p id={errorId} role="alert" className="text-label text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type SelectProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  options: { value: string; label: string }[];
} & Omit<ComponentProps<'select'>, 'className' | 'required' | 'children'>;

/** 선택 입력. 보더와 높이는 `Field`와 같다 — 폼 안에서 컨트롤이 달라 보이면 안 된다. */
export function SelectField({ label, hint, error, required, className, options, ...props }: SelectProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-meta font-bold text-ink">
        {label}
        {required && (
          <>
            {' '}
            <span className="font-normal text-muted-text">(필수)</span>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-meta text-muted-text">
          {hint}
        </p>
      )}

      <select
        id={id}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={cn(hint ? hintId : '', invalid ? errorId : '').trim() || undefined}
        className={cn(
          'h-13 rounded-ghost border bg-paper px-4 text-body text-ink',
          'transition-colors duration-[var(--motion-quick)]',
          invalid ? 'border-error' : 'border-outline-strong focus:border-ink',
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {invalid && (
        <p id={errorId} role="alert" className="text-label text-error">
          {error}
        </p>
      )}
    </div>
  );
}
