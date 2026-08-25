// 우리 데이터에 없는 칸을 제미나이가 웹에서 찾아본다 (/api/lookup).
//
// 확정하지 않는다. 결과에는 늘 「확인 필요」 배지가 붙고, 출처 링크를 함께 보여준다.
// 데이터베이스를 덮지 않는다 — 화면에 후보로만 뜬다.

import type { RegionId } from "../lib/data";
import { LOOKUP_TARGETS, type LookupResult } from "../lib/screen";

export function LookupPanel({
  regionId,
  cache,
  busy,
  error,
  onLookup,
}: {
  regionId: RegionId;
  cache: Record<string, LookupResult>;
  busy: string;
  error: string;
  onLookup: (target: string) => void;
}) {
  return (
    <div className="fold-static">
      <p className="h-xs">지역 추가 지원사업 검색</p>
      <p className="hint" style={{ marginTop: 4, marginBottom: 12 }}>
        등록된 데이터에 없는 항목입니다. 웹 검색으로 후보와 출처를 함께
        제공합니다. <strong>확정된 정보가 아니므로 담당자 확인이 필요합니다.</strong>
      </p>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        {LOOKUP_TARGETS.map((t) => {
          const done = Boolean(cache[`${regionId}:${t.id}`]);
          return (
            <button
              key={t.id}
              type="button"
              className="chip chip-filter"
              onClick={() => onLookup(t.id)}
              disabled={Boolean(busy) || done}
              title={t.hint}
            >
              {busy === t.id
                ? "찾고 있습니다…"
                : done
                  ? `${t.label} ✓`
                  : t.label}
            </button>
          );
        })}
      </div>

      {error && <p className="ai-error">{error}</p>}

      {LOOKUP_TARGETS.map((t) => {
        const r = cache[`${regionId}:${t.id}`];
        if (!r) return null;
        return (
          <div key={t.id} className="lookup-result">
            <p className="lookup-head">
              <span className="badge badge-danger">AI가 찾음 · 확인 필요</span>{" "}
              {t.label}
            </p>
            {r.answer ? (
              <p className="lookup-answer">{r.answer}</p>
            ) : (
              <p className="hint" style={{ marginTop: 0 }}>
                {r.note ?? "찾지 못했습니다."}
              </p>
            )}
            {r.sources.length > 0 && (
              <ul className="lookup-sources">
                {r.sources.map((src, i) => (
                  <li key={i}>
                    <a href={src.uri} target="_blank" rel="noreferrer">
                      {src.title || src.uri}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {r.queries.length > 0 && (
              <p className="hint" style={{ marginTop: 4 }}>
                검색어: {r.queries.join(" · ")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
