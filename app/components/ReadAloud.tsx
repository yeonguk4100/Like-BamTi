// 전화로 읽어 주기 — 상담 전화 중에 담당자가 화면을 보며 그대로 읽는 화면.
//
// 안내문(1면)은 학부모에게 건네는 제품이고, 여기는 그 뒤에 오는 것이다.
// 학부모는 종이를 받고도 전화로 다시 묻는다 — 「그래서 어디로 가면 되죠?」
// 그때 담당자가 표를 눈으로 훑어 옮겨 말하지 않도록, 말할 순서대로 늘어놓는다.
//
// 그래서 표가 아니라 문답이다. 「어디에 신청하나요 — …」 를 그대로 읽으면 답이 된다.
// 판정하는 문장은 넣지 않는다 (설계 원칙 1번). 확인 못 한 항목은 읽기 전에 드러낸다.

"use client";

import { useState } from "react";

import { readAloudBlock, readAloudText, TRACK_LABEL, type ResolvedProgram } from "../lib/build-sheet";

export function ReadAloud({ programs }: { programs: ResolvedProgram[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(readAloudText(programs));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (programs.length === 0) {
    return <p className="hint">이 조건에 해당하는 제도가 없습니다.</p>;
  }

  return (
    <div className="readaloud">
      <div className="readaloud-head">
        <p className="readaloud-lead">
          전화로 확인해 드릴 제도 <strong>{programs.length}건</strong>입니다. 아래 문장을 그대로
          읽어 주시면 됩니다.
        </p>
        <button type="button" className="btn btn-outline btn-sm" onClick={copy}>
          {copied ? "복사했습니다" : "읽어 줄 내용 복사"}
        </button>
      </div>

      <ol className="readaloud-list">
        {programs.map((p) => {
          const b = readAloudBlock(p);
          return (
            <li key={p.id} className="readaloud-item">
              <p className="readaloud-name">
                <span className={`badge ${p.track === "education" ? "badge-primary" : ""}`}>
                  {TRACK_LABEL[b.track]}
                </span>
                {b.name}
                {!b.verified && <span className="badge">예시</span>}
              </p>
              <dl className="readaloud-qa">
                {b.lines.map((l, i) => (
                  <div key={i} className={l.caution ? "readaloud-row readaloud-caution" : "readaloud-row"}>
                    <dt>{l.q}</dt>
                    <dd>{l.a}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ol>

      <p className="hint">
        자격은 신청처에서 최종 확인합니다. 위 내용은 학부모가 확인해야 할 항목이며, 이 화면은
        자격을 판정하지 않습니다.
      </p>
    </div>
  );
}
