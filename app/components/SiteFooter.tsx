// 푸터 — 이름의 유래 · 데이터의 출처 · 개인정보 처리 방식.
//
// 개인정보 문구는 실제 동작과 반드시 일치해야 한다. 규칙 계산은 브라우저에서 끝나고,
// AI 안내문을 만들 때만 조건이 서버를 거친다. 이 구조를 바꾸면 이 문구도 고쳐야 한다.

import { REPO } from "../lib/screen";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-cols">
          <div>
            <h3>이름에 대하여</h3>
            <p>
              강원특별자치도교육청이 담당자에게 배포하는 「특수교육대상자 선정·배치 업무
              길잡이」에서 가져왔습니다. 담당자와 학부모가 같은 한 장을 본다는 뜻으로
              「너도나도」를 붙였습니다.
            </p>
          </div>
          <div>
            <h3>데이터에 대하여</h3>
            <p>
              절차·기한·카드 명칭·검사 도구는 강원·경남 교육청 지침 원문에서 확인한 내용입니다. 그
              밖의 공지사항·서식 파일·문의처·금액은 화면 구성을 위한 가상 데이터입니다.
            </p>
          </div>
          <div>
            <h3>개인정보</h3>
            <p>
              이름·연락처를 받지 않습니다. 규칙 계산은 화면 안에서 끝나고, AI 안내문을 만들 때만
              조건이 서버를 거칩니다. 그때도 저장하거나 기록하지 않고, 생년월일과 담당자 연락처는
              AI에 넘기지 않습니다. 아동 명단을 보관하는 기능이 없습니다.
            </p>
          </div>
        </div>
        <div className="footer-legal">
          <p>
            멋쟁이사자처럼 Campus AX-Ton 강원대 · 팀 멋쟁이 밤티들 ·{" "}
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <br />이 화면은 학습용 시연입니다. 실제 행정 기관의 서비스가 아닙니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
