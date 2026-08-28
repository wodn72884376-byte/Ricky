import { Search } from '@/components/ui/icons';

/**
 * 헤더 검색.
 *
 * 1행이 아니라 **2행 우측**에 산다 (2026-08-28 운영자 요청). 편집형 대형 메뉴와 같은 줄에
 * 두면 "고르기"와 "찾기"가 한 높이에 서고, 유틸리티 행은 계정·주문·장바구니만 남아 조용해진다.
 *
 * 박스가 아니라 **하단 룰 입력**이다 (DESIGN.md §4 Inputs) — 헤더는 폼이 아니라 지면이므로
 * 보더 상자를 얹으면 그 자리만 UI가 된다. 룰은 3:1을 넘기는 `outline-strong`을 쓴다.
 *
 * 서버 컴포넌트다. `GET /search?q=`라 자바스크립트 없이도 동작한다.
 */
export function SearchBar({ className }: { className?: string }) {
  return (
    <form action="/search" method="get" role="search" className={className}>
      {/*
        돋보기를 크게 쓴다 (2026-08-28 운영자 요청). 20px에서는 22px 본문 옆에서
        아이콘이 아니라 먼지처럼 보였다. 36px은 2행(96px) 안에 들어가는 최대에 가깝다 —
        요청한 300%(60px)는 입력 높이를 넘겨 아이콘이 상자를 뚫는다.
      */}
      <label
        className="flex h-16 w-[300px] items-center gap-3 border-b border-outline-strong
                   transition-colors duration-[var(--motion-quick)] focus-within:border-ink xl:w-[360px]"
      >
        <span className="sr-only">상품 검색</span>
        <Search size={36} className="shrink-0" />
        <input
          type="search"
          name="q"
          placeholder="브랜드 · 상품명"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-nav text-ink outline-none placeholder:text-muted-text"
        />
      </label>
    </form>
  );
}
