"use client";

import { useMemo, useState } from "react";
import {
  CURRENT_SERVICES,
  DISABILITIES,
  LEVELS,
  REGIONS,
  type CurrentServiceId,
  type DisabilityId,
  type LevelId,
  type RegionId,
  type Track,
} from "./lib/data";
import { buildSheet, TRACK_LABEL, type ResolvedProgram } from "./lib/build-sheet";

const REPO = "https://github.com/yeonguk4100/Like-BamTi";
const REPO_DOCS = `${REPO}/tree/main/docs`;

type ViewMode = "all" | "grouped";
type TrackFilter = Track | "all";

const TRACK_ORDER: Track[] = ["education", "welfare", "medical"];

const TRACK_DESC: Record<Track, string> = {
  education: "특수교육대상자로 선정되어야 받을 수 있습니다",
  welfare: "읍면동 행정복지센터에 따로 신청해야 합니다",
  medical: "병원에서 먼저 받아야 합니다",
};

const STEPS = [
  { no: 1, title: "조건 입력", desc: "상담하면서 아동 조건을 고릅니다", href: "#step1" },
  { no: 2, title: "결과 확인", desc: "확인할 제도·마감일·서류가 정리됩니다", href: "#step2" },
  { no: 3, title: "안내문 전달", desc: "학부모용 안내문을 출력해 건넵니다", href: "#step3" },
];

