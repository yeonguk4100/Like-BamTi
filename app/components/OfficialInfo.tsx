// 제도 카드 안의 「공식 정보」 칸 — 복지로(중앙부처복지서비스) 원문을 받아 보여준다.
//
// 설계 판단
//  - 카드를 펼쳤을 때만 부른다. 펼치지 않은 카드까지 부르면 하루 100건 한도를 빨리 쓴다.
//  - 보내는 것은 서비스ID 뿐이다. 아동 조건·생년월일은 이 요청에 없다 (설계 원칙 2번).
//  - 우리 데이터를 덮지 않는다. 위 표(우리가 확인한 값)와 나란히 두고 출처·기준연도를 붙인다.
//    둘이 다르면 담당자가 보고 판단한다 — 판정하지 않는다 (설계 원칙 1번).
//  - 실패해도 카드는 그대로다. 공식 정보 칸만 「불러오지 못했다」고 알린다.

import { useEffect, useRef, useState } from "react";
import type { BokjiroDetail } from "../lib/bokjiro";
import { APPLY_FLOW_STEPS, bokjiroPageUrl } from "../lib/screen";

type Loaded = { detail: BokjiroDetail; sourceName: string; updateCycle: string };
type State = { status: "idle" | "loading" } | { status: "ok"; data: Loaded } | { status: "error"; message: string };

/** 같은 화면에서 카드를 접었다 펴도 다시 부르지 않는다 */
const memo = new Map<string, Loaded>();

export function OfficialInfo({ servId, active }: { servId: string; active: boolean }) {
  const [state, setState] = useState<State>(() =>
    memo.has(servId) ? { status: "ok", data: memo.get(servId)! } : { status: "idle" }
  );

  /* 한 번만 부른다. 상태를 의존성에 넣으면 「불러오는 중」으로 바뀌는 순간 정리 함수가 돌아 결과를 버린다 */
  const started = useRef(memo.has(servId));

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let cancelled = false;
    setState({ status: "loading" });
    fetch(`/api/welfare?id=${encodeURIComponent(servId)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.detail) throw new Error(body.error || "공식 정보를 불러오지 못했습니다.");
        const data: Loaded = {
          detail: body.detail,
          sourceName: body.source?.name ?? "중앙부처복지서비스",
          updateCycle: body.source?.updateCycle ?? "",
        };
        memo.set(servId, data);
        if (!cancelled) setState({ status: "ok", data });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ status: "error", message: e.message });
      });
    return () => {
      cancelled = true;
      // 화면을 떠나 결과를 못 받았으면 다음에 다시 부를 수 있게 한다
      if (!memo.has(servId)) started.current = false;
    };
  }, [active, servId]);

  return (
    <section className="official" aria-live="polite">
      <header className="official-head">
        <span className="badge badge-primary">공식 정보</span>
        <span className="official-title">복지로 원문</span>
        <a className="official-link official-open" href={bokjiroPageUrl(servId)} target="_blank" rel="noreferrer">
          복지로에서 보기
        </a>
      </header>

      {(state.status === "idle" || state.status === "loading") && (
        <p className="td-sub">공식 정보를 불러오는 중입니다…</p>
      )}

      {state.status === "error" && (
        <p className="td-sub">
          {state.message} 위 표의 내용과 「복지로에서 보기」로 확인해 주세요.
        </p>
      )}

      {state.status === "ok" && <OfficialBody data={state.data} />}
    </section>
  );
}

function OfficialBody({ data }: { data: Loaded }) {
  const d = data.detail;
  const flow = APPLY_FLOW_STEPS.map(([key, label]) => {
    const hit = d.applyFlow.find((x) => x.name === key);
    return hit ? { label, text: hit.link } : null;
  }).filter((x): x is { label: string; text: string } => x !== null);

  return (
    <>
      <table className="tbl official-tbl">
        <caption className="skip">{d.name} 공식 정보</caption>
        <tbody>
          {d.target && (
            <tr>
              <th scope="row" style={{ width: "24%" }}>
                지원 대상
              </th>
              <td className="official-text">{d.target}</td>
            </tr>
          )}
          {d.content && (
            <tr>
              <th scope="row">지원 내용</th>
              <td className="official-text">{d.content}</td>
            </tr>
          )}
          {flow.length > 0 && (
            <tr>
              <th scope="row">신청 경로</th>
              <td>
                <ol className="official-flow">
                  {flow.map((f) => (
                    <li key={f.label}>
                      <strong>{f.label}</strong> {f.text}
                    </li>
                  ))}
                </ol>
              </td>
            </tr>
          )}
          {d.forms.length > 0 && (
            <tr>
              <th scope="row">서식 내려받기</th>
              <td>
                <ul className="docs">
                  {d.forms.map((f) => (
                    <li key={f.link || f.name}>
                      {f.link ? (
                        <a className="official-link" href={f.link} target="_blank" rel="noreferrer">
                          {f.name}
                        </a>
                      ) : (
                        f.name
                      )}
                    </li>
                  ))}
                </ul>
                <span className="hint">학부모께 서식 위치로 안내합니다. 작성은 보호자가 합니다.</span>
              </td>
            </tr>
          )}
          {d.contacts.length > 0 && (
            <tr>
              <th scope="row">문의</th>
              <td>
                {d.contacts.map((c) => (
                  <p className="contact-line" key={c.name + c.link}>
                    {/^[\d-]+$/.test(c.link) ? (
                      <a className="official-link" href={`tel:${c.link}`}>
                        {c.link}
                      </a>
                    ) : (
                      c.link
                    )}{" "}
                    <span className="td-sub">{c.name}</span>
                  </p>
                ))}
              </td>
            </tr>
          )}
          {d.laws.length > 0 && (
            <tr>
              <th scope="row">근거법령</th>
              <td className="td-sub">{d.laws.map((l) => l.name).join(" · ")}</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="official-source">
        출처 — {data.sourceName}
        {d.ministry && ` · ${d.ministry}`}
        {d.baseYear && <span className="as-of">{d.baseYear}년 기준</span>}
        {data.updateCycle && <span className="as-of">원본 {data.updateCycle} 갱신</span>}
      </p>
    </>
  );
}
