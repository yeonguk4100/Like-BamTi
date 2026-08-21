// ⚠ 데모용 — 발표 후 이 파일을 지운다. app/lib/demo.ts 와 함께.

import type { ReactNode } from "react";

/* ⚠ 데모용 — 발표자 키워드. 빈 자리에 초록으로 띄운다. 발표 후 삭제 */
export function DemoKey({
  children,
  top,
  right,
  left,
}: {
  children: ReactNode;
  top?: number | string;
  right?: number | string;
  left?: number | string;
}) {
  return (
    <span className="demo-key" style={{ top, right, left }} aria-hidden="true">
      {children}
    </span>
  );
}
