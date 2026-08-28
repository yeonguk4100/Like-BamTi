// 자세히 보기 — 학부모가 파고들 때만 연다.
//
// 기본 경로에서 빠져 있는 것이 요점이다. 담당자는 안내문을 건네고 끝내고,
// 학부모가 「검사는 뭘 해요?」처럼 자세히 물을 때만 여기를 연다.
// 그래서 우리 데이터 구조 순서가 아니라 「들어오는 질문」 순서로 배치했다.
// 상담 중에 여는 것이라 5초 안에 찾아야 한다.
//
// 지침 책자를 다시 뒤지지 않게 하는 것이 이 도구의 목적이므로,
// 정보를 없애지 않고 접어 둔다.

import type { ReactNode } from "react";
import type { Track } from "../lib/data";
import type { ResolvedProgram, Sheet } from "../lib/build-sheet";
import { alertClass, alertTag, type TrackFilter, type ViewMode } from "../lib/screen";
import { DeadlineTable } from "./DeadlineTable";
import { DocumentTable } from "./DocumentTable";
import { LookupPanel } from "./LookupPanel";
import { ProgramList } from "./ProgramList";
import { TestTable } from "./TestTable";

function Ask({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="faq">
      <summary>{q}</summary>
      <div className="faq-a">{children}</div>
    </details>
  );
}

export function DetailPanel({
  sheet,
  visible,
  counts,
  viewMode,
  trackFilter,
  onViewMode,
  onTrackFilter,
  lookup,
}: {
  sheet: Sheet;
  visible: ResolvedProgram[];
  counts: Record<Track, number>;
  viewMode: ViewMode;
  trackFilter: TrackFilter;
  onViewMode: (v: ViewMode) => void;
  onTrackFilter: (v: TrackFilter) => void;
  lookup: {
    regionId: Parameters<typeof LookupPanel>[0]["regionId"];
    cache: Parameters<typeof LookupPanel>[0]["cache"];
    busy: string;
    error: string;
    onLookup: (target: string) => void;
  };
}) {
  return (
    <details className="detail-fold">
      <summary>
        <span className="detail-fold-title">자세히 보기</span>
        <span className="detail-fold-hint">
          상세 정보 · {sheet.region.officeName} 기준
        </span>
      </summary>

      <div className="detail-fold-body">
        <Ask q="진단·평가 검사 항목">
          <TestTable disability={sheet.disability} detailNote={sheet.detailNote} hideTitle />
        </Ask>

        <Ask q="소요 기간 및 기한">
          <DeadlineTable
            deadlines={sheet.deadlines}
            urgentCount={sheet.deadlines.filter((d) => d.urgent).length}
            hideTitle
          />
        </Ask>

        <Ask q="서류별 발급처">
          <DocumentTable
            documents={sheet.documents}
            officeName={sheet.region.officeName}
            notes={sheet.procedure.notes}
            hideTitle
          />
        </Ask>

        <Ask q="신청 가능한 지원제도">
          <ProgramList
            sheet={sheet}
            visible={visible}
            counts={counts}
            viewMode={viewMode}
            trackFilter={trackFilter}
            onViewMode={onViewMode}
            onTrackFilter={onTrackFilter}
          >
            {/*
              「AI 빈칸 찾기」(LookupPanel)를 화면에서 내렸다.
              검색 붙은 호출의 제미나이 할당량이 따로 있어 소진되면 502 가 나는데,
              그 버튼이 화면에 있으면 눌러 보는 사람에게 오류만 보인다.
              라우트(app/api/lookup)와 컴포넌트는 그대로 두었으므로
              할당량을 확보하면 이 자리에 다시 넣기만 하면 된다.
            */}
          </ProgramList>
        </Ask>

        {sheet.generalNotes.length > 0 && (
          <Ask q="그 밖의 확인사항">
            {sheet.generalNotes.map((w, i) => (
              <div key={i} className={`alert ${alertClass(w.kind)}`}>
                <span className="alert-tag">{alertTag(w.kind)}</span>
                <p className="alert-title">{w.title}</p>
                <p className="alert-detail">{w.detail}</p>
              </div>
            ))}
          </Ask>
        )}

        <p className="panel-foot">
          이 시트는 자격을 판정하지 않습니다. 확인해야 할 항목과 근거만 제시하며, 최종 판단은
          담당자가 합니다.
        </p>
      </div>
    </details>
  );
}
