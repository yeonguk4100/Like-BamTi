"use client";

// 운영자 화면 — 데이터 갱신 파이프라인 2단계 (docs/데이터-갱신-파이프라인.md)
//
// 매일 cron 이 공식 원문을 다시 받아 바뀐 것을 검토 목록에 올린다. 여기서 사람이 보고 승인 · 반려한다.
//  - 승인은 「확인했다」는 기록이다. 상담 화면이 읽는 data.ts 는 사람이 고친다 (자동으로 덮지 않는다)
//  - 로그인 대신 운영자 비밀값(REVIEW_SECRET, 없으면 CRON_SECRET)으로 잠근다.
//    값은 이 탭의 sessionStorage 에만 둔다 — 탭을 닫으면 사라진다
//  - 아동 정보는 이 화면에 없다. 제도 원문과 운영자 메모뿐이다

import { useCallback, useEffect, useState } from "react";
import { IMPLEMENTED_REGIONS } from "../lib/data";
import type { ReviewItem, ReviewOverview, ReviewStatus } from "../lib/review";
import { REVIEW_FIELD_LABELS, REVIEW_SOURCE_LABELS, reviewOriginalUrl } from "../lib/screen";

const STORE_KEY = "bokjigru-review-secret";

const STATUS_TABS: { id: ReviewStatus; label: string }[] = [
  { id: "pending", label: "확인 대기" },
  { id: "approved", label: "승인" },
  { id: "rejected", label: "반려" },
];

const KIND_LABEL: Record<ReviewItem["kind"], string> = {
  changed: "원문이 바뀜",
  added: "새로 생김",
  document: "문서 확인",
};

