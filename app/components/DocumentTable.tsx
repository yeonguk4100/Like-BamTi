// 제출 서류 표.
//
// 「어디서 떼는가」 칸이 이 표의 핵심이다. 그 칸이 비어 있어서 학부모가
// 서류를 못 갖춰 오고, 담당자가 되돌려 보내는 일이 생겼다 (담당자 인터뷰 2026.08).
// 다른 기관에 먼저 가야 하는 서류는 맨 위로 올리고 표시를 붙인다.

type Doc = {
  key: string;
  label: string;
  formNo: string;
  where: string;
  whereVerified: boolean;
  fromOtherOffice: boolean;
  staffOnly: boolean;
};

export function DocumentTable({
  documents,
  officeName,
  notes,
  hideTitle,
}: {
  documents: Doc[];
  officeName: string;
  notes: string[];
  hideTitle?: boolean;
}) {
  const ordered = [
    ...documents.filter((d) => d.fromOtherOffice),
    ...documents.filter((d) => !d.fromOtherOffice && !d.staffOnly),
    ...documents.filter((d) => d.staffOnly),
  ];

  return (
    <div className="block">
      {!hideTitle && (
        <h4 className="block-title">
          제출 서류
          <span className="count">{documents.length}종</span>
        </h4>
      )}
      <table className="tbl">
        <caption className="skip">신청 상황별 제출 서류와 발급처</caption>
        <thead>
          <tr>
            <th scope="col" style={{ width: "34%" }}>
              서류
            </th>
            <th scope="col">발급처</th>
            <th scope="col" style={{ width: "18%" }}>
              {officeName} 서식
            </th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((d) => (
            <tr key={d.key} className={d.fromOtherOffice ? "row-urgent" : ""}>
              <th scope="row">
                {d.fromOtherOffice && <span className="badge badge-danger">먼저</span>}{" "}
                {d.label}
              </th>
              <td className="td-sub">
                {d.where}
                {!d.whereVerified && <span className="badge">확인 필요</span>}
              </td>
              <td className={d.formNo.includes("미확인") ? "td-sub" : ""}>
                {d.staffOnly ? "—" : d.formNo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        「먼저」가 붙은 서류는 다른 기관에서 받아 오셔야 합니다. 이것이 빠진 채로 접수되면
        되돌려 보내게 되고, 학부모가 다시 오셔야 합니다.
      </p>
      {notes.length > 0 && (
        <ul className="notes">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
