'use client';

import { useEffect, useRef } from 'react';
import { ButtonLink } from '@/components/ui/button';

/**
 * 홈 영상 히어로.
 *
 * §7은 "히어로 텍스트를 사진 위에 겹치지 않는다"고 못박고 예외를 홈 브랜드 벤토 하나로
 * 한정한다. 이것이 **두 번째 예외**이며, 벤토와 같은 조건 위에서만 성립한다 —
 * 딤이 있을 것, 대비 검사를 통과할 것, 홈일 것 (.omd/preferences.md #18).
 *
 * 딤은 장식 그라디언트가 아니라 **흰 글자의 대비를 확보하는 기능 장치**다. 그래서
 * 불투명도에 하한이 있다: 60%. 최악의 경우(순백 프레임) 흰 글자가 5.74:1로 AA를
 * 통과하며 `npm run design:contrast` 가 이 값을 검사한다. 낮추면 검사가 깨진다.
 *
 * 영상은 **장식이다.** 소리도 자막도 없고 정보를 싣지 않으므로 `aria-hidden` 이며,
 * 읽어야 하는 것은 전부 그 위의 텍스트에 있다.
 *
 * 높이는 관문 토큰(`--h-gateway-*`)을 쓰되 **`h-` 가 아니라 `min-h-` 다.**
 * 고정 높이면 세로가 짧은 화면(가로로 눕힌 휴대폰, 낮은 창)에서 문구와 CTA가
 * `overflow-hidden` 에 잘려 나간다 — 영상을 가두려고 건 속성이 글자까지 가둔다.
 * 최소 높이로 두면 내용이 더 필요할 때 섹션이 늘어난다: 잘리는 대신 자란다.
 *
 * 위쪽 여백을 함께 준 것도 같은 이유다. 내용이 최소 높이를 넘겨 자랄 때 글자가
 * 지면 꼭대기에 닿지 않게 하는 것이고, 내용이 짧을 때는 `justify-end` 가 아래로
 * 밀어 붙이므로 이 여백은 보이지 않는다.
 *
 * 토큰 자체는 `svh` 다 (2026-08-31). 모바일 브라우저에서 `vh` 는 주소창이 숨은
 * **큰 뷰포트** 기준이라, 아래에 붙인 CTA가 첫 화면에서 접히는 자리에 놓였다.
 * `svh` 는 주소창이 보이는 상태를 기준으로 하므로 항상 화면 안에 들어온다.
 */
export function VideoHero() {
  const ref = useRef<HTMLVideoElement>(null);

  /*
    `autoPlay` 속성을 마크업에 두지 않는다. 서버는 사용자의 모션 설정을 모르므로
    속성으로 넣으면 `prefers-reduced-motion: reduce` 인 사람에게도 일단 재생된다.
    마운트 후 확인하고 재생한다 — 줄이기로 한 사람에게는 첫 프레임에서 멈춰 있고,
    그 위의 문구와 CTA는 똑같이 읽힌다 (§15-6).
  */
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // 브라우저가 자동재생을 막아도 화면은 그대로 성립한다 — 정지 화면 + 딤 + 문구
    void video.play().catch(() => {});
  }, []);

  return (
    <section className="relative flex w-full overflow-hidden bg-ink min-h-[var(--h-gateway-mobile)] md:min-h-[var(--h-gateway-tablet)] lg:min-h-[var(--h-gateway-desktop)]">
      <video
        ref={ref}
        src="/videos/hero-rocky-mountain.mp4"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 size-full object-cover"
      />

      {/* 딤 60%. 이 값이 아래 흰 글자의 대비 근거다 — 임의로 낮추지 말 것 */}
      <div className="pointer-events-none absolute inset-0 bg-ink/60" />

      <div className="relative flex w-full flex-col items-start justify-end gap-4 px-[var(--gutter-mobile)] pt-16 pb-12 md:gap-5 md:px-[var(--gutter-tablet)] md:pt-24 md:pb-16 lg:px-[var(--gutter-desktop)] lg:pb-20">
        <h1 className="max-w-[22ch] text-balance text-headline font-bold text-paper">
          캐나다 직배송, 100% 확실한 정품
        </h1>
        {/*
          문구는 운영자가 직접 준 것을 그대로 쓴다 (2026-08-31). DESIGN.md §10과
          어긋나는 지점이 셋 있고 — `~합니다` 종결(법적 고지 전용), `100% 확실한`,
          `가장 빠르고`(입증할 수 없는 최상급) — 대화에서 내린 지시가 우선한다
          (AGENTS.md). 다음 개정 때 §10에 예외로 흡수하든 문구를 바꾸든 결론이 필요하다.

          줄바꿈은 운영자가 준 자리를 지킨다. 절 경계에서 끊기므로 자동 줄바꿈에
          맡기면 그 리듬이 사라진다 — 좁은 화면에서는 각 절이 한 번 더 접힌다.

          크기는 20px다 (2026-08-31 운영자 요청). §3의 본문 계열(16px)에는 없는 단계라
          토큰을 만들지 않고 여기에만 둔다 — 히어로 한 곳뿐인 크기에 이름을 붙이면
          다음 사람이 본문에 쓴다. 두 번째 히어로가 생기면 그때 `--text-lede` 로 올린다.
          행간은 본문과 같은 1.55 비율을 유지한다.
        */}
        <p className="max-w-[46ch] text-[20px]/[1.55] text-paper">
          캐나다 현지 공식 채널에서 직접 바잉하여
          <br />
          꼼꼼한 검수와 함께 가장 빠르고 안전하게 보내드립니다.
        </p>
        <ButtonLink href="/best" variant="on-image" chevron className="mt-1">
          BEST 보기
        </ButtonLink>
      </div>
    </section>
  );
}
