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
} from "./lib/data";
import { buildSheet, TRACK_LABEL } from "./lib/build-sheet";

const REPO_DOCS = "https://github.com/yeonguk4100/Like-BamTi/tree/main/docs";

export default function Home() {
  const [regionId, setRegionId] = useState<RegionId>("gangwon");
  const [disabilityId, setDisabilityId] = useState<DisabilityId>("autism");
  const [levelId, setLevelId] = useState<LevelId>("elementary");
  const [birthDate, setBirthDate] = useState("2019-03-14");
  const [currentServices, setCurrentServices] = useState<CurrentServiceId[]>(["localChildCenter"]);
  const [copied, setCopied] = useState(false);

  const sheet = useMemo(
    () => buildSheet({ regionId, disabilityId, levelId, birthDate, currentServices }),
    [regionId, disabilityId, levelId, birthDate, currentServices]
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
    <main className="page">
      <header className="hero">
        <div className="hero-top">
          <h1>너도나도 길잡이</h1>
          <span className="badge">데모 · 가상 데이터</span>
        </div>
        <p className="hero-sub">
          기관 담당자가 학부모 문의를 받았을 때, 조건을 입력하면{" "}
          <strong>확인해야 할 제도 · 마감일 · 준비 서류 · 근거</strong>를 한 장으로 정리하고,
          <strong> 학부모에게 그대로 건넬 안내문</strong>까지 함께 만듭니다.
        </p>
        <p className="privacy">
          🔒 이 도구는 <strong>개인정보를 저장하지 않습니다.</strong> 이름·연락처를 받지 않고,
          입력값은 화면 계산에만 쓰이며 어디에도 기록되지 않습니다. 아래 값은 전부 가상입니다.
        </p>
      </header>

      {/* ───────── 입력 ───────── */}
      <section className="panel input-panel">
        <h2 className="panel-title">1. 상담하면서 입력합니다</h2>
        <p className="panel-hint">상담 첫머리에 어차피 확인하는 정보만 받습니다.</p>

        <div className="input-grid">
          <div className="field field-wide">
            <span className="field-label">
              거주 지역 <em>바꿔 보세요 — 제도 이름이 달라집니다</em>
            </span>
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

          <label className="field">
            <span className="field-label">장애영역</span>
            <select value={disabilityId} onChange={(e) => setDisabilityId(e.target.value as DisabilityId)}>
              {DISABILITIES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">학교급</span>
            <select value={levelId} onChange={(e) => setLevelId(e.target.value as LevelId)}>
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">
              생년월일 <em>마감일 계산용</em>
            </span>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </label>

          <div className="field field-wide">
            <span className="field-label">현재 이용 중인 서비스</span>
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
        </div>
      </section>

      <p className="arrow">↓ 한 번 입력하면 두 장이 나옵니다</p>

      {/* ───────── 출력 ───────── */}
      <div className="output-grid">
        {/* ① 담당자용 */}
        <section className="panel sheet">
          <h2 className="panel-title">
            ① 담당자용 확인 시트
            <span className="who">{sheet.region.officeName}</span>
          </h2>

          {sheet.warnings.length > 0 && (
            <div className="block">
              <h3 className="block-title warn-title">⚠ 확인이 필요한 항목</h3>
              {sheet.warnings.map((w, i) => (
                <div key={i} className={`warn warn-${w.kind}`}>
                  <p className="warn-head">{w.title}</p>
                  <p className="warn-detail">{w.detail}</p>
                </div>
              ))}
            </div>
          )}

          <div className="block">
            <h3 className="block-title">📅 마감일</h3>
            <ul className="deadlines">
              {sheet.deadlines.map((d, i) => (
                <li key={i} className={d.urgent ? "urgent" : ""}>
                  <span className="dl-label">{d.label}</span>
                  <span className="dl-when">{d.when}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="block">
            <h3 className="block-title">🔬 이번 진단·평가에 들어가는 검사</h3>
            <ul className="tests">
              {sheet.disability.tests.map((t, i) => (
                <li key={i}>
                  <span className={`tag ${t.required ? "tag-req" : "tag-opt"}`}>
                    {t.required ? "필수" : "선택"}
                  </span>
                  <span className="test-label">{t.label}</span>
                  <span className="test-items">{t.items}</span>
                </li>
              ))}
            </ul>
            {sheet.disability.note && <p className="note">{sheet.disability.note}</p>}
          </div>

          <div className="block">
            <h3 className="block-title">📋 확인해야 할 제도</h3>
            {sheet.programs.map((p) => (
              <details key={p.id} className="program" open={p.id === "selection"}>
                <summary>
                  <span className={`track track-${p.track}`}>{TRACK_LABEL[p.track]}</span>
                  <span className="program-name">{p.resolvedName}</span>
                  {!p.verified && <span className="tag tag-demo">예시</span>}
                </summary>
                <div className="program-body">
                  <p className="program-summary">{p.summary}</p>
                  <dl>
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
                      {p.verified ? "✅ " : "⚠ 데모용 예시 — "}
                      {p.source}
                    </dd>
                  </dl>
                </div>
              </details>
            ))}
          </div>

          <p className="foot-note">
            이 시트는 <strong>자격을 판정하지 않습니다.</strong> 확인해야 할 항목과 근거만
            제시하며, 최종 판단은 담당자가 합니다.
          </p>
        </section>

        {/* ② 학부모용 */}
        <section className="panel letter">
          <h2 className="panel-title">
            ② 학부모용 안내문
            <button type="button" className="copy-btn" onClick={copyLetter}>
              {copied ? "복사했습니다" : "복사"}
            </button>
          </h2>
          <p className="panel-hint">출력해서 건네거나 문자로 보냅니다.</p>
          <pre className="letter-body">{sheet.parentLetter}</pre>
        </section>
      </div>

      <footer className="foot">
        <p>
          <strong>너도나도 길잡이</strong> — 멋쟁이사자처럼 Campus AX-Ton 강원대 · 팀 멋쟁이 밤티들
        </p>
        <p className="foot-sub">
          이름은 강원특별자치도교육청이 담당자에게 배포하는 「특수교육대상자 선정·배치 업무{" "}
          <strong>길잡이</strong>」에서 가져왔습니다. 담당자와 학부모가 같은 한 장을 본다는 뜻으로
          <strong> 너도나도</strong>를 붙였습니다.
        </p>
        <p className="foot-sub">
          절차·기한·카드 명칭은 강원·경남 교육청 지침 원문에서 확인했습니다. 그 밖의 금액·세부
          절차는 화면 구성을 보여주기 위한 <strong>예시</strong>입니다.
        </p>
        <p>
          <a href={REPO_DOCS} target="_blank" rel="noreferrer">
            기획서 전문 보기 →
          </a>
        </p>
      </footer>
    </main>
  );
}
