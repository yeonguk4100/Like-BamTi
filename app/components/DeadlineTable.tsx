// 마감일 표. urgent 가 붙은 줄이 상담에서 먼저 짚어야 하는 줄이다.

import type { Deadline } from "../lib/build-sheet";

export function DeadlineTable({
  deadlines,
  urgentCount,
}: {
  deadlines: Deadline[];
  urgentCount: number;
}) {
  return (
    <div className="block" id="deadlines">
      <h4 className="block-title">
        마감일
        {urgentCount > 0 && <span className="count">긴급 {urgentCount}건</span>}
      </h4>
      <table className="tbl">
        <caption className="skip">항목별 마감일</caption>
        <thead>
          <tr>
            <th scope="col" style={{ width: "34%" }}>
              항목
            </th>
            <th scope="col">기한</th>
          </tr>
        </thead>
        <tbody>
          {deadlines.map((d, i) => (
            <tr key={i} className={d.urgent ? "row-urgent" : ""}>
              <th scope="row">
                {d.urgent && <span className="badge badge-danger">긴급</span>}{" "}
                {d.label}
              </th>
              <td className="td-sub">{d.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
