// 1면 — 담당자가 안내문을 건네기 전에 짚을 것.
//
// 이 도구의 목표는 담당자의 시간을 줄이는 것이다. 그래서 담당자가 읽어야 하는
// 것은 여기 몇 줄로 끝나야 하고, 나머지는 「자세히 보기」로 접힌다.
//
// 여기 남는 것은 셋뿐이다.
//   ① 다른 기관에서 먼저 떼어 와야 하는 서류 — 반송의 직접 원인
//   ② 긴급 마감일 — 상담 중에 말로 짚어야 하는 것
//   ③ 담당자가 모를 수 있거나 이 아동에 대한 판단이 필요한 항목
// 조건과 무관하게 늘 뜨는 일반 안내는 여기 오지 않는다.

import type { Deadline, Warning } from "../lib/build-sheet";
import { alertClass, alertTag } from "../lib/screen";

type Doc = { key: string; label: string; where: string };

export function StaffBrief({
  documentsFirst,
  urgentDeadlines,
  keyWarnings,
}: {
  documentsFirst: Doc[];
  urgentDeadlines: Deadline[];
  keyWarnings: Warning[];
}) {
  const nothing =
    documentsFirst.length === 0 && urgentDeadlines.length === 0 && keyWarnings.length === 0;

  return (
    <section className="panel">
      <div className="panel-head">
        <h3 className="h-sm">건네기 전에 짚을 것</h3>
        <span className="b-sm subtle right">
          {nothing ? "없습니다" : "이 조건에서 놓치기 쉬운 것만 모았습니다"}
        </span>
      </div>
      <div className="panel-body">
        {nothing && (
          <p className="hint" style={{ marginTop: 0 }}>
            이 조건에서는 따로 짚을 것이 없습니다. 위 안내문을 그대로 건네시면 됩니다.
          </p>
        )}

        {documentsFirst.length > 0 && (
          <div className="block">
            <h4 className="block-title">
              다른 곳에서 먼저 떼어 오실 서류
              <span className="count">{documentsFirst.length}종</span>
            </h4>
            <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
              이것이 빠진 채로 접수되면 되돌려 보내게 됩니다. 상담 중에 한 번 짚어 주세요.
            </p>
            <table className="tbl">
              <caption className="skip">먼저 갖춰야 하는 서류</caption>
              <tbody>
                {documentsFirst.map((d) => (
                  <tr key={d.key}>
                    <th scope="row" style={{ width: "34%" }}>
                      {d.label}
                    </th>
                    <td className="td-sub">{d.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {urgentDeadlines.length > 0 && (
          <div className="block">
            <h4 className="block-title">
              말로 짚어야 하는 날짜
              <span className="count">{urgentDeadlines.length}개</span>
            </h4>
            <table className="tbl">
              <caption className="skip">긴급 마감일</caption>
              <tbody>
                {urgentDeadlines.map((d, i) => (
                  <tr key={i} className="row-urgent">
                    <th scope="row" style={{ width: "34%" }}>
                      {d.label}
                    </th>
                    <td className="td-sub">{d.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {keyWarnings.length > 0 && (
          <div className="block">
            <h4 className="block-title">
              확인이 필요한 항목
              <span className="count">{keyWarnings.length}건</span>
            </h4>
            {keyWarnings.map((w, i) => (
              <div key={i} className={`alert ${alertClass(w.kind)}`}>
                <span className="alert-tag">{alertTag(w.kind)}</span>
                <p className="alert-title">{w.title}</p>
                <p className="alert-detail">{w.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
