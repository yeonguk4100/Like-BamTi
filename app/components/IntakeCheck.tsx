// 접수 확인 — 학부모가 서류를 가져왔을 때 담당자가 하나씩 체크하고, 빠진 것을 바로 보완 안내로 만든다.
//
// 가치 명제 그대로다 — 반송의 원인은 「빠진 서류」이고, 빠진 것을 그 자리에서 발급처와 함께 알려 주면
// 학부모가 한 번 더 헤매지 않는다. 사업·기술 멘토가 함께 짚은 「서류 누락 확인」.
//
// 설계 판단
//  - 서류 「목록과 발급처」를 보여줄 뿐 대신 쓰거나 내지 않는다 (행정사법 — 만들지 말 것).
//  - 판정하지 않는다. 「접수 가능」 같은 말을 쓰지 않고 「빠진 서류 N종」만 센다.
//  - 체크 상태는 화면에만 있다. 저장하지 않고, 조건이 바뀌면 처음으로 돌아간다 (설계 원칙 2번).
//  - 처음엔 접혀 있다. 1면(안내 전 확인사항)을 늘리지 않으려는 것 — 접수하는 순간에만 연다.

import { useState } from "react";

type Doc = {
  key: string;
  label: string;
  where: string;
  whereVerified: boolean;
  fromOtherOffice: boolean;
  staffOnly: boolean;
};

export function IntakeCheck({ documents, submitTo }: { documents: Doc[]; submitTo: string }) {
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  /* 다른 기관에서 먼저 떼어 와야 하는 서류가 위로 — 제출 서류 표와 같은 순서. 반송의 직접 원인이다 */
  const fromParent = [
    ...documents.filter((d) => !d.staffOnly && d.fromOtherOffice),
    ...documents.filter((d) => !d.staffOnly && !d.fromOtherOffice),
  ];
  const fromStaff = documents.filter((d) => d.staffOnly);
  const missing = fromParent.filter((d) => !have[d.key]);
  const missingStaff = fromStaff.filter((d) => !have[d.key]);
  const checkedCount = documents.filter((d) => have[d.key]).length;

  function toggle(key: string) {
    setCopied(false);
    setHave((v) => ({ ...v, [key]: !v[key] }));
  }

  /** 학부모에게 그대로 건넬 보완 안내 — 빠진 서류와 어디서 받는지만 적는다 */
  function noticeText() {
    const lines = [
      "[서류 보완 안내]",
      `${submitTo}에 내실 서류 중 아래 서류가 빠져 있습니다.`,
      "",
      ...missing.flatMap((d) => [`□ ${d.label}`, `   → ${d.where}`]),
      "",
      "위 서류를 갖추어 다시 제출해 주세요.",
    ];
    return lines.join("\n");
  }

  async function copyNotice() {
    try {
      await navigator.clipboard.writeText(noticeText());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  /* 컴포넌트가 아니라 그리는 함수로 둔다 — 안에서 컴포넌트를 만들면 체크할 때마다 줄이 새로 붙어 초점이 사라진다 */
  function row(d: Doc) {
    return (
      <li key={d.key} className={`intake-row ${have[d.key] ? "intake-done" : ""}`}>
        <label className="intake-label">
          <input type="checkbox" checked={Boolean(have[d.key])} onChange={() => toggle(d.key)} />
          <span className="intake-name">
            {d.fromOtherOffice && <span className="badge badge-danger">먼저</span>} {d.label}
          </span>
        </label>
        <span className="intake-where td-sub">
          {d.where}
          {!d.whereVerified && <span className="badge">확인 필요</span>}
        </span>
      </li>
    );
  }

  return (
    <details className="panel intake">
      <summary className="panel-head intake-summary">
        <h3 className="h-sm">접수할 때 — 서류 누락 확인</h3>
        <span className="b-sm subtle right">
          {checkedCount === 0 ? "학부모가 서류를 가져왔을 때 여세요" : `${checkedCount}/${documents.length}종 확인`}
        </span>
      </summary>
      <div className="panel-body">
        <p className="hint" style={{ marginTop: 0 }}>
          가져온 서류에 체크하면 빠진 서류와 발급처가 남습니다. 체크 내용은 저장하지 않습니다.
        </p>

        <p className="h-xs">보호자가 준비하는 서류 {fromParent.length}종</p>
        <ul className="intake-list">
          {fromParent.map(row)}
        </ul>

        {fromStaff.length > 0 && (
          <>
            <p className="h-xs">학교 · 담당자가 취합하는 서류 {fromStaff.length}종</p>
            <ul className="intake-list">
              {fromStaff.map(row)}
            </ul>
          </>
        )}

        <div className={`intake-result ${missing.length === 0 ? "intake-ok" : ""}`}>
          {missing.length === 0 ? (
            <p>
              보호자 서류 {fromParent.length}종이 모두 체크되었습니다.
              {missingStaff.length > 0 && ` 학교·담당자 취합 서류 ${missingStaff.length}종이 남았습니다.`}
            </p>
          ) : (
            <>
              <p>
                <strong>빠진 서류 {missing.length}종</strong> — 발급처를 함께 알려 주세요.
              </p>
              <ul className="docs">
                {missing.map((d) => (
                  <li key={d.key}>
                    {d.label} <span className="td-sub">→ {d.where}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-sm" onClick={copyNotice}>
                {copied ? "보완 안내를 복사했습니다" : "보완 안내 복사"}
              </button>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
