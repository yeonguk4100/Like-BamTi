// 확인해야 할 제도 한 건.
//
// verified 가 false 면 「예시」 배지가 붙는다. 근거와 출처를 늘 함께 보여준다
// (설계 원칙 3번). 자격을 판정하는 표시는 없다.

import { eligibilityLines, TRACK_LABEL, type ResolvedProgram } from "../lib/build-sheet";

/** 제도 한 건 — 접었다 펼 수 있는 항목 */
export function ProgramItem({ program: p }: { program: ResolvedProgram }) {
  const eligibility = eligibilityLines(p);
  return (
    <details className="program" open={p.id === "selection"}>
      <summary>
        <span className={`badge ${p.track === "education" ? "badge-primary" : ""}`}>
          {TRACK_LABEL[p.track]}
        </span>
        <span className="program-name">{p.resolvedName}</span>
        {!p.verified && <span className="badge">예시</span>}
      </summary>
      <div className="program-body">
        <p className="program-summary">{p.summary}</p>
        <table className="tbl">
          <caption className="skip">{p.name} 상세</caption>
          <tbody>
            <tr>
              <th scope="row" style={{ width: "24%" }}>
                대상 조건
              </th>
              <td>
                {eligibility.length > 0 ? (
                  <ul className="docs">
                    {eligibility.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="td-sub">조건을 따로 확인하지 못했습니다. 지침 원문을 확인하세요.</span>
                )}
                {p.ageNote && <span className="hint">{p.ageNote}</span>}
              </td>
            </tr>
            <tr>
              <th scope="row">신청처</th>
              <td>{p.resolvedApplyTo}</td>
            </tr>
            <tr>
              <th scope="row">준비 서류</th>
              <td>
                <ul className="docs">
                  {p.resolvedDocuments.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr>
              <th scope="row">기한</th>
              <td>{p.deadline}</td>
            </tr>
            {p.officialUrl && (
              <tr>
                <th scope="row">공식 안내</th>
                <td>
                  <a
                    className="official-link"
                    href={p.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p.officialUrlLabel ?? p.officialUrl}
                  </a>
                  <span className="hint"> 학부모께 그대로 알려 주셔도 됩니다.</span>
                </td>
              </tr>
            )}
            <tr>
              <th scope="row">근거</th>
              <td className="td-sub">{p.legalBasis}</td>
            </tr>
            <tr>
              <th scope="row">출처</th>
              <td className="td-sub">
                {p.verified ? "확인함 — " : "데모용 예시 — "}
                {p.source}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
