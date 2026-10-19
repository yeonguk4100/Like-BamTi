import type { Metadata } from "next";

/** 운영자 화면 — 검색에 올리지 않는다. 상담 화면에서 들어오는 길도 두지 않는다 */
export const metadata: Metadata = {
  title: "공식 원문 검토 — 복지그루 운영",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
