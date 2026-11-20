// 랜딩페이지 (2026-11 멘토링) — 상담 화면은 /consult.
//
// 참고한 구조: B2B 상담 도구 랜딩(채널톡 · Intercom) — 큰 두 줄 제목 + 짧은 설명 + 검은 알약 버튼,
// 그 아래 은은한 그라데이션 판 위에 실제 제품 화면, 출처 띠, 기능을 좌우로 번갈아 설명, 현장 목소리,
// 자주 묻는 질문, 마지막 CTA. 로고 · 문구는 가져오지 않았다 — 출처 표식은 글자로만 쓴다.
//
// 표현 규칙: 판정하지 않는다 · 대신하지 않는다(반복 확인을 줄여 직접 상담 시간을 늘린다) ·
// 최종 수혜자는 학생 · 학부모. 수치는 정부기관 원문만, 조사 대상을 함께 적는다.

import Link from "next/link";
import { LandingScroll } from "./components/LandingScroll";
import { REPO } from "./lib/screen";

const SOURCES = ["교육청 선정·배치 지침", "복지로", "정부24 · 행정안전부 공공서비스", "국가법령정보센터"];

const STATS = [
  { value: "83%", label: "교원 스트레스 원인 1위 · 학부모 민원 대응", source: "교원 10,888명 · 국가인권위원회 연구용역 2024", url: "https://www.humanrights.go.kr/base/board/read?boardManagementNo=17&boardNo=7610717&menuNo=115" },
  { value: "48.3%", label: "민원 대응으로 본 업무에 지장", source: "기초자치단체 공무원 · 한국행정연구원 2024", url: "https://sky.kipa.re.kr/$/10130/contents/7147340" },
  { value: "52,005명", label: "1년간 선정·배치 신청 학생 수 (재배치 포함)", source: "2026 특수교육 연차보고서 · 센터 교사 1,740명", url: "https://www.nise.go.kr/boardCnts/view.do?boardID=354&boardSeq=744089&lev=0&s=nise&m=010503&opType=N" },
  { value: "+41%", label: "특수교육대상자 10년 증가 · 2026년 124,195명", source: "특수교육통계 · 2016~2026년", url: "https://www.index.go.kr/unify/idx-info.do?idxCd=1544" },
];

const FLOW = [
  { title: "공식 자료", detail: "교육청 지침과 복지로·정부24 등 공식 원문을 근거로 삼습니다." },
  { title: "규칙 기반 분류", detail: "입력 조건에 맞는 제도, 서류, 기한과 확인사항을 정리합니다." },
  { title: "AI 안내 보조 · 선택", detail: "안내문을 쉬운 말로 다듬거나, 빠진 정보의 출처 후보를 찾습니다." },
  { title: "담당자 최종 검토", detail: "상담 담당자가 지침 원문과 확인사항을 대조하고 안내문을 전달합니다." },
];

