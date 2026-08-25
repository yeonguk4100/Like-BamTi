// 참고 자료 — 이 도구가 필요한 이유를 데이터로 보여주는 자리.
//
// 「같은 지원인데 지역마다 이름이 다르다」와 「폐지된 용어가 지침에 남아 있다」.
// 현재 고른 지역의 줄을 강조해 담당자가 자기 지역을 바로 찾게 한다.

import { REGIONS, type RegionId } from "../lib/data";
import { REPO_DOCS } from "../lib/screen";

export function Reference({ regionId }: { regionId: RegionId }) {
  return (
    <section className="section wrap" id="reference">
      <div className="section-head rel">
        <h2 className="h-lg">참고 자료</h2>
        <span className="b-sm subtle right">이 도구가 필요한 이유</span>
      </div>

      <h3 className="h-sm" style={{ marginBottom: 12 }}>
        같은 지원인데 시도마다 이름이 다릅니다
      </h3>
      <p className="b-sm subtle" style={{ marginBottom: 16 }}>
        치료비와 방과후활동비를 지급하는 교육청 바우처 카드입니다. 제도의 실질은 같은데 명칭이
        전부 다릅니다. 이사하면 이전 지역에서 쓰던 이름은 통하지 않습니다.
        <br />
        <strong>「대조만」은 지침을 확인해 절차가 같다는 것만 본 지역입니다.</strong> 지금 시트를 만들 수
        있는 곳은 <strong>강원과 경남</strong>이고, 확인하지 않은 서식 번호로 결과를 내지 않습니다.
        두 지역을 열어 보니 절차는 같고 서식 번호와 명칭만 달랐습니다 — 그래서 확장은 개발이 아니라
        데이터 추가입니다.
      </p>
      <table className="tbl">
        <caption className="skip">시도별 교육청 바우처 카드 명칭</caption>
        <thead>
          <tr>
            <th scope="col" style={{ width: "22%" }}>
              시도
            </th>
            <th scope="col" style={{ width: "26%" }}>
              카드 명칭
            </th>
            <th scope="col">진단·평가 의뢰서 서식</th>
          </tr>
        </thead>
        <tbody>
          {REGIONS.map((r) => (
            <tr key={r.id} className={r.id === regionId ? "row-urgent" : ""}>
              <th scope="row">
                {r.name}{" "}
                {r.implemented ? (
                  <span className="badge badge-primary">구현</span>
                ) : (
                  <span className="badge">대조만</span>
                )}
              </th>
              <td>
                <strong>{r.cardName}</strong>{" "}
                {!r.cardVerified && <span className="badge">출처 확인 필요</span>}
              </td>
              <td className="td-sub">{r.requestFormNo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="alert alert-danger" style={{ marginTop: 32 }}>
        <span className="alert-tag">중요</span>
        <p className="alert-title">2019년에 폐지된 용어가 2025년 지침에 열네 번 남아 있습니다</p>
        <p className="alert-detail">
          장애등급제가 폐지되어 「장애등급」은 「장애정도」로 바뀌었습니다. 그런데
          경상남도교육청 2025년 지침은 제출 서류로 「장애등급 결정서」를 반복해 요구합니다.
          그대로 안내하면 보호자는 존재하지 않는 서류를 떼러 갑니다. (강원 1회 · 경남 14회 — 두
          지침 원문 대조, 2026.08)
        </p>
      </div>

      <div className="btn-row">
        <a href={REPO_DOCS} target="_blank" rel="noreferrer" className="btn btn-outline">
          기획서 전문 보기
        </a>
      </div>

      <div className="callout" style={{ marginTop: 32 }}>
        <div>
          <p className="callout-title">소관 밖은 여기로 안내하세요</p>
          <p className="callout-note">
            교육청 소관이 아닌 문의를 받으셨을 때 학부모께 그대로 알려 주시면 되는 번호입니다.
            전국 어디서나 같습니다.
          </p>
          <ul className="docs" style={{ marginTop: 10 }}>
            <li>
              <a className="official-link" href="tel:129">
                129
              </a>{" "}
              보건복지상담센터 — 발달재활서비스·장애아동수당 등 복지 제도 (4번 장애인)
            </li>
            <li>
              <a className="official-link" href="tel:1355">
                1355
              </a>{" "}
              국민연금공단 — 장애정도 심사 진행 상황
            </li>
            <li>
              장애인 등록 신청 접수와 복지 제도 신청은 <strong>주소지 읍면동 주민센터</strong>입니다
            </li>
            <li>
              선정·배치와 교육청 지원제도는 <strong>관할 교육지원청 특수교육지원센터</strong>입니다
              — 시·군마다 번호가 달라 여기에 적지 않습니다
            </li>
          </ul>
          <p className="callout-note" style={{ marginTop: 10 }}>
            출처 —{" "}
            <a
              className="official-link"
              href="https://www.129.go.kr/counsel/counsel01.do"
              target="_blank"
              rel="noreferrer"
            >
              보건복지상담센터
            </a>{" "}
            ·{" "}
            <a
              className="official-link"
              href="https://www.nps.or.kr/jsppage/etc/disabledPerson/disabledPerson05_05.jsp"
              target="_blank"
              rel="noreferrer"
            >
              국민연금공단 장애등록심사 Q&amp;A
            </a>{" "}
            (2026-08 확인)
          </p>
        </div>
        <a href="#faq" className="btn btn-outline">
          자주 묻는 질문 보기
        </a>
      </div>
    </section>
  );
}
