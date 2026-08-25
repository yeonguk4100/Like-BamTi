// ⚠ 데모용 — 발표 후 이 파일을 지운다. app/lib/demo.ts 와 함께.
//
// 실제 업무 화면에는 「데모 사례」 같은 칸이 없다. 그래서 조건 입력 표 안에 두지 않고
// 화면 옆에 띄운다 — 표는 실제 모습 그대로 두고, 시연용 단축만 옆에서 누른다.

"use client";

import { useState } from "react";

import { PRESETS, type Preset } from "../lib/demo";

export function DemoPresets({
  presetId,
  onPick,
}: {
  presetId: string;
  onPick: (p: Preset) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <aside className={`preset-rail ${open ? "" : "preset-rail-shut"}`} aria-label="데모 사례">
      <button
        type="button"
        className="preset-rail-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        데모 사례 {open ? "닫기" : "열기"}
      </button>

      {open && (
        <div className="preset-rail-body">
          <p className="preset-rail-note">
            시연용 단축입니다. 전부 가상 사례이고 실제 업무 화면에는 없는 칸입니다.
          </p>
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`preset ${presetId === p.id ? "preset-on" : ""}`}
                onClick={() => onPick(p)}
              >
                <strong>{p.label}</strong>
                <span>{p.note}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