const FIELDWORK = [
  { value: "약 20곳", label: "기관 문의", detail: "서울을 제외한 교육청과 강원 특수학교 등" },
  { value: "2건", label: "심층 인터뷰", detail: "기관 문의 중 대표 사례를 심층 기록" },
  { value: "7명", label: "특수교사 설문", detail: "현직 특수교사 응답" },
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
      <LandingScroll />
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <Link href="/" className="logo">
            <span className="logo-mark">특수교육</span>
            <span className="logo-name">복지그루</span>
          </Link>
          <nav className="lp-links" aria-label="랜딩 메뉴">
            <a href="#trust">작동 흐름</a>
            <a href="#why">공식 통계</a>
            <a href="#fieldwork">현장 조사</a>
            <a href="#features">기능</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>
          <Link href="/consult" className="lp-pill">
            상담 시작하기
          </Link>
        </div>
      </header>

      <main id="main">
        <section className="lp-screen lp-intro" aria-labelledby="landing-title">
          {/* ── 첫 화면 — 두 줄 제목 + 오른쪽 설명 ── */}
          <div className="lp-hero lp-wrap">
            <h1 className="lp-title" id="landing-title">
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
                <a href="#trust" className="lp-link">
                  작동 흐름 보기 →
                </a>
              </div>
            </div>
          </div>

          {/* ── 그라데이션 판 위의 제품 화면 ── */}
          <div className="lp-wrap">
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
          </div>
        </section>

        <section className="lp-sec lp-screen" id="trust" aria-labelledby="flow-title">
          <div className="lp-wrap">
            <div className="lp-sources">
              <p>모든 항목을 공식 원문으로 확인합니다</p>
              <ul>
                {SOURCES.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <h2 className="lp-h2" id="flow-title">공식 자료에서 상담 안내까지</h2>
            <ol className="lp-cards lp-flow">
              {FLOW.map((step, index) => (
                <li key={step.title} className="lp-card">
                  <span className="lp-flow-index" aria-hidden="true">{index + 1}</span>
                  <h3 className="lp-card-title">{step.title}</h3>
                  <p className="lp-card-body">{step.detail}</p>
                </li>
              ))}
            </ol>
            <p className="lp-fine">조건 계산은 브라우저에서 진행하며, 기본 안내문은 AI 없이도 생성됩니다.</p>
            <div className="lp-hero-cta">
              <a href="#why" className="lp-link">공식 통계 보기 →</a>
              <Link href="/consult" className="lp-link">상담 화면 열기 →</Link>
            </div>
          </div>
        </section>

        <section className="lp-sec lp-sec-tint lp-screen" id="why" aria-labelledby="evidence-title">
          <div className="lp-wrap">
            <h2 className="lp-h2" id="evidence-title">공식 통계</h2>
            <ul className="lp-stats lp-evidence-grid">
              {STATS.map((stat) => (
                <li key={stat.value} className="lp-stat">
                  <p className="lp-stat-value">{stat.value}</p>
                  <p className="lp-stat-label">{stat.label}</p>
                  <p className="lp-stat-src">
                    <a href={stat.url} target="_blank" rel="noreferrer">{stat.source}</a>
                  </p>
                </li>
              ))}
            </ul>

            <div className="lp-hero-cta">
              <a href="#fieldwork" className="lp-link">현장 조사 보기 →</a>
            </div>
          </div>
        </section>

        <section className="lp-sec lp-screen" id="fieldwork" aria-labelledby="fieldwork-title">
          <div className="lp-wrap">
            <h2 className="lp-h2" id="fieldwork-title">팀 현장 조사</h2>
            <ul className="lp-stats lp-evidence-grid lp-fieldwork">
              {FIELDWORK.map((item) => (
                <li key={item.label} className="lp-stat">
                  <p className="lp-stat-value">{item.value}</p>
                  <p className="lp-stat-label">{item.label}</p>
                  <p className="lp-stat-src">{item.detail}</p>
                </li>
              ))}
            </ul>
            <figure className="lp-quote lp-evidence-quote">
              <blockquote>
                「지원제도별로 각각 전화해서 확인해야 하는 점이 어려움. 센터 관할이 아닌 경우 홈페이지나
                전화번호를 찾아서 안내하고 있음.」
              </blockquote>
              <figcaption>교육지원청 특수교육지원센터 담당자 인터뷰 · 2026.08</figcaption>
            </figure>
            <div className="lp-hero-cta">
              <a href="#features" className="lp-link">상담 기능 둘러보기 →</a>
            </div>
          </div>
        </section>

        {/* ── 기능 — 좌우로 번갈아 ── */}
        <section className="lp-sec lp-features" id="features">
          <div className="lp-wrap">
            <div className="lp-screen lp-feature-intro">
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
            </div>

            <div className="lp-row lp-row-rev lp-screen">
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

            <div className="lp-row lp-screen">
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

            <div className="lp-row lp-row-rev lp-screen">
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

        {/* ── 자주 묻는 질문 ── */}
        <section className="lp-sec lp-sec-tint lp-screen" id="faq">
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
        <section className="lp-wrap lp-screen">
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
            <p>특수교육 상담 업무 도구 · 멋쟁이사자처럼 Campus AX-Ton 강원대 · 어영부영</p>
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