export default function Home() {
  const [regionId, setRegionId] = useState<RegionId>("gangwon");
  const [disabilityId, setDisabilityId] = useState<DisabilityId>("autism");
  const [levelId, setLevelId] = useState<LevelId>("elementary");
  const [birthDate, setBirthDate] = useState("2019-03-14");
  const [currentServices, setCurrentServices] = useState<CurrentServiceId[]>(["localChildCenter"]);
  const [copied, setCopied] = useState(false);

  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");

  const sheet = useMemo(
    () => buildSheet({ regionId, disabilityId, levelId, birthDate, currentServices }),
    [regionId, disabilityId, levelId, birthDate, currentServices]
  );

  const counts = useMemo(() => {
    const c: Record<Track, number> = { education: 0, welfare: 0, medical: 0 };
    for (const p of sheet.programs) c[p.track] += 1;
    return c;
  }, [sheet.programs]);

  const visiblePrograms = useMemo(
    () =>
      trackFilter === "all" ? sheet.programs : sheet.programs.filter((p) => p.track === trackFilter),
    [sheet.programs, trackFilter]
  );

  const urgentCount = sheet.deadlines.filter((d) => d.urgent).length;
  const otherTrackCount = counts.welfare + counts.medical;

  function toggleService(id: CurrentServiceId) {
    setCurrentServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(sheet.parentLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <a className="skip" href="#main">
        본문 바로가기
      </a>

      {/* ═══════ 헤더 ═══════ */}
      <div className="util-bar">
        <div className="util-inner">
          <a href={REPO_DOCS} target="_blank" rel="noreferrer">
            기획서
          </a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>

      <header className="gnb">
        <div className="gnb-inner">
          <a href="#main" className="logo">
            <span className="logo-mark">특수교육</span>
            <span className="logo-name">너도나도 길잡이</span>
          </a>
          <nav className="gnb-menu" aria-label="주 메뉴">
            <a href="#step1">조건 입력</a>
            <a href="#step2">결과 확인</a>
            <a href="#reference">참고 자료</a>
            <a href="#step1" className="btn btn-primary btn-sm">
              상담 시작
            </a>
          </nav>
        </div>
      </header>

      <div className="notice">
        <div className="notice-inner">
          <span className="notice-tag">안내</span>
          <p>
            이 도구는 <strong>개인정보를 저장하지 않습니다.</strong> 이름·연락처를 받지 않으며,
            입력값은 화면 계산에만 쓰이고 서버로 전송되지 않습니다. 화면의 아동 정보는 전부
            가상입니다.
          </p>
        </div>
      </div>

      {/* ═══════ 페이지 머리 ═══════ */}
      <div className="page-head">
        <div className="page-head-inner">
          <p className="crumb">홈 &gt; 상담 지원 &gt; 특수교육 지원제도 확인</p>
          <h1 className="h-xl">특수교육 지원제도 상담 지원</h1>
          <p className="lead">
            학부모 문의를 받았을 때 아동의 조건을 입력하면, <strong>교육청·복지부·의료로 갈라진
            제도</strong>를 한 화면에 모아 확인할 제도와 마감일·준비 서류·근거를 정리해 드립니다.
            학부모에게 그대로 건넬 안내문도 함께 만들어집니다.
          </p>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.no}>
              <a
                href={s.href}
                className={`step ${activeStep === s.no ? "step-on" : ""}`}
                onClick={() => setActiveStep(s.no)}
              >
                <span className="step-num">{s.no}</span>
                <span>
                  <strong>{s.title}</strong>
                  <br />
                  <span className="b-sm">{s.desc}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <main id="main">
        {/* ═══════ 1단계 · 조건 입력 ═══════ */}
        <section className="section wrap" id="step1">
          <div className="section-head">
            <h2 className="h-lg">1. 조건 입력</h2>
            <span className="b-sm subtle right">상담 첫머리에 어차피 확인하는 정보만 받습니다</span>
          </div>

          <table className="form-table">
            <caption className="skip">아동 조건 입력</caption>
            <tbody>
              <tr>
                <th scope="row">
                  거주 지역<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {REGIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`chip ${r.id === regionId ? "chip-on" : ""}`}
                        aria-pressed={r.id === regionId}
                        onClick={() => setRegionId(r.id)}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                  <span className="hint">
                    지역을 바꾸면 제도 명칭과 제출 서식 번호가 함께 바뀝니다.
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  장애영역<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {DISABILITIES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`chip ${d.id === disabilityId ? "chip-on" : ""}`}
                        aria-pressed={d.id === disabilityId}
                        onClick={() => setDisabilityId(d.id)}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  학교급<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {LEVELS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        className={`chip ${l.id === levelId ? "chip-on" : ""}`}
                        aria-pressed={l.id === levelId}
                        onClick={() => setLevelId(l.id)}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <label htmlFor="birth">생년월일</label>
                </th>
                <td>
                  <input
                    id="birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                  <span className="hint">
                    재선정 마감일 계산에만 사용하며 저장하지 않습니다. (발달지체는 만 9세 생일 기준)
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">현재 이용 중인 서비스</th>
                <td>
                  <div className="chip-row">
                    {CURRENT_SERVICES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`chip ${currentServices.includes(s.id) ? "chip-on" : ""}`}
                        aria-pressed={currentServices.includes(s.id)}
                        onClick={() => toggleService(s.id)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  <span className="hint">중복 이용 제한이 있는 조합을 확인해 드립니다.</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="btn-row">
            <a
              href="#step2"
              className="btn btn-primary"
              onClick={() => setActiveStep(2)}
            >
              결과 확인하기
            </a>
          </div>
        </section>

        {/* ═══════ 2단계 · 결과 ═══════ */}
        <section className="section section-gray" id="step2">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h-lg">2. 결과 확인</h2>
              <div className="right">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
                  인쇄 · PDF 저장
                </button>
              </div>
            </div>

            {/* 조건 요약 */}
            <div className="summary-bar">
              <span className="sum-label">현재 조건</span>
              <span className="sum-item">{sheet.region.name}</span>
              <span className="sum-sep">|</span>
              <span className="sum-item">{sheet.disability.name}</span>
              <span className="sum-sep">|</span>
              <span className="sum-item">{sheet.level.name}</span>
              <a href="#step1" onClick={() => setActiveStep(1)}>
                조건 수정
              </a>
            </div>

            {/* 요약 통계 */}
            <div className="stat-grid">
              <div className="stat">
                <span className="stat-key">확인할 제도</span>
                <span className="stat-val">
                  {sheet.programs.length}
                  <span className="unit">건</span>
                </span>
              </div>
              <div className="stat">
                <span className="stat-key">소관 밖 제도</span>
                <span className="stat-val">
                  {otherTrackCount}
                  <span className="unit">건</span>
                </span>
              </div>
              <div className="stat">
                <span className="stat-key">날짜가 있는 마감</span>
                <span className="stat-val">
                  {sheet.deadlines.length}
                  <span className="unit">개</span>
                </span>
              </div>
              <div className="stat stat-alert">
                <span className="stat-key">확인이 필요한 항목</span>
                <span className="stat-val">
                  {sheet.warnings.length}
                  <span className="unit">건</span>
                </span>
              </div>
            </div>

            <div className="result-grid">
              {/* ── 담당자용 ── */}
              <section className="panel">
                <div className="panel-head">
                  <h3 className="h-sm">담당자용 확인 시트</h3>
                  <span className="b-sm subtle right">{sheet.region.officeName}</span>
                </div>
                <div className="panel-body">
                  {sheet.warnings.length > 0 && (
                    <div className="block">
                      <h4 className="block-title">
                        확인이 필요한 항목
                        <span className="count">{sheet.warnings.length}건</span>
                      </h4>
                      {sheet.warnings.map((w, i) => (
                        <div key={i} className={`alert ${alertClass(w.kind)}`}>
                          <span className="alert-tag">{alertTag(w.kind)}</span>
                          <p className="alert-title">{w.title}</p>
                          <p className="alert-detail">{w.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="block">
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
                        {sheet.deadlines.map((d, i) => (
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

                  <div className="block">
                    <h4 className="block-title">이번 진단·평가에 들어가는 검사</h4>
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
                        {sheet.disability.tests.map((t, i) => (
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
                    {sheet.disability.note && (
                      <p className="hint">{sheet.disability.note}</p>
                    )}
                  </div>

                  <div className="block">
                    <h4 className="block-title">
                      확인해야 할 제도
                      <span className="count">{sheet.programs.length}건</span>
                    </h4>

                    <div className="controls">
                      <div className="seg" role="group" aria-label="보기 방식">
                        <button
                          type="button"
                          className={`seg-btn ${viewMode === "grouped" ? "seg-on" : ""}`}
                          aria-pressed={viewMode === "grouped"}
                          onClick={() => setViewMode("grouped")}
                        >
                          소관별로 보기
                        </button>
                        <button
                          type="button"
                          className={`seg-btn ${viewMode === "all" ? "seg-on" : ""}`}
                          aria-pressed={viewMode === "all"}
                          onClick={() => setViewMode("all")}
                        >
                          한꺼번에 보기
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`chip chip-filter ${trackFilter === "all" ? "chip-on" : ""}`}
                        onClick={() => setTrackFilter("all")}
                      >
                        전체 {sheet.programs.length}
                      </button>
                      {TRACK_ORDER.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`chip chip-filter ${trackFilter === t ? "chip-on" : ""}`}
                          onClick={() => setTrackFilter(t)}
                          disabled={counts[t] === 0}
                        >
                          {TRACK_LABEL[t]} {counts[t]}
                        </button>
                      ))}
                    </div>

                    {trackFilter === "all" && viewMode === "all" && (
                      <p className="hint" style={{ marginBottom: 16 }}>
                        교육청·복지부·의료가 섞여 있습니다. 이 목록이 한 화면에 있다는 것이 이 도구의
                        핵심입니다.
                      </p>
                    )}

                    {viewMode === "all"
                      ? visiblePrograms.map((p) => <ProgramItem key={p.id} program={p} />)
                      : TRACK_ORDER.filter((t) => trackFilter === "all" || t === trackFilter).map(
                          (t) => {
                            const list = visiblePrograms.filter((p) => p.track === t);
                            if (list.length === 0) return null;
                            return (
                              <div key={t} className="group">
                                <div className="group-head">
                                  <span
                                    className={`badge ${t === "education" ? "badge-primary" : ""}`}
                                  >
                                    {TRACK_LABEL[t]}
                                  </span>
                                  <span className="b-sm subtle">{TRACK_DESC[t]}</span>
                                  <span className="group-count">{list.length}건</span>
                                </div>
                                {list.map((p) => (
                                  <ProgramItem key={p.id} program={p} />
                                ))}
                              </div>
                            );
                          }
                        )}

                    {visiblePrograms.length === 0 && (
                      <p className="hint">이 조건에 해당하는 제도가 없습니다.</p>
                    )}
                  </div>

                  <div className="alert alert-info">
                    <span className="alert-tag">유의</span>
                    <p className="alert-detail" style={{ marginTop: 0 }}>
                      이 시트는 자격을 판정하지 않습니다. 확인해야 할 항목과 근거만 제시하며, 최종
                      판단은 담당자가 합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── 학부모용 ── */}
              <section className="panel letter" id="step3">
                <div className="panel-head">
                  <h3 className="h-sm">3. 학부모용 안내문</h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm right"
                    onClick={copyLetter}
                  >
                    {copied ? "복사했습니다" : "복사하기"}
                  </button>
                </div>
                <div className="panel-body">
                  <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
                    출력해서 건네거나 문자로 보냅니다. 필터와 무관하게 항상 전체가 들어갑니다.
                  </p>
                  <pre className="letter-body">{sheet.parentLetter}</pre>
                </div>
              </section>
            </div>
          </div>
        </section>

        {/* ═══════ 참고 자료 ═══════ */}
        <section className="section wrap" id="reference">
          <div className="section-head">
            <h2 className="h-lg">참고 자료</h2>
            <span className="b-sm subtle right">이 도구가 필요한 이유</span>
          </div>

          <h3 className="h-sm" style={{ marginBottom: 12 }}>
            같은 지원인데 시도마다 이름이 다릅니다
          </h3>
          <p className="b-sm subtle" style={{ marginBottom: 16 }}>
            치료비와 방과후활동비를 지급하는 교육청 바우처 카드입니다. 제도의 실질은 같은데 명칭이
            전부 다릅니다. 이사하면 이전 지역에서 쓰던 이름은 통하지 않습니다.
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
                  <th scope="row">{r.name}</th>
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
            <p className="alert-title">
              2019년에 폐지된 용어가 2025년 지침에 열네 번 남아 있습니다
            </p>
            <p className="alert-detail">
              장애등급제가 폐지되어 「장애등급」은 「장애정도」로 바뀌었습니다. 그런데 경상남도교육청
              2025년 지침은 제출 서류로 「장애등급 결정서」를 반복해 요구합니다. 그대로 안내하면
              보호자는 존재하지 않는 서류를 떼러 갑니다. (강원 1회 · 경남 14회 — 두 지침 원문 대조,
              2026.08)
            </p>
          </div>

          <div className="btn-row">
            <a href={REPO_DOCS} target="_blank" rel="noreferrer" className="btn btn-outline">
              기획서 전문 보기
            </a>
          </div>
        </section>
      </main>

      {/* ═══════ 푸터 ═══════ */}
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
                밖의 금액과 세부 절차는 화면 구성을 보여주기 위한 예시이며, 화면에 「예시」 표시가
                붙습니다.
              </p>
            </div>
            <div>
              <h3>개인정보</h3>
              <p>
                이름·연락처를 받지 않습니다. 입력값은 화면 계산에만 쓰이고 서버로 전송되거나
                저장되지 않습니다. 아동 명단을 보관하는 기능이 없습니다.
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
    </>
  );
}

function alertClass(kind: string) {
  if (kind === "term") return "alert-danger";
  if (kind === "overlap" || kind === "easyToMiss") return "alert-warning";
  return "alert-info";
}

function alertTag(kind: string) {
  if (kind === "term") return "중요";
  if (kind === "overlap") return "중복 확인";
  if (kind === "easyToMiss") return "놓치기 쉬움";
  return "안내";
}

/** 제도 한 건 — 접었다 펼 수 있는 항목 */
function ProgramItem({ program: p }: { program: ResolvedProgram }) {
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
                신청처
              </th>
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
