// 제도 카드 안의 「공식 정보」 칸 — 공공 API 원문을 받아 보여준다.
//
// 출처는 둘이다.
//  - bokjiro : 한국사회보장정보원 「중앙부처복지서비스」 (복지로) — 전국 공통 복지 제도
//  - gov24   : 행정안전부 「공공서비스(혜택) 정보」 — 시도교육청 제도(치료지원 · 방과후 · 통학)의 지역 원문.
//              금액 · 구비서류 · 신청 기한이 그 교육청 기준으로 실려 있어, 교육청 카드에는 이쪽이 더 정확하다
//
// 설계 판단
//  - 카드를 펼쳤을 때만 부른다. 펼치지 않은 카드까지 부르면 하루 한도를 빨리 쓴다.
//  - 보내는 것은 서비스ID 뿐이다. 아동 조건·생년월일은 이 요청에 없다 (설계 원칙 2번).
//  - 우리 데이터를 덮지 않는다. 위 표(우리가 확인한 값)와 나란히 두고 출처·기준 시점을 붙인다.
//    둘이 다르면 담당자가 보고 판단한다 — 판정하지 않는다 (설계 원칙 1번).
//  - 실패해도 카드는 그대로다. 공식 정보 칸만 「불러오지 못했다」고 알린다.
//  - 공식 API 가 막히면 서버가 매일 받아 두는 마지막 원문(Supabase)을 대신 받는다. 그때는 받은 날짜를 밝힌다.

import { useEffect, useRef, useState } from "react";
import type { BokjiroDetail } from "../lib/bokjiro";
import type { Gov24Detail } from "../lib/gov24";
import { APPLY_FLOW_STEPS, bokjiroPageUrl, gov24PageUrl } from "../lib/screen";

export type OfficialSource = "bokjiro" | "gov24";

type Loaded = (
  | { kind: "bokjiro"; detail: BokjiroDetail; sourceName: string; updateCycle: string }
  | { kind: "gov24"; detail: Gov24Detail; sourceName: string }
) & { cachedAt?: string };
type State = { status: "idle" | "loading" } | { status: "ok"; data: Loaded } | { status: "error"; message: string };

const LABEL: Record<OfficialSource, { title: string; open: string; url: (id: string) => string }> = {
  bokjiro: { title: "복지로 원문", open: "복지로에서 보기", url: bokjiroPageUrl },
  gov24: { title: "교육청 원문 · 정부24", open: "정부24에서 보기", url: gov24PageUrl },
};

/** 같은 화면에서 카드를 접었다 펴도 다시 부르지 않는다 */
const memo = new Map<string, Loaded>();

