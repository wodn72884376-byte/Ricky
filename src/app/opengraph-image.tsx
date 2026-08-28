import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * 공유 카드 (카카오톡 · 인스타그램 · 슬랙 링크 미리보기).
 *
 * 지면과 같은 규칙이다 — 순백 바탕, 순흑 잉크, 그림자 없음, 장식 없음.
 * 사진을 깔지 않는다: 이 카드는 모든 페이지를 대표하므로 특정 상품 사진이 오면 거짓말이 된다.
 *
 * 카피는 라틴이다 — DESIGN.md §3이 이미 라틴을 디스플레이 레지스터로 쓴다.
 * 그래도 Pretendard를 직접 태운다: 기본 폰트로는 워드마크가 400으로 나와
 * `RICKY`가 브랜드 표기(800)로 읽히지 않는다. 이 라우트는 빌드 시 정적 생성되므로
 * 폰트 읽기는 빌드 때 한 번이고 런타임 비용이 없다.
 */

/** OTF를 satori에 그대로 넘긴다. woff2는 지원하지 않는다. */
async function pretendard(weightName: 'Regular' | 'ExtraBold') {
  return readFile(
    join(process.cwd(), 'node_modules/pretendard/dist/public/static', `Pretendard-${weightName}.otf`),
  );
}
export const alt = 'RICKY — Calgary to Korea';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const [regular, extraBold] = await Promise.all([pretendard('Regular'), pretendard('ExtraBold')]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          color: '#000000',
          padding: '72px 80px',
          fontFamily: 'Pretendard',
        }}
      >
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 6, color: '#5d5d5d' }}>
          SELECT RETAIL
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 168, fontWeight: 800, letterSpacing: -4 }}>
            RICKY
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 40, color: '#000000' }}>
            Calgary&nbsp;&nbsp;→&nbsp;&nbsp;Seoul
          </div>
        </div>

        {/* 지면의 유일한 크롬 — 1px 헤어라인. 푸터 위 규칙과 같은 값이다 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', height: 1, background: '#c4c4c4' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 24,
              fontSize: 24,
              color: '#5d5d5d',
            }}
          >
            <div style={{ display: 'flex' }}>Arc&rsquo;teryx · lululemon · Coach</div>
            <div style={{ display: 'flex' }}>Bought in store. Shipped to you.</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
        { name: 'Pretendard', data: extraBold, weight: 800, style: 'normal' },
      ],
    },
  );
}
