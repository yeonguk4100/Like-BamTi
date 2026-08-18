import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "너도나도 길잡이 — 특수교육 지원제도 상담 지원 도구",
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
      <body>{children}</body>
    </html>
  );
}
