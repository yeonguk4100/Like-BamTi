import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "☕ 카페 키오스크 연습",
  description:
    "설치 없이 링크 하나로, 실패해도 아무도 모르게 카페 키오스크 주문을 편안하게 연습하는 웹서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
