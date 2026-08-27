import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RICKY",
  description: "한국에 없는 것을, 캘거리에서 직접 사서 보냅니다",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
