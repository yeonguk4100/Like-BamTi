// 데이터 갱신 파이프라인 1단계 — 감지 (docs/데이터-갱신-파이프라인.md)
//
// 하루 한 번 공식 API 를 다시 받아 지난번 원문과 해시로 비교한다.
//  - 처음 본 것   → raw_snapshots 에 기준으로 넣는다 (그 출처를 처음 도는 날이 아니면 검토 목록에도 올린다)
//  - 해시가 같음  → 받은 시각만 바꾼다
//  - 해시가 다름  → 원문을 새로 저장하고 review_queue 에 「바뀐 칸」과 함께 올린다
//
// **우리 데이터(data.ts)를 고치지 않는다.** 승인은 사람이 하고, 고치는 것도 사람이다 (설계 원칙 1번).
// 같은 날 두 번 돌아도 결과가 같다 — (출처, 서비스ID, 새 해시)가 같으면 검토 목록에 다시 올리지 않는다.
//
// 무엇을 보나 (강원·경남 기준, 하루 호출 수는 각 API 한도의 몇 % 안 된다)
//  - bokjiro : PROGRAMS 의 bokjiroId (복지 제도 원문)
//  - gov24   : byRegion 의 gov24Id (교육청 치료지원 · 방과후 · 통학 원문)
//  - local   : 구현 지역 시도의 장애인(040) 자체사업 목록
//
// 원문은 각 API 모듈의 하루 캐시를 거쳐 온다. 화면이 먼저 불러 둔 값이면 최대 하루 늦게 감지된다.

import { createHash } from "node:crypto";
import { getServiceDetail } from "./bokjiro";
import { IMPLEMENTED_REGIONS, LOCAL_PROGRAMS, PROGRAMS } from "./data";
import { getService } from "./gov24";
import { listLocalServices } from "./localwelfare";
import { rest, type ReviewRow, type SnapshotRow, type SnapshotSource, type SyncRunRow } from "./supabase";

/** 받아 온 원문 하나 */
type Fetched = {
  id: string;
  name: string;
  /** /api/welfare 가 내는 모양 그대로 — 공식 API 가 막혔을 때 이 값을 대신 보여준다 */
  payload: unknown;
  /** 해시에 넣을 것. 조회수 · 수정일시처럼 내용이 아닌 칸은 뺀다 */
  content: Record<string, unknown>;
  sourceUpdated: string;
};

type Collected = { items: Fetched[]; errors: { id: string; message: string }[] };

function message(e: unknown): string {
  return e instanceof Error ? e.message : "알 수 없는 오류";
}

/* ─── 무엇을 볼지 ─── */

export function trackedIds() {
  const all = [...PROGRAMS, ...LOCAL_PROGRAMS];
  const bokjiro = [...new Set(all.flatMap((p) => (p.bokjiroId ? [p.bokjiroId] : [])))];
  const gov24 = [
    ...new Set(
      all.flatMap((p) => [
        ...(p.gov24Id ? [p.gov24Id] : []),
        ...Object.values(p.byRegion ?? {}).flatMap((r) => (r?.gov24Id ? [r.gov24Id] : [])),
      ])
    ),
  ];
  const sido = IMPLEMENTED_REGIONS.map((r) => r.name);
  return { bokjiro, gov24, sido };
}

/* ─── 받아 오기 ─── */

async function settle(ids: string[], get: (id: string) => Promise<Fetched | null>): Promise<Collected> {
  const out: Collected = { items: [], errors: [] };
  const results = await Promise.allSettled(ids.map(get));
  results.forEach((r, i) => {
    if (r.status === "rejected") out.errors.push({ id: ids[i], message: message(r.reason) });
    else if (r.value) out.items.push(r.value);
    else out.errors.push({ id: ids[i], message: "원문에서 이 서비스ID 를 찾지 못했습니다." });
  });
  return out;
}

function collectBokjiro(ids: string[]) {
  return settle(ids, async (id) => {
    const detail = await getServiceDetail(id);
    if (!detail) return null;
    return { id, name: detail.name, payload: { detail }, content: detail, sourceUpdated: detail.baseYear };
  });
}

function collectGov24(ids: string[]) {
  return settle(ids, async (id) => {
    const found = await getService(id);
    if (!found) return null;
    const { updatedAt, ...rest } = found.detail;
    return {
      id,
      name: found.detail.name,
      payload: found,
      content: { ...rest, conditions: found.conditions },
      sourceUpdated: updatedAt,
    };
  });
}

