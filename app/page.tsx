"use client";

import { useMemo, useState } from "react";
import {
  CURRENT_SERVICES,
  DISABILITIES,
  LEVELS,
  PROCEDURES,
  REGIONS,
  UNREGISTERED_AREAS,
  type CurrentServiceId,
  type DisabilityId,
  type LevelId,
  type ProcedureId,
  type RegionId,
  type Track,
} from "./lib/data";
import {
  age9EndOfMonth,
  buildSheet,
  TRACK_LABEL,
} from "./lib/build-sheet";
import {
  FIGURES,
  QUICK,
  REPO,
  REPO_DOCS,
  SCOPE_AGE_MAX,
  SCOPE_AGE_MIN,
  STEPS,
  type LookupResult,
  type TrackFilter,
  type ViewMode,
} from "./lib/screen";
import { Icon } from "./components/Icon";
import { ProgramItem } from "./components/ProgramItem";
import { Faq } from "./components/Faq";
import { NoticeBoard } from "./components/NoticeBoard";
import { SiteFooter } from "./components/SiteFooter";
import { LetterPanel } from "./components/LetterPanel";
import { DetailPanel } from "./components/DetailPanel";
import { StaffBrief } from "./components/StaffBrief";
import { Reference } from "./components/Reference";
import { HeroArt } from "./components/HeroArt";
/* ⚠ 데모용 — 발표 후 아래 두 줄과 쓰는 곳을 지운다 */
import { type Preset } from "./lib/demo";
import { DemoPresets } from "./components/DemoPresets";

