import { useState } from "react";
import type { Sheet } from "../lib/build-sheet";

type Doc = Sheet["documents"][number];

function preparation(d: Doc) {
  return d.whereVerified ? d.where : "발급처·준비 방법은 신청처에 확인해 주세요.";
}

export function IntakeCheck({ documents, submitTo }: { documents: Doc[]; submitTo: string }) {
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [copyResult, setCopyResult] = useState<{ notice: string; success: boolean }>();

  const fromParent = [
    ...documents.filter((d) => !d.staffOnly && d.fromOtherOffice),
    ...documents.filter((d) => !d.staffOnly && !d.fromOtherOffice),
  ];
  const fromStaff = documents.filter((d) => d.staffOnly);
  const missing = fromParent.filter((d) => !have[d.key] && !d.when);
  const ifApplies = fromParent.filter((d) => !have[d.key] && d.when);
  const missingStaff = fromStaff.filter((d) => !have[d.key]);
  const checkedCount = documents.filter((d) => have[d.key]).length;
  const complete = documents.length > 0 && checkedCount === documents.length;

  const notice = [
    "[서류 보완 안내]",
    `${submitTo}에 내실 서류 중 아래 서류를 준비해 주세요.`,
    ...missing.flatMap((d) => [`□ ${d.label}`, `   → ${preparation(d)}`]),
    ...(ifApplies.length > 0
      ? ["", "아래 서류는 해당하는 경우에만 준비해 주세요.", ...ifApplies.flatMap((d) => [
          `□ ${d.label} (${d.when})`,
          `   → ${preparation(d)}`,
        ])]
      : []),
  ].join("\n");

  const currentCopy = copyResult?.notice === notice ? copyResult : undefined;

  async function copyNotice() {
    try {
      await navigator.clipboard.writeText(notice);
      setCopyResult({ notice, success: true });
    } catch {
      setCopyResult({ notice, success: false });
    }
  }

  function row(d: Doc) {
    const checked = Boolean(have[d.key]);
    let status = "미준비";
    if (checked) status = "준비 완료";
    else if (d.when) status = "해당 여부 확인";
    else if (d.staffOnly) status = "취합 확인 전";

    return (
      <li key={d.key} className="intake-row">
        <label className="intake-label">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              const next = event.target.checked;
              setCopyResult(undefined);
              setHave((current) => ({ ...current, [d.key]: next }));
            }}
          />
          <span className="intake-name">
            {d.fromOtherOffice && <span className="badge badge-danger">먼저</span>} {d.label}
            {d.when && <span className="doc-when">해당하는 경우 — {d.when}</span>}
          </span>
          <span className={`badge ${checked ? "badge-primary" : ""}`} aria-hidden="true">{status}</span>
        </label>
        <p className="intake-where td-sub">
          {preparation(d)}
          {!d.whereVerified && <span className="badge">확인 필요</span>}
        </p>
      </li>
    );
  }

  return (
    <details className="panel intake">
      <summary className="panel-head intake-summary">
        <h3 className="h-sm">4. 서류 누락 확인</h3>
        <span className="b-sm subtle right">{checkedCount}/{documents.length}종 체크</span>
      </summary>
      <div className="panel-body">
        <p className="hint intake-hint">
          준비된 서류에 체크하세요. 체크 내용은 저장하지 않습니다.
        </p>

        <div className={`intake-result ${complete ? "intake-ok" : ""}`} role="status">
          {documents.length === 0 ? (
            <p>이 상담 조건에 표시할 서류가 없습니다.</p>
          ) : complete ? (
            <p><strong>모든 서류 준비 완료</strong> · {checkedCount}종 체크</p>
          ) : (
            <>
              <p><strong>준비 완료 {checkedCount}종</strong> · 보호자 필수 서류 미준비 {missing.length}종</p>
              {ifApplies.length > 0 && <p>해당 여부 확인 {ifApplies.length}종</p>}
              {missingStaff.length > 0 && <p>학교·담당자 취합 확인 전 {missingStaff.length}종</p>}
            </>
          )}
        </div>

        {fromParent.length > 0 && (
          <>
            <p className="h-xs">보호자가 준비하는 서류 {fromParent.length}종</p>
            <ul className="intake-list">{fromParent.map(row)}</ul>
          </>
        )}
        {fromStaff.length > 0 && (
          <>
            <p className="h-xs">학교·담당자가 취합하는 서류 {fromStaff.length}종</p>
            <ul className="intake-list">{fromStaff.map(row)}</ul>
          </>
        )}

        {missing.length > 0 && (
          <div className="intake-result">
            <p><strong>보완할 보호자 필수 서류 {missing.length}종</strong></p>
            <ul className="docs">
              {missing.map((d) => (
                <li key={d.key}>
                  {d.label} <span className="td-sub">→ {preparation(d)}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-sm" onClick={copyNotice}>보완 안내 복사</button>
            {currentCopy?.success && <p className="hint" role="status">보완 안내를 복사했습니다.</p>}
            {currentCopy?.success === false && (
              <>
                <p className="hint" role="status">자동 복사가 실패했습니다. 아래 안내문을 선택해 복사할 수 있습니다.</p>
                <pre className="letter-body">{notice}</pre>
              </>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
