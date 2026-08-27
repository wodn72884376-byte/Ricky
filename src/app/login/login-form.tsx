'use client';

import { useState } from 'react';
import { createClientIfConfigured } from '@/lib/supabase/client';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/**
 * 매직링크 폼.
 *
 * 비밀번호 입력이 없다. `비밀번호 찾기`·`로그인 유지`도 없다 — 비밀번호가 존재하지 않으므로
 * 잃어버릴 것도, 유지할 것도 없다. 폼이 한 줄인 게 결함이 아니라 이 인증 방식의 결과다.
 */
export function LoginForm({ signup }: { signup: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('sending');

    const supabase = createClientIfConfigured();
    if (!supabase) {
      setStatus('error');
      setMessage('로그인이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus('error');
      setMessage('링크를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setStatus('sent');
    setMessage(`${email}로 링크를 보냈어요. 메일함을 확인해 주세요.`);
  }

  // 보낸 뒤에는 폼을 다시 보여주지 않는다. 할 일은 메일함에 있다.
  if (status === 'sent') {
    return (
      <div className="mt-10 flex flex-col gap-4">
        <p role="status" className="text-body text-ink">
          {message}
        </p>
        <p className="text-meta text-muted-text">
          메일이 안 보이면 스팸함도 확인해 주세요. 링크는 한 시간 동안 유효해요.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-2 self-start text-cta font-bold text-ink underline underline-offset-4"
        >
          다른 이메일로 다시 받기
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <Field
          label="이메일"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />
        <Button type="submit" variant="inverted" disabled={status === 'sending'}>
          {status === 'sending' ? '보내는 중' : signup ? '가입 링크 받기' : '로그인 링크 받기'}
        </Button>
      </form>

      {status === 'error' && (
        <p role="alert" className="mt-5 text-body text-error">
          {message}
        </p>
      )}
    </>
  );
}
