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
  education: "특수교육대상자로 선정되어야 받습니다",
  welfare: "읍면동에 따로 신청해야 합니다",
  medical: "병원에서 먼저 받아야 합니다",
};

export default function Home() {
  const [regionId, setRegionId] = useState<RegionId>("gangwon");
  const [disabilityId, setDisabilityId] = useState<DisabilityId>("autism");
  const [levelId, setLevelId] = useState<LevelId>("elementary");
  const [birthDate, setBirthDate] = useState("2019-03-14");
  const [currentServices, setCurrentServices] = useState<CurrentServiceId[]>(["localChildCenter"]);
  const [copied, setCopied] = useState(false);

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
      <nav className="global-nav">
        <span>너도나도 길잡이</span>
        <span className="nav-spacer" />
        <a href={REPO_DOCS} target="_blank" rel="noreferrer">
          기획서
        </a>
        <a href={REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>

      <div className="sub-nav">
        <span className="sub-nav-name">상담 지원 도구</span>
        <div className="sub-nav-links">
          <a href="#why">왜 필요한가</a>
          <a href="#try">직접 해보기</a>
          <a href="#try" className="btn-primary">
            시작하기
          </a>
        </div>
      </div>

      <main>
        {/* ─────────── 히어로 ─────────── */}
        <section className="tile tile-light">
          <div className="tile-inner tile-center">
            <p className="t-caption-strong hero-eyebrow">특수교육 지원제도 상담 지원 도구</p>
            <h1 className="t-hero">
              한 번 입력하면
              <br />두 장이 나옵니다.
            </h1>
            <p className="t-lead hero-sub">
              담당자가 확인할 목록과, 학부모에게 건넬 안내문.
            </p>
            <div className="cta-row">
              <a href="#try" className="btn-primary">
                직접 해보기
              </a>
              <a href="#why" className="btn-ghost">
                왜 필요한가
              </a>
            </div>
            <p className="t-caption hero-note">
              로그인 없음 · 설치 없음 · <strong>개인정보를 저장하지 않습니다</strong>
            </p>
          </div>
        </section>

        {/* ─────────── 문제 ① 이름이 다르다 ─────────── */}
        <section className="tile tile-dark" id="why">
          <div className="tile-inner">
            <h2 className="t-display-lg">같은 지원인데, 이름이 여섯 개입니다.</h2>
            <p className="t-lead-airy dark-lead">
              치료비와 방과후활동비를 지급하는 교육청 바우처 카드입니다. 제도의 실질은 같은데
              시도마다 이름이 다릅니다. 이사하면 이전 지역에서 쓰던 이름은 아무 데도 통하지
              않습니다.
            </p>
            <div className="name-grid">
              {REGIONS.map((r) => (
                <div
                  key={r.id}
                  className={`name-cell ${r.id === regionId ? "name-cell-on" : ""}`}
                >
                  <span className="t-caption region">{r.name}</span>
                  <span className="card-name">{r.cardName}</span>
                </div>
              ))}
            </div>
            <p className="t-caption dark-lead">
              아래에서 지역을 바꾸면 결과에 나오는 카드 이름도 함께 바뀝니다.
            </p>
          </div>
        </section>

        {/* ─────────── 문제 ② 용어가 바뀐다 ─────────── */}
        <section className="tile tile-parchment">
          <div className="tile-inner-narrow">
            <h2 className="t-display-lg">
              2019년에 폐지된 말이
              <br />
              2025년 지침에 열네 번 남아 있습니다.
            </h2>
            <p className="t-body hero-sub" style={{ maxWidth: "none", marginLeft: 0 }}>
              장애등급제가 폐지되어 「장애등급」은 「장애정도」로 바뀌었습니다. 그런데 경상남도교육청
              2025년 지침은 제출 서류로 <strong>「장애등급 결정서」</strong>를 반복해 요구합니다.
              그대로 안내하면 보호자는 <strong>존재하지 않는 서류</strong>를 떼러 갑니다.
            </p>
            <p className="t-caption hero-note" style={{ textAlign: "left" }}>
              강원 1회(전환 안내 목적) · 경남 14회 — 두 지침 원문 대조, 2026.08
            </p>
          </div>
        </section>

        {/* ─────────── 입력 ─────────── */}
        <section className="tile tile-light" id="try">
          <div className="tile-inner">
            <h2 className="t-display-lg tile-center">상담하면서 입력합니다.</h2>
            <p className="t-lead hero-sub">
              상담 첫머리에 어차피 확인하는 정보만 받습니다.
            </p>

            <div className="config-block">
              <span className="t-caption config-label">거주 지역</span>
              <div className="chip-row">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`chip ${r.id === regionId ? "chip-on" : ""}`}
                    onClick={() => setRegionId(r.id)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-block">
              <span className="t-caption config-label">장애영역</span>
              <div className="chip-row">
                {DISABILITIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`chip ${d.id === disabilityId ? "chip-on" : ""}`}
                    onClick={() => setDisabilityId(d.id)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-block">
              <span className="t-caption config-label">학교급</span>
              <div className="chip-row">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`chip ${l.id === levelId ? "chip-on" : ""}`}
                    onClick={() => setLevelId(l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-block">
              <span className="t-caption config-label">
                생년월일 — 재선정 마감일 계산에만 쓰고 저장하지 않습니다
              </span>
              <div className="field-inline">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>

            <div className="config-block">
              <span className="t-caption config-label">현재 이용 중인 서비스</span>
              <div className="chip-row">
                {CURRENT_SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${currentServices.includes(s.id) ? "chip-on" : ""}`}
                    onClick={() => toggleService(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ─────────── 결과 두 장 ─────────── */}
            <div className="result-grid">
              {/* ① 담당자용 */}
              <section className="card">
                <div className="card-head">
                  <h3 className="t-tagline">담당자용 확인 시트</h3>
                  <span className="t-caption card-sub">{sheet.region.officeName}</span>
                </div>

                {sheet.warnings.length > 0 && (
                  <div className="sec">
                    <p className="t-caption sec-title">확인이 필요한 항목</p>
                    {sheet.warnings.map((w, i) =>
                      w.kind === "term" ? (
                        <div key={i} className="alert-dark">
                          <p className="t-body-strong">{w.title}</p>
                          <p className="t-caption alert-detail">{w.detail}</p>
                        </div>
                      ) : (
                        <div key={i} className="alert-plain">
                          <p className="t-body-strong">{w.title}</p>
                          <p className="t-caption alert-detail">{w.detail}</p>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="sec">
                  <p className="t-caption sec-title">마감일</p>
                  <ul className="deadlines">
                    {sheet.deadlines.map((d, i) => (
                      <li key={i} className={d.urgent ? "urgent" : ""}>
                        <span className="t-caption-strong dl-label">{d.label}</span>
                        <span className="t-caption dl-when">{d.when}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="sec">
                  <p className="t-caption sec-title">이번 진단·평가에 들어가는 검사</p>
                  <ul className="tests">
                    {sheet.disability.tests.map((t, i) => (
                      <li key={i}>
                        <span className={`pill-mark ${t.required ? "pill-mark-req" : ""}`}>
                          {t.required ? "필수" : "선택"}
                        </span>
                        <span className="t-caption-strong">{t.label}</span>
                        <span className="t-caption test-items">{t.items}</span>
                      </li>
                    ))}
                  </ul>
                  {sheet.disability.note && (
                    <p className="t-caption note">{sheet.disability.note}</p>
                  )}
                </div>

                <div className="sec">
                  <p className="t-caption sec-title">
                    확인해야 할 제도
                    <span className="count">{sheet.programs.length}건</span>
                  </p>

                  <div className="controls">
                    <div className="seg">
                      <button
                        type="button"
                        className={`seg-btn ${viewMode === "grouped" ? "seg-on" : ""}`}
                        onClick={() => setViewMode("grouped")}
                      >
                        소관별로 나눠 보기
                      </button>
                      <button
                        type="button"
                        className={`seg-btn ${viewMode === "all" ? "seg-on" : ""}`}
                        onClick={() => setViewMode("all")}
                      >
                        한꺼번에 보기
                      </button>
                    </div>
                    <div className="chip-row">
                      <button
                        type="button"
                        className={`chip ${trackFilter === "all" ? "chip-on" : ""}`}
                        onClick={() => setTrackFilter("all")}
                      >
                        전체 {sheet.programs.length}
                      </button>
                      {TRACK_ORDER.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`chip ${trackFilter === t ? "chip-on" : ""}`}
                          onClick={() => setTrackFilter(t)}
                          disabled={counts[t] === 0}
                        >
                          {TRACK_LABEL[t]} {counts[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {trackFilter === "all" && viewMode === "all" && (
                    <p className="t-caption note" style={{ marginTop: 0, marginBottom: 12 }}>
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
                                <span className={`track track-${t}`}>{TRACK_LABEL[t]}</span>
                                <span className="t-caption group-desc">{TRACK_DESC[t]}</span>
                                <span className="t-caption group-count">{list.length}건</span>
                              </div>
                              {list.map((p) => (
                                <ProgramItem key={p.id} program={p} />
                              ))}
                            </div>
                          );
                        }
                      )}

                  {visiblePrograms.length === 0 && (
                    <p className="t-caption note">이 조건에 해당하는 제도가 없습니다.</p>
                  )}
                </div>

                <p className="t-caption card-foot">
                  이 시트는 자격을 판정하지 않습니다. 확인해야 할 항목과 근거만 제시하며, 최종
                  판단은 담당자가 합니다.
                </p>
              </section>

              {/* ② 학부모용 */}
              <section className="card letter">
                <div className="card-head">
                  <h3 className="t-tagline">학부모용 안내문</h3>
                  <button type="button" className="btn-pearl head-right" onClick={copyLetter}>
                    {copied ? "복사했습니다" : "복사"}
                  </button>
                </div>
                <p className="t-caption card-sub" style={{ marginTop: 8 }}>
                  출력해서 건네거나 문자로 보냅니다. 필터와 무관하게 항상 전체가 들어갑니다.
                </p>
                <pre className="letter-body">{sheet.parentLetter}</pre>
              </section>
            </div>
          </div>
        </section>

        {/* ─────────── 확장 ─────────── */}
        <section className="tile tile-dark-2">
          <div className="tile-inner-narrow tile-center">
            <h2 className="t-display-lg">지역을 늘리는 데 필요한 건 코드가 아닙니다.</h2>
            <p className="t-lead-airy dark-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>
              강원과 경남의 선정·배치 지침을 원문으로 대조했습니다. 절차는 동일했고 서식 번호와
              제도 명칭만 달랐습니다. 그래서 지역 확장은 개발이 아니라 데이터 교체입니다.
            </p>
            <div className="cta-row">
              <a href={REPO_DOCS} target="_blank" rel="noreferrer" className="btn-ghost">
                기획서에서 대조표 보기
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <div>
              <h3>이름에 대하여</h3>
              <p>
                강원특별자치도교육청이 담당자에게 배포하는 「특수교육대상자 선정·배치 업무 길잡이」에서
                가져왔습니다. 담당자와 학부모가 같은 한 장을 본다는 뜻으로 「너도나도」를 붙였습니다.
              </p>
            </div>
            <div>
              <h3>데이터에 대하여</h3>
              <p>
                절차·기한·카드 명칭·장애영역별 검사도구는 강원·경남 교육청 지침 원문에서 확인한
                내용입니다. 그 밖의 금액과 세부 절차는 화면 구성을 보여주기 위한 예시이며, 화면에
                「예시」 표시가 붙습니다. 입력하는 아동 정보는 전부 가상입니다.
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
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

/** 제도 한 건 — 접었다 펼 수 있는 항목 */
function ProgramItem({ program: p }: { program: ResolvedProgram }) {
  return (
    <details className="program" open={p.id === "selection"}>
      <summary>
        <span className={`track track-${p.track}`}>{TRACK_LABEL[p.track]}</span>
        <span className="t-body program-name">{p.resolvedName}</span>
        {!p.verified && <span className="pill-mark">예시</span>}
      </summary>
      <div className="program-body">
        <p className="t-caption program-summary">{p.summary}</p>
        <dl className="t-caption">
          <dt>신청처</dt>
          <dd>{p.resolvedApplyTo}</dd>
          <dt>준비 서류</dt>
          <dd>
            <ul className="docs">
              {p.resolvedDocuments.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </dd>
          <dt>기한</dt>
          <dd>{p.deadline}</dd>
          <dt>근거</dt>
          <dd className="basis">{p.legalBasis}</dd>
          <dt>출처</dt>
          <dd className="basis">
            {p.verified ? "확인함 — " : "데모용 예시 — "}
            {p.source}
          </dd>
        </dl>
      </div>
    </details>
  );
}