function readSecret(): string {
  try {
    return sessionStorage.getItem(STORE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSecret(v: string) {
  try {
    if (v) sessionStorage.setItem(STORE_KEY, v);
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* 저장이 막힌 브라우저 — 이번 화면에서만 쓴다 */
  }
}

/** 한국 시간 「10월 19일 03:12」 */
function when(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default function ReviewPage() {
  const [secret, setSecret] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [data, setData] = useState<ReviewOverview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSecret(readSecret());
  }, []);

  const call = useCallback(
    async (init?: { method: string; body: unknown }) => {
      const res = await fetch(init ? "/api/review" : `/api/review?status=${status}`, {
        method: init?.method ?? "GET",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: init ? JSON.stringify(init.body) : undefined,
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        writeSecret("");
        setSecret("");
      }
      if (!res.ok) throw new Error(body.error || "요청에 실패했습니다.");
      return body;
    },
    [secret, status]
  );

  const load = useCallback(async () => {
    if (!secret) return;
    setBusy(true);
    setError("");
    try {
      setData((await call()) as ReviewOverview);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [call, secret]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await call({ method: "POST", body });
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
      return false;
    }
  }

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    writeSecret(v);
    setSecret(v);
    setDraft("");
  }

  function signOut() {
    writeSecret("");
    setSecret("");
    setData(null);
  }

  return (
    <>
      <header className="gnb">
        <div className="gnb-inner">
          <a href="/" className="logo">
            <span className="logo-mark">운영</span>
            <span className="logo-name">복지그루</span>
          </a>
          <nav className="gnb-menu" aria-label="운영 메뉴">
            <a href="/" className="gnb-link">
              상담 화면
            </a>
            {secret && (
              <button type="button" className="btn btn-outline btn-sm" onClick={signOut}>
                잠그기
              </button>
            )}
          </nav>
        </div>
      </header>

      <main id="main">
        <div className="page-head">
          <div className="page-head-inner rel">
            <h1 className="h-xl">공식 원문 검토</h1>
            <p className="lead">
              매일 새벽 공식 API 원문을 다시 받아 지난번과 비교합니다. 바뀐 것은 <strong>자동으로 반영하지 않고</strong>{" "}
              여기 올립니다. 승인은 「확인했다」는 기록이고, 상담 화면의 데이터는 승인을 보고 사람이 고칩니다.
            </p>
          </div>
        </div>

        <section className="section wrap">
          {!secret ? (
            <form className="review-lock" onSubmit={signIn}>
              <label className="sub-label" htmlFor="review-secret">
                운영자 비밀값
              </label>
              <p className="td-sub">Vercel 환경변수 REVIEW_SECRET (없으면 CRON_SECRET) 값입니다. 이 탭을 닫으면 지워집니다.</p>
              <div className="review-lock-row">
                <input
                  id="review-secret"
                  className="text-input"
                  type="password"
                  autoComplete="off"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  열기
                </button>
              </div>
              {error && <p className="review-error">{error}</p>}
            </form>
          ) : (
            <>
              {data && <SyncSummary data={data} />}

              <div className="chip-row review-tabs" role="tablist" aria-label="검토 상태">
                {STATUS_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={status === t.id}
                    className={`chip ${status === t.id ? "chip-on" : ""}`}
                    onClick={() => setStatus(t.id)}
                  >
                    {t.label}
                    {data ? ` ${data.counts[t.id]}` : ""}
                  </button>
                ))}
                <button type="button" className="btn btn-outline btn-sm right" onClick={load} disabled={busy}>
                  {busy ? "불러오는 중…" : "새로고침"}
                </button>
              </div>

              {error && <p className="review-error">{error}</p>}

              {data && data.items.length === 0 && (
                <p className="review-empty">
                  {status === "pending"
                    ? "확인할 것이 없습니다. 공식 원문이 지난번과 같습니다."
                    : "아직 없습니다."}
                </p>
              )}

              <ul className="review-list">
                {data?.items.map((item) => (
                  <ReviewCard
                    key={item.id}
                    item={item}
                    busy={busy}
                    onDecide={(action, note) => act({ action, id: item.id, note })}
                  />
                ))}
              </ul>

              <DocumentForm busy={busy} onSubmit={(body) => act({ action: "document", ...body })} />
            </>
          )}
        </section>
      </main>
    </>
  );
}

/* ─── 동기화 요약 — 「어젯밤 ○건 확인, ○건 바뀜」 ─── */

function SyncSummary({ data }: { data: ReviewOverview }) {
  const last = data.runs[0];
  const total = Object.values(data.snapshots).reduce((a, b) => a + b, 0);
  return (
    <div className="block">
      <h2 className="block-title">원문 동기화</h2>
      {last ? (
        <p className="review-sync">
          마지막 확인 <strong>{when(last.finished_at)}</strong> ({last.trigger === "cron" ? "자동" : "수동"}) — 원문{" "}
          <strong>{last.checked}건</strong> 확인 · 바뀜 <strong>{last.changed}건</strong> · 새로 생김 {last.added}건
          {last.failed > 0 && <span className="review-error"> · 실패 {last.failed}건</span>}
        </p>
      ) : (
        <p className="review-sync">아직 동기화 기록이 없습니다.</p>
      )}
      <p className="td-sub">
        보관 중인 원문 {total}건 —{" "}
        {Object.entries(data.snapshots)
          .map(([s, n]) => `${REVIEW_SOURCE_LABELS[s] ?? s} ${n}`)
          .join(" · ")}
      </p>
      {data.runs.length > 1 && (
        <table className="tbl review-runs">
          <thead>
            <tr>
              <th scope="col">시각</th>
              <th scope="col">방식</th>
              <th scope="col">확인</th>
              <th scope="col">바뀜</th>
              <th scope="col">새로 생김</th>
              <th scope="col">실패</th>
            </tr>
          </thead>
          <tbody>
            {data.runs.map((r) => (
              <tr key={r.finished_at}>
                <td>{when(r.finished_at)}</td>
                <td>{r.trigger === "cron" ? "자동" : "수동"}</td>
                <td>{r.checked}</td>
                <td>{r.changed}</td>
                <td>{r.added}</td>
                <td>{r.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ─── 검토 카드 하나 ─── */

function ReviewCard({
  item,
  busy,
  onDecide,
}: {
  item: ReviewItem;
  busy: boolean;
  onDecide: (action: "approve" | "reject", note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState(item.reviewer_note);
  const original = item.doc_url || reviewOriginalUrl(item.source, item.service_id);

  return (
    <li className="review-card">
      <div className="review-card-head">
        <span className={`badge ${item.kind === "changed" ? "badge-danger" : "badge-primary"}`}>{KIND_LABEL[item.kind]}</span>
        <strong className="review-name">{item.name || item.service_id}</strong>
        <span className="td-sub right">{when(item.created_at)}</span>
      </div>
      <p className="td-sub">
        {REVIEW_SOURCE_LABELS[item.source] ?? item.source} · {item.service_id}
        {original && (
          <>
            {" · "}
            <a className="official-link" href={original} target="_blank" rel="noreferrer">
              원문 열기
            </a>
          </>
        )}
      </p>
      {item.ours && (
        <p className="review-ours">
          우리 데이터: <strong>{item.ours}</strong>
        </p>
      )}

      {item.changes.length > 0 && (
        <table className="tbl review-diff">
          <thead>
            <tr>
              <th scope="col">칸</th>
              {item.kind !== "document" && <th scope="col">전</th>}
              <th scope="col">{item.kind === "document" ? "내용" : "후"}</th>
            </tr>
          </thead>
          <tbody>
            {item.changes.map((c) => (
              <tr key={c.field}>
                <th scope="row">{REVIEW_FIELD_LABELS[c.field] ?? c.field}</th>
                {item.kind !== "document" && <td className="review-before">{c.before || "—"}</td>}
                <td className="review-after">{c.after || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {item.status === "pending" ? (
        <div className="review-act">
          <input
            className="text-input"
            placeholder="메모 (예: data.ts 금액 고침 · 표기만 바뀜)"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onDecide("approve", note)}>
              승인
            </button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => onDecide("reject", note)}>
              반려
            </button>
          </div>
        </div>
      ) : (
        <p className="td-sub">
          {item.status === "approved" ? "승인" : "반려"} {when(item.reviewed_at)}
          {item.reviewer_note && ` — ${item.reviewer_note}`}
        </p>
      )}
    </li>
  );
}

/* ─── 교육청 문서 확인 올리기 — API 가 없는 서식 번호 · 선정 절차 ─── */

function DocumentForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (body: { regionId: string; title: string; url: string; note: string }) => Promise<boolean>;
}) {
  const [regionId, setRegionId] = useState<string>(IMPLEMENTED_REGIONS[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await onSubmit({ regionId, title, url, note })) {
      setTitle("");
      setUrl("");
      setNote("");
    }
  }

  return (
    <details className="block review-doc">
      <summary className="block-title">교육청 문서 확인 올리기</summary>
      <p className="td-sub">
        서식 번호 · 선정 절차는 API 가 없어 교육청 게시판을 사람이 봅니다. 새 지침을 찾으면 여기 올려 검토 목록에 남깁니다.
      </p>
      <form className="review-doc-form" onSubmit={submit}>
        <label className="sub-label">
          교육청
          <select className="text-input" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {IMPLEMENTED_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.officeName}
              </option>
            ))}
          </select>
        </label>
        <label className="sub-label">
          문서 이름
          <input
            className="text-input"
            maxLength={80}
            placeholder="예: 2027 특수교육대상자 선정·배치 지침"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="sub-label">
          문서 주소
          <input className="text-input" type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label className="sub-label">
          바뀐 것
          <input
            className="text-input"
            maxLength={500}
            placeholder="예: 진단·평가 의뢰서 서식 2 → 서식 3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy || !title.trim() || !url.trim()}>
          검토 목록에 올리기
        </button>
      </form>
    </details>
  );
}