async function collectLocal(sido: string[]): Promise<Collected> {
  const out: Collected = { items: [], errors: [] };
  for (const name of sido) {
    try {
      const { items } = await listLocalServices({ sido: name, household: "040" });
      for (const item of items) {
        const { views, lastModified, ...content } = item;
        void views;
        out.items.push({ id: item.id, name: item.name, payload: item, content, sourceUpdated: lastModified });
      }
    } catch (e) {
      out.errors.push({ id: name, message: message(e) });
    }
  }
  return out;
}

/* ─── 비교 ─── */

/** 키 순서와 상관없이 같은 내용이면 같은 문자열 */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

export function hashOf(content: unknown): string {
  return createHash("sha256").update(stable(content)).digest("hex");
}

const CLIP = 600;
function clip(s: string) {
  return s.length > CLIP ? `${s.slice(0, CLIP)}…` : s;
}
function show(v: unknown): string {
  return typeof v === "string" ? v : stable(v);
}

/** 맨 윗단 칸끼리 비교한다. 검토하는 사람이 「무엇이 바뀌었나」를 바로 보게 */
function diff(before: Record<string, unknown> | undefined, after: Record<string, unknown>) {
  if (!before) return [];
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return keys
    .filter((k) => stable(before[k]) !== stable(after[k]))
    .map((k) => ({ field: k, before: clip(show(before[k] ?? "")), after: clip(show(after[k] ?? "")) }));
}

type Tally = { checked: number; added: number; changed: number; failed: number };

/** 한 출처의 결과를 Supabase 에 반영한다 */
async function apply(source: SnapshotSource, got: Collected, now: string): Promise<Tally> {
  const tally: Tally = { checked: got.items.length, added: 0, changed: 0, failed: got.errors.length };
  if (got.items.length === 0) return tally;

  type Prev = Pick<SnapshotRow, "service_id" | "hash" | "payload" | "changed_at">;
  const prev = await rest<Prev[]>(`raw_snapshots?source=eq.${source}&select=service_id,hash,payload,changed_at`);
  const byId = new Map(prev.map((p) => [p.service_id, p]));
  const firstRun = prev.length === 0;

  const snapshots: SnapshotRow[] = [];
  const reviews: ReviewRow[] = [];

  for (const item of got.items) {
    const hash = hashOf(item.content);
    const old = byId.get(item.id);
    const same = old?.hash === hash;
    snapshots.push({
      source,
      service_id: item.id,
      name: item.name,
      hash,
      payload: { ...(item.payload as object), _content: item.content },
      source_updated: item.sourceUpdated,
      fetched_at: now,
      changed_at: same ? old!.changed_at : now,
    });
    if (same) continue;
    if (old) {
      tally.changed++;
      const before = (old.payload as { _content?: Record<string, unknown> })?._content;
      reviews.push({
        source,
        service_id: item.id,
        name: item.name,
        kind: "changed",
        old_hash: old.hash,
        new_hash: hash,
        changes: diff(before, item.content),
      });
    } else {
      tally.added++;
      if (!firstRun) {
        reviews.push({ source, service_id: item.id, name: item.name, kind: "added", old_hash: null, new_hash: hash, changes: [] });
      }
    }
  }

  await rest(`raw_snapshots?on_conflict=source,service_id`, {
    method: "POST",
    body: snapshots,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  if (reviews.length) {
    await rest(`review_queue?on_conflict=source,service_id,new_hash`, {
      method: "POST",
      body: reviews,
      prefer: "resolution=ignore-duplicates,return=minimal",
    });
  }
  return tally;
}

/* ─── 한 번 돌기 ─── */

export async function runSync(trigger: SyncRunRow["trigger"]) {
  const startedAt = new Date().toISOString();
  const { bokjiro, gov24, sido } = trackedIds();

  const [b, g, l] = await Promise.all([collectBokjiro(bokjiro), collectGov24(gov24), collectLocal(sido)]);
  const sets: [SnapshotSource, Collected][] = [
    ["bokjiro", b],
    ["gov24", g],
    ["local", l],
  ];

  const run: SyncRunRow = {
    started_at: startedAt,
    trigger,
    checked: 0,
    added: 0,
    changed: 0,
    failed: 0,
    by_source: {},
    errors: [],
  };

  for (const [source, got] of sets) {
    let tally: Tally;
    try {
      tally = await apply(source, got, startedAt);
    } catch (e) {
      tally = { checked: got.items.length, added: 0, changed: 0, failed: got.items.length + got.errors.length };
      run.errors.push({ source, id: "*", message: message(e) });
    }
    run.by_source[source] = tally;
    run.checked += tally.checked;
    run.added += tally.added;
    run.changed += tally.changed;
    run.failed += tally.failed;
    run.errors.push(...got.errors.map((e) => ({ source, ...e })));
  }

  await rest("sync_runs", { method: "POST", body: run, prefer: "return=minimal" });
  return run;
}