export function OfficialInfo({
  source = "bokjiro",
  servId,
  active,
}: {
  source?: OfficialSource;
  servId: string;
  active: boolean;
}) {
  const key = `${source}:${servId}`;
  const [state, setState] = useState<State>(() =>
    memo.has(key) ? { status: "ok", data: memo.get(key)! } : { status: "idle" }
  );

  /* 한 번만 부른다. 상태를 의존성에 넣으면 「불러오는 중」으로 바뀌는 순간 정리 함수가 돌아 결과를 버린다 */
  const started = useRef(memo.has(key));

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let cancelled = false;
    setState({ status: "loading" });
    const q = new URLSearchParams({ id: servId });
    if (source === "gov24") q.set("source", "gov24");
    fetch(`/api/welfare?${q}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.detail) throw new Error(body.error || "공식 정보를 불러오지 못했습니다.");
        const cachedAt: string | undefined = body.cached?.fetchedAt;
        const data: Loaded =
          source === "gov24"
            ? { kind: "gov24", detail: body.detail, sourceName: body.source?.name ?? "공공서비스(혜택) 정보", cachedAt }
            : {
                kind: "bokjiro",
                detail: body.detail,
                sourceName: body.source?.name ?? "중앙부처복지서비스",
                updateCycle: body.source?.updateCycle ?? "",
                cachedAt,
              };
        memo.set(key, data);
        if (!cancelled) setState({ status: "ok", data });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ status: "error", message: e.message });
      });
    return () => {
      cancelled = true;
      // 화면을 떠나 결과를 못 받았으면 다음에 다시 부를 수 있게 한다
      if (!memo.has(key)) started.current = false;
    };
  }, [active, servId, source, key]);

  const label = LABEL[source];

  return (
    <section className="official" aria-live="polite">
      <header className="official-head">
        <span className="badge badge-primary">공식 정보</span>
        <span className="official-title">{label.title}</span>
        <a className="official-link official-open" href={label.url(servId)} target="_blank" rel="noreferrer">
          {label.open}
        </a>
      </header>

      {(state.status === "idle" || state.status === "loading") && (
        <p className="td-sub">공식 정보를 불러오는 중입니다…</p>
      )}

      {state.status === "error" && (
        <p className="td-sub">
          {state.message} 위 표의 내용과 「{label.open}」로 확인해 주세요.
        </p>
      )}

      {state.status === "ok" && state.data.cachedAt && (
        <p className="td-sub">
          지금 공식 API 연결이 늦어 <strong>{cachedDate(state.data.cachedAt)}</strong>에 받아 둔 원문을 보여 드립니다.
          최신 내용은 「{label.open}」로 확인해 주세요.
        </p>
      )}
      {state.status === "ok" && state.data.kind === "bokjiro" && <BokjiroBody data={state.data} />}
      {state.status === "ok" && state.data.kind === "gov24" && <Gov24Body data={state.data} />}
    </section>
  );
}

/* ─── 공통 조각 ─── */

/** 받아 둔 시각을 「10월 19일」로. 한국 시간 기준 */
function cachedDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "이전";
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" }).format(d);
}

function Row({ label, children, first }: { label: string; children: React.ReactNode; first?: boolean }) {
  return (
    <tr>
      <th scope="row" style={first ? { width: "24%" } : undefined}>
        {label}
      </th>
      {children}
    </tr>
  );
}

/** 「해당없음」 같은 빈 값은 줄을 만들지 않는다 */
function filled(v: string) {
  const t = v.trim();
  return t !== "" && !/^해당\s*없음$/.test(t);
}

/** 문자열 안의 전화번호를 눌러 걸 수 있게 */
function Phoneish({ text }: { text: string }) {
  const parts = text.split(/(\d{2,4}-\d{3,4}-\d{4}|\b1\d{2,3}(?:-\d{4})?\b)/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <a key={i} className="official-link" href={`tel:${p}`}>
            {p}
          </a>
        ) : (
          p
        )
      )}
    </>
  );
}

/* ─── 복지로 ─── */

function BokjiroBody({ data }: { data: Extract<Loaded, { kind: "bokjiro" }> }) {
  const d = data.detail;
  const flow = APPLY_FLOW_STEPS.map(([k, label]) => {
    const hit = d.applyFlow.find((x) => x.name === k);
    return hit ? { label, text: hit.link } : null;
  }).filter((x): x is { label: string; text: string } => x !== null);

  return (
    <>
      <table className="tbl official-tbl">
        <caption className="skip">{d.name} 공식 정보</caption>
        <tbody>
          {d.target && (
            <Row label="지원 대상" first>
              <td className="official-text">{d.target}</td>
            </Row>
          )}
          {d.content && (
            <Row label="지원 내용">
              <td className="official-text">{d.content}</td>
            </Row>
          )}
          {flow.length > 0 && (
            <Row label="신청 경로">
              <td>
                <ol className="official-flow">
                  {flow.map((f) => (
                    <li key={f.label}>
                      <strong>{f.label}</strong> {f.text}
                    </li>
                  ))}
                </ol>
              </td>
            </Row>
          )}
          {d.forms.length > 0 && (
            <Row label="서식 내려받기">
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
            </Row>
          )}
          {d.contacts.length > 0 && (
            <Row label="문의">
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
            </Row>
          )}
          {d.laws.length > 0 && (
            <Row label="근거법령">
              <td className="td-sub">{d.laws.map((l) => l.name).join(" · ")}</td>
            </Row>
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

/* ─── 행안부 공공서비스(혜택) — 교육청 원문 ─── */

function Gov24Body({ data }: { data: Extract<Loaded, { kind: "gov24" }> }) {
  const d = data.detail;
  const laws = d.laws.split("||").map((x) => x.trim()).filter(Boolean);
  /* 원문은 지원대상 문장을 지원내용 앞머리에 되풀이하는 경우가 있다 — 같으면 한 번만 보인다 */
  const content = d.target && d.content.startsWith(d.target) ? d.content.slice(d.target.length).trim() : d.content;

  return (
    <>
      <table className="tbl official-tbl">
        <caption className="skip">{d.name} 교육청 원문</caption>
        <tbody>
          {filled(d.target) && (
            <Row label="지원 대상" first>
              <td className="official-text">{d.target}</td>
            </Row>
          )}
          {filled(content) && (
            <Row label="지원 내용">
              <td className="official-text">{content}</td>
            </Row>
          )}
          {filled(d.applyMethod) && (
            <Row label="신청 방법">
              <td className="official-text">{d.applyMethod}</td>
            </Row>
          )}
          {filled(d.deadline) && (
            <Row label="신청 기한">
              <td className="official-text">{d.deadline}</td>
            </Row>
          )}
          {filled(d.documents) && (
            <Row label="구비서류">
              <td className="official-text">
                {d.documents}
                <span className="hint">학부모께 서류 목록으로 안내합니다. 작성·제출은 보호자가 합니다.</span>
              </td>
            </Row>
          )}
          {filled(d.contact) && (
            <Row label="문의">
              <td className="official-text">
                <Phoneish text={d.contact} />
              </td>
            </Row>
          )}
          {laws.length > 0 && (
            <Row label="근거법령">
              <td className="td-sub">{laws.join(" · ")}</td>
            </Row>
          )}
        </tbody>
      </table>
      <p className="official-source">
        출처 — {data.sourceName}
        {d.org && ` · ${d.org}`}
        {d.updatedAt && <span className="as-of">{d.updatedAt.slice(0, 10)} 수정</span>}
      </p>
    </>
  );
}