export default function Home() {
  const [regionId, setRegionId] = useState<RegionId>("gangwon");
  const [disabilityId, setDisabilityId] = useState<DisabilityId>("autism");
  const [levelId, setLevelId] = useState<LevelId>("elementary");
  const [procedureId, setProcedureId] = useState<ProcedureId>("new");

  /**
   * 처음에는 아무것도 고르지 않은 화면을 보여준다.
   *
   * 조건 기본값은 그대로 두되(규칙 계층이 늘 유효한 값을 받아야 한다) 담당자가
   * 직접 고르기 전까지는 고른 것처럼 보이지 않게 한다. 입력하지 않았는데 결과와
   * 안내문이 이미 나와 있으면 「조건을 넣으면 나옵니다」가 성립하지 않는다.
   */
  const [picked, setPicked] = useState({
    procedure: false,
    region: false,
    disability: false,
    level: false,
  });
  const allPicked = picked.procedure && picked.region && picked.disability && picked.level;
  /** 「결과 확인하기」를 누른 뒤에만 2·3단계를 보여준다 */
  const [showResult, setShowResult] = useState(false);
  const [birthDate, setBirthDate] = useState("2019-03-14");
  /* 고른 적 없는 항목이 체크돼 있으면 안 된다. 선택 항목이므로 빈 배열로 시작한다 */
  const [currentServices, setCurrentServices] = useState<CurrentServiceId[]>([]);
  const [otherDisabilityLabel, setOtherDisabilityLabel] = useState("");
  const [detailNote, setDetailNote] = useState("");

  /* 안내문 발신 정보 — 담당자 본인 정보이며 저장하지 않는다 */
  const [senderOrg, setSenderOrg] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderTel, setSenderTel] = useState("");

  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");

  /* AI 안내문 — 조건별로 캐시한다 */
  const [aiCache, setAiCache] = useState<Record<string, string>>({});
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  /* AI 웹 검색 — 지역+항목별로 캐시한다 */
  const [lookupCache, setLookupCache] = useState<Record<string, LookupResult>>({});
  const [lookupBusy, setLookupBusy] = useState("");
  const [lookupError, setLookupError] = useState("");

  /* ⚠ 데모용 — 발표 후 삭제 */
  const [presetId, setPresetId] = useState("a");

  function applyPreset(p: Preset) {
    setPresetId(p.id);
    setRegionId(p.regionId);
    setDisabilityId(p.disabilityId);
    setLevelId(p.levelId);
    setProcedureId(p.procedureId ?? "new");
    setBirthDate(p.birthDate);
    setCurrentServices(p.currentServices);
    setOtherDisabilityLabel("");
    setDetailNote("");
    /* 데모 사례는 조건을 한 번에 채우므로 고른 것으로 본다 */
    setPicked({ procedure: true, region: true, disability: true, level: true });
    setShowResult(true);
  }

  const sheet = useMemo(
    () =>
      buildSheet({
        regionId,
        disabilityId,
        levelId,
        procedureId,
        birthDate,
        currentServices,
        otherDisabilityLabel,
        detailNote,
        sender: { org: senderOrg, name: senderName, tel: senderTel },
      }),
    [
      regionId,
      disabilityId,
      levelId,
      procedureId,
      birthDate,
      currentServices,
      otherDisabilityLabel,
      detailNote,
      senderOrg,
      senderName,
      senderTel,
    ]
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
  const firstUrgent = sheet.deadlines.find((d) => d.urgent);
  const age9Date = sheet.disability.reselection === "age9" ? age9EndOfMonth(birthDate) : null;
  const outOfScope =
    sheet.age !== null && (sheet.age < SCOPE_AGE_MIN || sheet.age > SCOPE_AGE_MAX);

  /* 서버로 보내는 조건. 규칙 계산은 서버가 다시 하고, 그 결과만 AI 에 넘어간다.
     생년월일은 마감일 계산에 필요해 서버까지 가지만 AI 에는 넘기지 않는다 (app/api/letter) */
  const aiPayload = useMemo(
    () => ({
      regionId,
      disabilityId,
      levelId,
      procedureId,
      birthDate,
      currentServices,
      otherDisabilityLabel,
      sender: { org: senderOrg, name: senderName, tel: senderTel },
    }),
    [
      regionId,
      disabilityId,
      levelId,
      procedureId,
      birthDate,
      currentServices,
      otherDisabilityLabel,
      senderOrg,
      senderName,
      senderTel,
    ]
  );

  const aiKey = useMemo(() => JSON.stringify(aiPayload), [aiPayload]);
  const aiLetter = aiCache[aiKey];
  const shownLetter = aiLetter ?? sheet.parentLetter;

  async function rewriteWithAi() {
    if (aiStatus === "loading") return;
    setAiStatus("loading");
    setAiError("");
    try {
      const res = await fetch("/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.letter) {
        setAiError(data.error ?? "안내문을 받지 못했습니다.");
        setAiStatus("error");
        return;
      }
      setAiCache((prev) => ({ ...prev, [aiKey]: data.letter }));
      setAiStatus("idle");
    } catch {
      setAiError("요청을 보내지 못했습니다. 네트워크를 확인하세요.");
      setAiStatus("error");
    }
  }

  async function runLookup(target: string) {
    const cacheKey = `${regionId}:${target}`;
    if (lookupBusy || lookupCache[cacheKey]) return;
    setLookupBusy(target);
    setLookupError("");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, regionId }),
      });
      const data = await res.json();
      if (!res.ok) setLookupError(data.error ?? "검색에 실패했습니다.");
      else setLookupCache((prev) => ({ ...prev, [cacheKey]: data }));
    } catch {
      setLookupError("요청을 보내지 못했습니다.");
    } finally {
      setLookupBusy("");
    }
  }

  function toggleService(id: CurrentServiceId) {
    setCurrentServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /* AI 안내문을 버리고 규칙이 만든 기본 서식으로 돌아간다 */
  function resetLetter() {
    setAiCache((prev) => {
      const next = { ...prev };
      delete next[aiKey];
      return next;
    });
  }

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(shownLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <a className="skip" href="#main">
        본문 바로가기
      </a>

      {/* ⚠ 데모용 — 발표 후 이 줄과 import 를 지운다 */}
      <DemoPresets presetId={presetId} onPick={applyPreset} />

      <div className="util-bar">
        <div className="util-inner">
          <span className="util-flag">학습용 시연 화면입니다. 실제 행정 서비스가 아닙니다.</span>
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
            <span className="logo-name">복지그루</span>
          </a>
          <nav className="gnb-menu" aria-label="주 메뉴">
            <a href="#step1" className="gnb-link">
              상담 지원
            </a>
            <a href="#step2" className="gnb-link">
              확인 시트
            </a>
            <a href="#forms" className="gnb-link">
              자료실
            </a>
            <a href="#reference" className="gnb-link">
              참고 자료
            </a>
            <a href="#step1" className="btn btn-primary">
              상담 시작
            </a>
          </nav>
        </div>
      </header>

      <nav className="tabnav" aria-label="단계">
        <div className="tabnav-inner">
          {STEPS.map((s) => (
            <a
              key={s.no}
              href={s.href}
              className={`tab ${activeStep === s.no ? "tab-on" : ""}`}
              onClick={() => setActiveStep(s.no)}
            >
              {s.no}. {s.title}
            </a>
          ))}
          <a href="#reference" className="tab">
            참고 자료
          </a>
        </div>
      </nav>

      <div className="notice">
        <div className="notice-inner">
          <span className="notice-tag">안내</span>
          <p>
            <strong>이름과 연락처는 수집하지 않습니다.</strong> 제도 및 일정 계산은 브라우저에서
            처리하며, AI 안내문 생성 시 필요한 조건만 서버로 전달합니다. 전달된 정보는 저장하지
            않습니다.
            <span className="notice-sub">
              ※ 화면에 표시되는 아동 정보는 모두 가상 사례입니다.
            </span>
          </p>
        </div>
      </div>

      <main id="main">
        <section className="hero" aria-label="서비스 소개">
          <div className="hero-inner rel">
            <div className="hero-text">
              <p className="hero-kicker">특수교육 지원제도 상담 지원</p>
              <h1>
                담당자님, 안녕하세요.
                <br />
                <span className="hero-quote">
                  “소관이 달라도, 한 화면에서 확인하실 수 있습니다”
                </span>
              </h1>
              <p className="hero-lead">
                흩어진 특수교육·복지·의료 제도를 아이 조건에 맞게 정리하고, 담당자에게{" "}
                <strong>신청 순서와 학부모 안내문까지 한 번에</strong> 제공하는 업무도구입니다.
              </p>
              <div className="hero-cta">
                <a href="#step1" className="btn btn-primary">
                  상담 시작하기
                </a>
              </div>
            </div>

            {/* 삽화. 담당자와 학부모가 같은 한 장을 함께 본다는 뜻이다.
                파일이 없으면 자리째 사라진다 — HeroArt 주석 참고 */}
            <HeroArt />
          </div>
        </section>

        <div className="figures">
          <dl className="figure-row">
            {FIGURES.map((f) => (
              <div className="figure" key={f.key}>
                <dt>{f.key}</dt>
                <dd>
                  {f.value}
                  <span className="unit">{f.unit}</span>
                </dd>
                <p>{f.note}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="quick">
          <div className="quick-card">
            <p className="quick-title">자주 찾는 서비스</p>
            <nav className="quick-grid" aria-label="자주 찾는 서비스">
              {QUICK.map((q) => (
                <a href={q.href} className="quick-item" key={q.label}>
                  <span className="quick-ic">
                    <Icon name={q.icon} />
                  </span>
                  <span className="quick-label">{q.label}</span>
                  <span className="quick-desc">{q.desc}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>


        <div className="page-head">
          <div className="page-head-inner rel">
            <p className="crumb">홈 &gt; 상담 지원 &gt; 특수교육 지원제도 확인</p>
            <h1 className="h-xl">특수교육 지원제도 상담 지원</h1>
            <p className="lead">
              <strong>판정하지 않습니다. 확인 목록을 드립니다.</strong> 모든 항목에 근거 법령과 지침
              출처가 붙고, 입력값은 저장되지 않습니다. 지금 정리된 제도와 마감일은 만{" "}
              {SCOPE_AGE_MIN}세~만 {SCOPE_AGE_MAX}세 구간에 맞춰져 있습니다.
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

        {/* ═══ 1단계 ═══ */}
        <section className="section wrap" id="step1">
          <div className="section-head">
            <h2 className="h-lg">1. 조건 입력</h2>
            <span className="b-sm subtle right">상담에 필요한 기본 정보만 입력합니다</span>
          </div>

          <table className="form-table">
            <caption className="skip">아동 조건 입력</caption>
            <tbody>
              <tr>
                <th scope="row">
                  신청 상황<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {PROCEDURES.map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        className={`chip ${picked.procedure && x.id === procedureId ? "chip-on" : ""}`}
                        aria-pressed={x.id === procedureId}
                        onClick={() => {
                          setProcedureId(x.id);
                          setPicked((v) => ({ ...v, procedure: true }));
                        }}
                      >
                        {x.name}
                      </button>
                    ))}
                  </div>
                  <span className="hint">{sheet.procedure.when}</span>
                </td>
              </tr>

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
                        className={`chip ${picked.region && r.id === regionId ? "chip-on" : ""}`}
                        aria-pressed={r.id === regionId}
                        onClick={() => {
                          setRegionId(r.id);
                          setPicked((v) => ({ ...v, region: true }));
                        }}
                        disabled={!r.implemented}
                        title={
                          r.implemented
                            ? undefined
                            : `${r.name}은 지침 대조만 했고 아직 구현하지 않았습니다`
                        }
                      >
                        {r.name}
                        {!r.implemented && " (대조만)"}
                      </button>
                    ))}
                  </div>
                  <span className="hint">
                    현재 <strong>강원특별자치도</strong>와 <strong>경상남도</strong>를 지원합니다. 두
                    지역은 지침 원문을 기준으로 서식 번호와 명칭까지 확인했으며, 다른 지역은 검증 후
                    순차적으로 추가할 예정입니다. 지역별 대조 결과는{" "}
                    <a href="#reference">참고 자료</a>에서 확인할 수 있습니다.
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
                        className={`chip ${picked.disability && d.id === disabilityId ? "chip-on" : ""}`}
                        aria-pressed={d.id === disabilityId}
                        onClick={() => {
                          setDisabilityId(d.id);
                          setPicked((v) => ({ ...v, disability: true }));
                        }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>

                  {disabilityId === "other" && (
                    <div className="sub-field">
                      <label htmlFor="otherArea" className="sub-label">
                        영역명 직접 입력
                      </label>
                      <input
                        id="otherArea"
                        type="text"
                        className="text-input"
                        value={otherDisabilityLabel}
                        onChange={(e) => setOtherDisabilityLabel(e.target.value)}
                        placeholder="예: 정서·행동장애"
                      />
                      <span className="hint">
                        특수교육법상 11개 영역 가운데 위 세 가지가 아니면 「기타」를 고르고 영역명을
                        적습니다. 적은 이름이 확인 시트와 학부모 안내문에 그대로 들어갑니다. 아직
                        검사 도구가 등록되지 않은 영역: {UNREGISTERED_AREAS}
                      </span>
                    </div>
                  )}

                  <div className="sub-field">
                    <label htmlFor="detailNote" className="sub-label">
                      {sheet.disability.detailLabel} <span className="opt">선택</span>
                    </label>
                    <input
                      id="detailNote"
                      type="text"
                      className="text-input"
                      value={detailNote}
                      onChange={(e) => setDetailNote(e.target.value)}
                      placeholder={sheet.disability.detailPlaceholder}
                    />
                    <span className="hint">
                      {sheet.disability.detailHint} 확인 시트에만 참고로 표시되며 판정이나 검사
                      선택에는 쓰이지 않습니다.
                    </span>
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
                        className={`chip ${picked.level && l.id === levelId ? "chip-on" : ""}`}
                        aria-pressed={l.id === levelId}
                        onClick={() => {
                          setLevelId(l.id);
                          setPicked((v) => ({ ...v, level: true }));
                        }}
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
                  {outOfScope && (
                    <span className="hint" style={{ color: "var(--amber)" }}>
                      만 {sheet.age}세는 이 도구가 정리한 구간(만 {SCOPE_AGE_MIN}~{SCOPE_AGE_MAX}세)
                      밖입니다. 절차와 서류는 같지만, 제도 목록과 마감일은 다시 확인해야 합니다.
                    </span>
                  )}
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
                  <span className="hint">중복 이용 제한이 있는 조합을 확인합니다.</span>
                </td>
              </tr>

              <tr>
                <th scope="row">안내문 발신 정보</th>
                <td>
                  <div className="field-grid">
                    <input
                      type="text"
                      className="text-input"
                      value={senderOrg}
                      onChange={(e) => setSenderOrg(e.target.value)}
                      placeholder="기관명"
                      aria-label="기관명"
                    />
                    <input
                      type="text"
                      className="text-input"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="담당자"
                      aria-label="담당자"
                    />
                    <input
                      type="text"
                      className="text-input"
                      value={senderTel}
                      onChange={(e) => setSenderTel(e.target.value)}
                      placeholder="연락처"
                      aria-label="연락처"
                    />
                  </div>
                  <span className="hint">
                    안내문 맨 끝 줄에 그대로 들어갑니다. 비워 두면 기관명만 나옵니다. 담당자 본인
                    정보이며 아동 정보와 마찬가지로 저장하지 않습니다.
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!allPicked}
              onClick={() => {
                setShowResult(true);
                setActiveStep(2);
                /* 상태가 그려진 뒤에 옮겨 간다 */
                requestAnimationFrame(() =>
                  document.getElementById("step2")?.scrollIntoView({ behavior: "smooth" })
                );
              }}
            >
              결과 확인하기
            </button>
            {!allPicked && (
              <span className="hint">
                신청 상황 · 거주 지역 · 장애영역 · 학교급을 고르면 결과를 확인할 수 있습니다.
              </span>
            )}
          </div>
        </section>

        {/* ═══ 2단계 — 「결과 확인하기」를 누르기 전에는 나오지 않는다 ═══ */}
        {showResult && (
        <section className="section section-gray" id="step2">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h-lg">2. 결과 확인</h2>
              <span className="b-sm subtle right">입력 조건에 따라 결과가 실시간으로 변경됩니다</span>
            </div>

            <div className="summary-bar">
              <span className="sum-label">현재 조건</span>
              <span className="sum-item">{sheet.region.name}</span>
              <span className="sum-sep">|</span>
              <span className="sum-item">{sheet.disabilityLabel}</span>
              <span className="sum-sep">|</span>
              <span className="sum-item">{sheet.level.name}</span>
              {sheet.age !== null && (
                <>
                  <span className="sum-sep">|</span>
                  <span className="sum-item">만 {sheet.age}세</span>
                </>
              )}
              <a href="#step1" onClick={() => setActiveStep(1)}>
                조건 수정
              </a>
            </div>

            <div className="tint-card rel">
              <p className="tint-title">이번 상담에서 확인할 항목</p>
              <p className="tint-line">
                {sheet.region.name} · {sheet.disabilityLabel} · {sheet.level.name} ·{" "}
                {sheet.procedure.name}
              </p>
              <p className="tint-line">
                진단·평가 제출처 : {sheet.level.submitTo} · 결정 : {sheet.level.decider}
                {sheet.age !== null && ` · 만 ${sheet.age}세 (${sheet.ageBasis})`}
              </p>

              <div className="subcard-grid">
                <div className="subcard">
                  <span className="subcard-label">확인할 제도</span>
                  <p className="subcard-val">
                    {sheet.programs.length}
                    <span className="unit">건</span>
                  </p>
                  <span className="subcard-sub">교육청 {counts.education}건 포함</span>
                </div>
                <div className="subcard">
                  <span className="subcard-label">교육청 외 지원제도</span>
                  <p className="subcard-val">
                    {otherTrackCount}
                    <span className="unit">건</span>
                  </p>
                  <span className="subcard-sub">복지부·의료 — 별도 신청 필요</span>
                </div>
                <div className="subcard">
                  <span className="subcard-label">날짜가 있는 마감</span>
                  <p className="subcard-val">
                    {sheet.deadlines.length}
                    <span className="unit">개</span>
                  </p>
                  <span className="subcard-sub">그중 긴급 {urgentCount}개</span>
                </div>
                <div className="subcard subcard-alert">
                  <span className="subcard-label">확인이 필요한 항목</span>
                  <p className="subcard-val">
                    {sheet.warnings.length}
                    <span className="unit">건</span>
                  </p>
                  <span className="subcard-sub">아래 시트 맨 위에 표시</span>
                </div>
              </div>

              <div className="click-pill-row">
                <a href="#reference" className="click-pill">
                  이 숫자가 무슨 뜻인가요 →
                </a>
              </div>

              <div className="card-actions">
                <button type="button" className="card-action" onClick={() => window.print()}>
                  인쇄하기
                </button>
                <span className="divider" />
                <button type="button" className="card-action" onClick={copyLetter}>
                  {copied ? "복사했습니다" : "안내문 복사"}
                </button>
              </div>
            </div>

            {age9Date ? (
              <div className="tint-card rel">
                <p className="tint-title">발달지체 지원 종료 예정일</p>
                <p className="tint-status">{age9Date}</p>
                <p className="tint-note">
                  이 날짜까지 유지된 뒤 종료됩니다. 그 전에 재진단·재선정을 해야 방과후 교육활동과
                  치료지원이 끊기지 않습니다.
                </p>
                <div className="card-actions">
                  <a href="#deadlines" className="card-action">
                    마감일 전체 보기
                  </a>
                  <span className="divider" />
                  <a href="#step3" className="card-action">
                    안내문 확인
                  </a>
                </div>
              </div>
            ) : (
              firstUrgent && (
                <div className="tint-card">
                  <p className="tint-title">{firstUrgent.label}</p>
                  <p className="tint-status">기한 확인 필요</p>
                  <p className="tint-note">{firstUrgent.when}</p>
                  <div className="card-actions">
                    <a href="#deadlines" className="card-action">
                      마감일 전체 보기
                    </a>
                  </div>
                </div>
              )
            )}

            <div className="result-stack rel">

              <LetterPanel
                letter={shownLetter}
                isAi={Boolean(aiLetter)}
                aiStatus={aiStatus}
                aiError={aiError}
                copied={copied}
                onCopy={copyLetter}
                onRewrite={rewriteWithAi}
                onReset={resetLetter}
              />

              <StaffBrief
                documentsFirst={sheet.documentsFirst}
                urgentDeadlines={sheet.deadlines.filter((d) => d.urgent)}
                keyWarnings={sheet.keyWarnings}
              />

              <DetailPanel
                sheet={sheet}
                visible={visiblePrograms}
                counts={counts}
                viewMode={viewMode}
                trackFilter={trackFilter}
                onViewMode={setViewMode}
                onTrackFilter={setTrackFilter}
                lookup={{
                  regionId,
                  cache: lookupCache,
                  busy: lookupBusy,
                  error: lookupError,
                  onLookup: runLookup,
                }}
              />
            </div>
          </div>
        </section>
        )}

        <NoticeBoard />

        <Faq />

        <Reference regionId={regionId} />
      </main>

      <SiteFooter />
    </div>
  );
}