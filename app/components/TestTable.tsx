// 진단·평가에 들어가는 검사 표.
//
// detailNote 는 담당자가 적은 참고 정보다. 검사 선택이나 판정에 쓰지 않는다는 것을
// 화면에도 적어 둔다 (설계 원칙 1번).

import type { Disability } from "../lib/data";

export function TestTable({
  disability,
  detailNote,
  hideTitle,
}: {
  disability: Disability;
  detailNote?: string;
  hideTitle?: boolean;
}) {
  return (
    <div className="block">
      {!hideTitle && <h4 className="block-title">이번 진단·평가에 들어가는 검사</h4>}
      {detailNote && (
        <p className="detail-line">
          <strong>{disability.detailLabel}</strong>
          {detailNote}
          <span className="hint">
            담당자가 입력한 참고 정보입니다. 검사 선택이나 판정에는 쓰이지 않습니다.
          </span>
        </p>
      )}
      {disability.tests.length === 0 ? (
        <p className="hint" style={{ marginTop: 0 }}>
          이 영역의 검사 도구는 아직 등록되지 않았습니다. 소속 교육청 지침에서
          확인하세요.
        </p>
      ) : (
        <table className="tbl">
          <caption className="skip">장애영역별 검사 도구</caption>
          <thead>
            <tr>
              <th scope="col" style={{ width: 68 }}>
                구분
              </th>
              <th scope="col" style={{ width: "28%" }}>
                검사 영역
              </th>
              <th scope="col">검사 도구</th>
            </tr>
          </thead>
          <tbody>
            {disability.tests.map((t, i) => (
              <tr key={i}>
                <td>
                  <span className={`badge ${t.required ? "badge-req" : ""}`}>
                    {t.required ? "필수" : "선택"}
                  </span>
                </td>
                <th scope="row">{t.label}</th>
                <td className="td-sub">{t.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {disability.note && <p className="hint">{disability.note}</p>}
    </div>
  );
}
