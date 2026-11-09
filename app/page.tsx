// 랜딩페이지 (2026-11 멘토링) — 상담 화면은 /consult.
//
// 참고한 구조: B2B 상담 도구 랜딩(채널톡 · Intercom) — 큰 두 줄 제목 + 짧은 설명 + 검은 알약 버튼,
// 그 아래 은은한 그라데이션 판 위에 실제 제품 화면, 출처 띠, 기능을 좌우로 번갈아 설명, 현장 목소리,
// 자주 묻는 질문, 마지막 CTA. 로고 · 문구는 가져오지 않았다 — 출처 표식은 글자로만 쓴다.
//
// 표현 규칙: 판정하지 않는다 · 대신하지 않는다(반복 확인을 줄여 직접 상담 시간을 늘린다) ·
// 최종 수혜자는 학생 · 학부모. 수치는 정부기관 원문만, 조사 대상을 함께 적는다.

import Link from "next/link";
import { REPO } from "./lib/screen";

const SOURCES = ["교육청 선정·배치 지침", "복지로", "정부24 · 행정안전부 공공서비스", "국가법령정보센터"];

const STATS = [
  { value: "83%", label: "교원이 꼽은 스트레스 1위 — 학부모 민원 대응", source: "교원 10,888명 · 국가인권위원회 2024" },
  { value: "48.3%", label: "민원 대응 때문에 본 업무에 지장", source: "기초자치단체 공무원 · 한국행정연구원 2024" },
  { value: "52,005명", label: "한 해 선정·배치 신청을 센터 교사 1,740명이 받습니다", source: "「2026 특수교육 연차보고서」" },
  { value: "+41%", label: "특수교육대상자 10년 증가 — 124,195명", source: "「2026 특수교육통계」" },
];

