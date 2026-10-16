// 지역 자체사업 — 복지로(한국사회보장정보원 「지자체복지서비스」)에 등록된 시·도, 시·군 사업.
//
// 설계 판단
//  - 서버에는 시도 이름과 장애인 코드(040)만 보낸다. 시·군과 나이는 브라우저에서 거른다 —
//    상담 중인 아동의 거주 시·군이 서버로 나가지 않게 한다 (설계 원칙 2번).
//  - 규칙이 고른 목록이 아니다. 공식 등록 목록을 「확인할 후보」로 보여준다. 대상 여부는 담당자가 확인한다
//    (설계 원칙 1번). 그래서 안내문과 1면에는 넣지 않는다.
//  - 실패하거나 0건이어도 화면은 그대로다. 「조사할 곳」을 그대로 보여준다.

import { useEffect, useState } from "react";
import type { LocalService } from "../lib/localwelfare";

type State =
  | { status: "loading" }
  | { status: "ok"; items: LocalService[] }
  | { status: "error"; message: string };

/** 같은 화면에서 조건을 바꿔도 시도마다 한 번만 부른다 */
const memo = new Map<string, LocalService[]>();

/** 만 나이 → 복지로 생애주기 이름. 나이를 모르면 아동기 전체를 본다 */
function lifeLabels(age: number | null): string[] {
  if (age === null) return ["영유아", "아동", "청소년"];
  if (age <= 5) return ["영유아"];
  if (age <= 12) return ["아동"];
  return ["청소년"];
}

function ymd(s: string) {
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6)}` : s;
}

export function LocalPrograms({
  sido,
  sigungu,
  age,
  fallbackSources,
}: {
  sido: string;
  sigungu: string;
  age: number | null;
  /** 불러오지 못했을 때 보여줄 「조사할 곳」 */
  fallbackSources: string[];
}) {
  const [state, setState] = useState<State>(() =>
    memo.has(sido) ? { status: "ok", items: memo.get(sido)! } : { status: "loading" }
  );

  useEffect(() => {
    if (memo.has(sido)) {
      setState({ status: "ok", items: memo.get(sido)! });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    const q = new URLSearchParams({ source: "local", sido, household: "040" });
    fetch(`/api/welfare?${q}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(body.items)) {
          throw new Error(body.error || "지역 자체사업을 불러오지 못했습니다.");
        }
        memo.set(sido, body.items);
        if (!cancelled) setState({ status: "ok", items: body.items });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ status: "error", message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [sido]);

  const fallback = (
    <p className="hint" style={{ marginTop: 4 }}>
      {fallbackSources.length > 0 && "조사할 곳: "}
      {fallbackSources.join(" · ")}
    </p>
  );

  if (state.status === "loading") {
    return (
      <div className="fold-static">
        <p className="h-xs">{sido} 자체사업</p>
        <p className="hint">복지로에 등록된 지역 사업을 불러오는 중입니다…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="fold-static">
        <p className="h-xs">{sido} 자체사업</p>
        <p className="hint">{state.message}</p>
        {fallback}
      </div>
    );
  }

  const labels = lifeLabels(age);
  const forAge = state.items.filter(
    (x) => !x.lifeCycle || labels.some((l) => x.lifeCycle.includes(l))
  );
  const wholeSido = forAge.filter((x) => !x.sigungu);
  const mine = sigungu ? forAge.filter((x) => x.sigungu === sigungu) : [];
  const otherCount = forAge.length - wholeSido.length - mine.length;
  const shown = [...mine, ...wholeSido];

  return (
    <div className="fold-static local-programs">
      <p className="h-xs">
        {sigungu ? `${sigungu} · ${sido}` : sido} 자체사업 {shown.length}건
      </p>
      <p className="hint" style={{ marginTop: 4 }}>
        복지로에 등록된 지자체 사업 중 장애인 대상 · {labels.join("·")} 생애주기만 추렸습니다.{" "}
        <strong>규칙이 고른 목록이 아니므로 대상 여부는 확인이 필요합니다.</strong>
        {!sigungu && otherCount > 0 && ` 거주 시·군을 고르면 그 시·군 사업이 함께 나옵니다 (도 안 시·군 사업 ${otherCount}건).`}
      </p>

      {shown.length === 0 ? (
        fallback
      ) : (
        <ul className="local-list">
          {shown.map((x) => (
            <li key={x.id} className="local-item">
              <div className="local-head">
                <span className="badge">{x.sigungu || "도 전체"}</span>
                <span className="local-name">{x.name}</span>
              </div>
              {x.summary && <p className="local-summary">{x.summary}</p>}
              <p className="local-meta">
                {x.applyMethod && <span>신청 {x.applyMethod}</span>}
                {x.department && <span>{x.department}</span>}
                {x.lastModified && <span className="as-of">{ymd(x.lastModified)} 수정</span>}
                {x.detailUrl && (
                  <a className="official-link" href={x.detailUrl} target="_blank" rel="noreferrer">
                    복지로에서 보기
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="official-source">출처 — 한국사회보장정보원 「지자체복지서비스」 (복지로)</p>
    </div>
  );
}
