'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

/** 질의를 URL로 밀어 넣는다. 검색 상태는 컴포넌트가 아니라 주소가 갖는다. */
export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
      }}
      /* 좁은 화면에서는 버튼을 아래로 내린다 — 52px 컨트롤 둘이 390px에 나란히 서지 못한다 */
      className="mt-6 flex flex-col gap-3 md:flex-row md:items-end"
    >
      <Field
        label="검색어"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="브랜드, 상품명, 색상"
        className="flex-1"
      />
      <Button type="submit" variant="inverted" size="lg" className="md:shrink-0">
        검색
      </Button>
    </form>
  );
}
