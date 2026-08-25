import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "복지그루 — 특수교육 지원제도 상담 지원",
  description:
    "기관 담당자가 학부모 문의를 받았을 때, 조건을 입력하면 확인해야 할 제도·마감일·준비서류·근거를 한 장으로 정리하고 학부모용 안내문까지 만들어 주는 업무 도구. 개인정보를 저장하지 않습니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 본문 서체. globals.css 의 --font 첫 항목과 맞춘다 */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
