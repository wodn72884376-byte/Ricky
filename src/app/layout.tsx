import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import './globals.css';

/**
 * 루트 메타데이터.
 *
 * `metadataBase`가 있어야 OG·트위터 카드의 상대 경로가 절대 URL로 바뀐다.
 * 없으면 빌드 경고가 나고 공유 카드의 이미지가 깨진다.
 *
 * 각 화면은 `title.template`에 얹힌다 — 페이지가 `관세 안내`만 주면
 * 탭에는 `관세 안내 — RICKY`로 나온다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'RICKY — 캘거리에서 직접 사서 보내요',
    template: '%s — RICKY',
  },
  description:
    '캐나다 알버타주 캘거리의 공식 매장에서 아크테릭스·룰루레몬·코치를 직접 매입해 한국으로 보내요. 검수 사진과 매입 영수증을 함께 드려요.',
  applicationName: 'RICKY',
  openGraph: {
    type: 'website',
    siteName: 'RICKY',
    locale: 'ko_KR',
    title: 'RICKY — 캘거리에서 직접 사서 보내요',
    description: '한국에 없는 것을, 캘거리에서 직접 사서 보내요.',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  // 통신판매업 미신고 상태이므로 사업자 정보 구조화 데이터는 넣지 않는다 (docs/IA.md §5-7)
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
