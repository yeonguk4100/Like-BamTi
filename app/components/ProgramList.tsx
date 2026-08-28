// 확인해야 할 제도 목록 — 소관별로 묶어 보거나 한꺼번에 볼 수 있다.
//
// 나이 조건으로 빠진 제도와 「자체사업 0건」을 숨기지 않고 보여준다.
// 무엇이 목록에 없는지 담당자가 알아야 하기 때문이다.
//
// children 은 「AI 빈칸 찾기」 패널이 들어가는 자리다 (LookupPanel).

import type { ReactNode } from "react";
import type { Track } from "../lib/data";
import { TRACK_LABEL, type ResolvedProgram, type Sheet } from "../lib/build-sheet";
import { TRACK_DESC, TRACK_ORDER, type TrackFilter, type ViewMode } from "../lib/screen";
import { ProgramItem } from "./ProgramItem";
import { ReadAloud } from "./ReadAloud";

export function ProgramList({
  sheet,
  visible,
  counts,
  viewMode,
  trackFilter,
  onViewMode,
  onTrackFilter,
  children,
}: {
  sheet: Sheet;
  visible: ResolvedProgram[];
  counts: Record<Track, number>;
  viewMode: ViewMode;
  trackFilter: TrackFilter;
  onViewMode: (v: ViewMode) => void;
  onTrackFilter: (v: TrackFilter) => void;
  children: ReactNode;
}) {
  return (
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
            onClick={() => onViewMode("grouped")}
          >
            소관별로 보기
          </button>
          <button
            type="button"
            className={`seg-btn ${viewMode === "all" ? "seg-on" : ""}`}
            aria-pressed={viewMode === "all"}
            onClick={() => onViewMode("all")}
          >
            한꺼번에 보기
          </button>
          {/* 전화 상담 중에 화면을 보며 그대로 읽는 보기. 안내문을 건넨 뒤에 오는 화면이다 */}
          <button
            type="button"
            className={`seg-btn ${viewMode === "readaloud" ? "seg-on" : ""}`}
            aria-pressed={viewMode === "readaloud"}
            onClick={() => onViewMode("readaloud")}
          >
            전화로 읽어 주기
          </button>
        </div>
        <button
          type="button"
          className={`chip chip-filter ${trackFilter === "all" ? "chip-on" : ""}`}
          onClick={() => onTrackFilter("all")}
        >
          전체 {sheet.programs.length}
        </button>
        {TRACK_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip chip-filter ${trackFilter === t ? "chip-on" : ""}`}
            onClick={() => onTrackFilter(t)}
            disabled={counts[t] === 0}
          >
            {TRACK_LABEL[t]} {counts[t]}
          </button>
        ))}
      </div>

      {trackFilter === "all" && viewMode === "all" && (
        <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
          교육청·복지부·의료가 섞여 있습니다. 이 목록이 한 화면에 있다는 것이 이 도구의
          핵심입니다.
        </p>
      )}

      {viewMode === "readaloud" ? (
        <ReadAloud programs={visible} office={sheet.region.eduContact} />
      ) : viewMode === "all"
        ? visible.map((p) => <ProgramItem key={p.id} program={p} />)
        : TRACK_ORDER.filter((t) => trackFilter === "all" || t === trackFilter).map(
            (t) => {
              const list = visible.filter((p) => p.track === t);
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

      {/* 「전화로 읽어 주기」는 스스로 빈 목록을 알린다 — 두 번 띄우지 않는다 */}
      {visible.length === 0 && viewMode !== "readaloud" && (
        <p className="hint">이 조건에 해당하는 제도가 없습니다.</p>
      )}

      {sheet.excludedByAge.length > 0 && (
        <details className="fold">
          <summary>
            나이 조건으로 목록에서 빠진 제도 {sheet.excludedByAge.length}건
          </summary>
          <ul className="notes">
            {sheet.excludedByAge.map((x, i) => (
              <li key={i}>
                {x.name} — {x.reason} (만 {sheet.age}세, {sheet.ageBasis})
              </li>
            ))}
          </ul>
          <p className="hint">
            나이 상한에는 재학 중 연장 같은 예외 규정이 있습니다. 해당 연도 사업안내를
            확인하세요.
          </p>
        </details>
      )}

      {!sheet.hasLocalPrograms && (
        <div className="fold-static">
          <p className="h-xs">{sheet.region.name} 자체사업 0건</p>
          <p className="hint" style={{ marginTop: 4 }}>
            위 목록은 전국 공통 제도입니다. 지자체·교육청 자체사업은 아직 등록되지
            않았습니다.
            {sheet.localSources.length > 0 && " 조사할 곳: "}
            {sheet.localSources.join(" · ")}
          </p>
        </div>
      )}

      {children}
    </div>
  );
}