const FAQ = [
  {
    q: "AI가 틀린 제도를 안내하면 어떡하나요?",
    a: "제도를 고르는 것은 AI가 아니라 규칙입니다. 같은 조건에는 늘 같은 결과가 나옵니다. AI는 안내문을 쉬운 말로 다듬고, 데이터에 없는 칸을 출처와 함께 찾는 일만 합니다. 출처가 없으면 답하지 않습니다.",
  },
  {
    q: "지원 금액이나 서식이 바뀌면요?",
    a: "복지로 · 정부24 공식 원문을 매일 두 번 다시 받아 바뀐 칸을 찾습니다. 바뀐 것은 자동으로 덮지 않고 운영자가 확인한 뒤 반영합니다. API가 없는 교육청 지침은 게시 시기에 맞춰 사람이 확인합니다.",
  },
  {
    q: "학생 개인정보는 어디에 저장되나요?",
    a: "저장하지 않습니다. 이름 · 연락처를 받지 않고, 조건 계산은 담당자의 브라우저에서 합니다. 공식 원문을 불러올 때 서버로 가는 것은 서비스 번호와 시도 이름뿐입니다.",
  },
  {
    q: "우리 지역도 쓸 수 있나요?",
    a: "지금은 강원 · 경남을 지침 원문으로 채웠고, 서울을 뺀 16개 시도의 출처를 확인했습니다. 지역마다 제출 서류 표와 서식 번호를 채우면 열립니다. 지역을 늘리는 일은 개발이 아니라 데이터입니다.",
  },
  {
    q: "도입은 어떻게 하나요?",
    a: "교육지원청 한 곳에서 한 달 시범 운영으로 시작해, 반송 · 재문의 건수와 상담 확인 시간을 함께 재 보려고 합니다. 시범을 함께할 교육청 · 센터를 찾고 있습니다.",
  },
];

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <Link href="/" className="logo">
            <span className="logo-mark">특수교육</span>
            <span className="logo-name">복지그루</span>
          </Link>
          <nav className="lp-links" aria-label="랜딩 메뉴">
            <a href="#features">기능</a>
            <a href="#why">왜 필요한가</a>
            <a href="#trust">믿을 수 있는 이유</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>
          <Link href="/consult" className="lp-pill">
            상담 시작하기
          </Link>
        </div>
      </header>

      <main id="main">
        {/* ── 첫 화면 — 두 줄 제목 + 오른쪽 설명 ── */}
        <section className="lp-hero lp-wrap">
          <h1 className="lp-title">
            확인은 복지그루가,
            <br />
            상담은 담당자가
          </h1>
          <div className="lp-hero-side">
            <p>
              특수교육 학부모 문의에 — 어디에 · 무엇을 들고 · 언제까지를 한 장으로 정리하는 상담 업무
              도구. 반복 확인을 줄여 학부모와 마주 앉는 시간을 늘립니다.
            </p>
            <div className="lp-hero-cta">
              <Link href="/consult" className="lp-pill lp-pill-lg">
                상담 시작하기
              </Link>
              <a href="#features" className="lp-link">
                기능 둘러보기 →
              </a>
            </div>
          </div>
        </section>

        {/* ── 그라데이션 판 위의 제품 화면 ── */}
        <section className="lp-wrap">
          <div className="lp-stage">
            <div className="lp-app" aria-label="상담 화면 미리보기">
              <div className="lp-app-bar">
                <span className="lp-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="lp-app-url">복지그루 · 상담</span>
              </div>
              <div className="lp-app-body">
                <aside className="lp-app-side">
                  <p className="lp-app-label">조건</p>
                  {["강원특별자치도", "발달지체", "유치원", "신규 선정"].map((c) => (
                    <span key={c} className="lp-app-chip">
                      {c}
                    </span>
                  ))}
                  <p className="lp-app-label">진행</p>
                  <ol className="lp-app-steps">
                    <li className="done">조건 입력</li>
                    <li className="done">안내 전 확인사항</li>
                    <li className="now">학부모 안내문</li>
                    <li>접수 확인</li>
                  </ol>
                </aside>
                <div className="lp-app-main">
                  <p className="lp-app-h">안내 전 확인사항</p>
                  <div className="lp-app-alert">
                    <b>만 9세에 두 부처의 지원이 같이 끝납니다 — 2029년 5월 31일</b>
                    <span>교육청 발달지체 지위와 복지부 발달재활서비스가 같은 달에 끝납니다</span>
                    <em>출처 · 강원 2026 선정·배치 길잡이 · 복지로</em>
                  </div>
                  <p className="lp-app-h">학부모용 안내문</p>
                  <ul className="lp-app-letter">
                    <li>□ 기초조사 서류 — 보호자용은 직접, 담임교사용은 학교에 요청</li>
                    <li>□ 주민등록등본 — 행정복지센터 · 정부24</li>
                    <li>□ 진단·평가 의뢰서 [서식 3]</li>
                    <li>□ 개인정보 수집·이용 및 제공 동의서 [서식 12]</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="lp-float lp-float-a">
              <b>갈림길을 먼저</b>
              <span>만 9세 · 진학 · 어린이집 공문 공백</span>
            </div>
            <div className="lp-float lp-float-b">
              <b>빠진 서류 2종</b>
              <span>주민등록등본 · 기초조사 서류 → 발급처까지</span>
            </div>
          </div>
        </section>

        {/* ── 출처 띠 ── */}
        <section className="lp-wrap lp-sources">
          <p>모든 항목을 공식 원문으로 확인합니다</p>
          <ul>
            {SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {/* ── 기능 — 좌우로 번갈아 ── */}
        <section className="lp-sec" id="features">
          <div className="lp-wrap">
            <p className="lp-eyebrow">기능</p>
            <h2 className="lp-h2">상담 한 건, 네 단계면 끝납니다</h2>

            <div className="lp-row">
              <div>
                <span className="lp-num">01</span>
                <h3 className="lp-h3">조건 네 개만 고르세요</h3>
                <p className="lp-p">
                  지역 · 장애영역 · 학교급 · 신청 상황. 상담 중 어차피 묻는 것만 고르면 교육 · 복지 · 의료
                  제도와 제출 서류, 기한이 정리됩니다. 학생 이름 · 연락처는 받지 않습니다.
                </p>
              </div>
              <div className="lp-visual">
                <div className="lp-seg">
                  <span className="on">신규 선정</span>
                  <span>상급학교 진학</span>
                  <span>전학 · 재배치</span>
                </div>
                <div className="lp-seg">
                  <span className="on">강원</span>
                  <span>경남</span>
                </div>
                <div className="lp-seg">
                  <span>자폐성장애</span>
                  <span>지적장애</span>
                  <span className="on">발달지체</span>
                </div>
              </div>
            </div>

            <div className="lp-row lp-row-rev">
              <div>
                <span className="lp-num">02</span>
                <h3 className="lp-h3">담당자가 먼저 짚을 것만 1면에</h3>
                <p className="lp-p">
                  만 9세에 교육청 · 복지부 지원이 같이 끝나는 갈림길처럼, 소관이 달라 어느 쪽도 알려 주지 않는
                  것을 먼저 보여 줍니다. 모든 항목에 지침 · 원문 출처가 붙습니다. 판정하지 않고 확인 목록을
                  드립니다.
                </p>
              </div>
              <div className="lp-visual">
                <div className="lp-mini-alert">
                  <b>어린이집 아동에게는 교육청 공문이 가지 않습니다</b>
                  <span>신청 시기를 직접 안내하세요 · 담당자 인터뷰</span>
                </div>
                <div className="lp-mini-alert lp-mini-amber">
                  <b>생년월일과 학교급을 다시 확인해 주세요</b>
                  <span>잘못 넣은 입력을 그대로 안내하지 않습니다</span>
                </div>
              </div>
            </div>

            <div className="lp-row">
              <div>
                <span className="lp-num">03</span>
                <h3 className="lp-h3">학부모에게는 종이 한 장</h3>
                <p className="lp-p">
                  어디에 · 무엇을 들고 · 언제까지를 □ 체크리스트로. 담당자가 읽고 고친 뒤 건넵니다. 소관 밖
                  제도를 말로 설명하지 않아도 종이가 설명합니다.
                </p>
              </div>
              <div className="lp-visual">
                <div className="lp-paper">
                  <p>■ 1단계 — 먼저 준비할 서류</p>
                  <p>□ 기초조사 서류</p>
                  <p>□ 주민등록등본</p>
                  <p>□ 장애인복지카드 사본 (해당하는 경우)</p>
                  <p>■ 2단계 — 지역 교육지원청에서 작성할 서류</p>
                  <p>□ 진단·평가 의뢰서 [서식 3]</p>
                </div>
              </div>
            </div>

            <div className="lp-row lp-row-rev">
              <div>
                <span className="lp-num">04</span>
                <h3 className="lp-h3">접수할 때 빠진 서류를 바로</h3>
                <p className="lp-p">
                  가져온 서류에 체크하면 빠진 서류와 발급처, 보완 안내 문구가 나옵니다. 되돌려 보내고 다시
                  받는 일을 줄입니다.
                </p>
              </div>
              <div className="lp-visual">
                <ul className="lp-check">
                  <li className="ok">☑ 진단·평가 의뢰서</li>
                  <li className="ok">☑ 개인정보 수집·이용 동의서</li>
                  <li>☐ 주민등록등본 — 행정복지센터 · 정부24</li>
                  <li>☐ 기초조사 서류 — 담임교사용은 학교에 요청</li>
                </ul>
                <p className="lp-check-sum">빠진 서류 2종 · 보완 안내 복사</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 왜 필요한가 — 수치 띠 ── */}
        <section className="lp-sec lp-sec-tint" id="why">
          <div className="lp-wrap">
            <p className="lp-eyebrow">왜 필요한가</p>
            <h2 className="lp-h2">사람을 늘리기 어려운 자리입니다</h2>
            <div className="lp-stats">
              {STATS.map((s) => (
                <div key={s.value} className="lp-stat">
                  <p className="lp-stat-value">{s.value}</p>
                  <p className="lp-stat-label">{s.label}</p>
                  <p className="lp-stat-src">{s.source}</p>
                </div>
              ))}
            </div>
            <p className="lp-fine">수치마다 조사 대상이 다릅니다. 모두 정부기관 원문에서 확인한 값입니다.</p>

            <figure className="lp-quote">
              <blockquote>
                「지원제도별로 각각 전화해서 확인해야 하는 점이 어려움. 센터 관할이 아닌 경우 홈페이지나
                전화번호를 찾아서 안내하고 있음.」
              </blockquote>
              <figcaption>교육지원청 특수교육지원센터 담당자 인터뷰 · 2026.08</figcaption>
            </figure>
          </div>
        </section>

        {/* ── 신뢰 ── */}
        <section className="lp-sec" id="trust">
          <div className="lp-wrap">
            <p className="lp-eyebrow">믿을 수 있는 이유</p>
            <h2 className="lp-h2">그대로 건네도 되는 한 장</h2>
            <div className="lp-cards">
              <div className="lp-card">
                <p className="lp-card-title">규칙이 고릅니다</p>
                <p className="lp-card-body">같은 조건에는 같은 결과. AI는 문장을 다듬고 빈칸을 출처와 함께 찾는 일만 합니다.</p>
              </div>
              <div className="lp-card">
                <p className="lp-card-title">하루 두 번 원문 확인</p>
                <p className="lp-card-body">복지로 · 정부24 원문을 12시 · 18시경 다시 받아, 바뀐 것은 사람이 확인한 뒤 반영합니다.</p>
              </div>
              <div className="lp-card">
                <p className="lp-card-title">아무것도 저장하지 않습니다</p>
                <p className="lp-card-body">이름 · 연락처를 받지 않고 계산은 브라우저에서. 개인정보 처리 위탁 절차가 붙지 않습니다.</p>
              </div>
              <div className="lp-card">
                <p className="lp-card-title">학생 · 학부모가 최종 수혜자</p>
                <p className="lp-card-body">한 번에 갖춰 가서 다시 오지 않습니다. 받을 지원을 놓치지 않고 상담 만족도가 오릅니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 자주 묻는 질문 ── */}
        <section className="lp-sec lp-sec-tint" id="faq">
          <div className="lp-wrap lp-faq-wrap">
            <div>
              <p className="lp-eyebrow">자주 묻는 질문</p>
              <h2 className="lp-h2">궁금한 점</h2>
            </div>
            <div className="lp-faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 마지막 CTA ── */}
        <section className="lp-wrap">
          <div className="lp-end">
            <h2>다음 상담부터 써 보세요</h2>
            <p>설치 · 가입 없이 바로 열립니다. 지금 운영 지역은 강원 · 경남입니다.</p>
            <Link href="/consult" className="lp-pill lp-pill-lg lp-pill-light">
              상담 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-inner">
          <div>
            <p className="lp-foot-brand">복지그루</p>
            <p>특수교육 상담 업무 도구 · 멋쟁이사자처럼 Campus AX-Ton 강원대 · 멋쟁이 밤티들</p>
          </div>
          <nav className="lp-foot-links" aria-label="바닥 메뉴">
            <Link href="/consult">상담 시작하기</Link>
            <a href="#faq">자주 묻는 질문</a>
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
