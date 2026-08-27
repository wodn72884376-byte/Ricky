'use client';

import { useEffect, useState } from 'react';

/**
 * 스크롤 축약 헤더 상태.
 *
 * 히스테리시스를 둔다 — 임계값 하나면 그 근처에서 헤더가 떨린다.
 * 내려갈 때는 CONDENSE, 올라갈 때는 EXPAND에서 바뀐다.
 *
 * scroll은 외부 시스템이므로 effect에서 **구독**하고 콜백에서 setState하는 것이 정당한 용도다.
 */
const CONDENSE_AT = 160;
const EXPAND_AT = 60;

export function useCondensedHeader(): boolean {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setCondensed((was) => (was ? y > EXPAND_AT : y > CONDENSE_AT));
    };
    const onScroll = () => {
      // rAF로 묶어 스크롤당 한 번만 계산한다
      if (!frame) frame = requestAnimationFrame(read);
    };
    // 새로고침 시 이미 내려가 있을 수 있다
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return condensed;
}
