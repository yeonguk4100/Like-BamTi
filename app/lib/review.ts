// 데이터 갱신 파이프라인 2단계 — 검토 목록 (docs/데이터-갱신-파이프라인.md 7장)
//
// cron 이 올린 「바뀐 원문」과 운영자가 직접 올린 「교육청 문서 확인」을 사람이 보고 승인 · 반려한다.
// **승인은 「확인했다」는 기록이다.** 화면이 읽는 data.ts 는 승인을 보고 사람이 고친다 —
// API 값이 우리 데이터를 자동으로 덮지 않는다 (판정하지 않는다 · 1면에는 확실한 것만).

import { randomUUID } from "node:crypto";
import { IMPLEMENTED_REGIONS, LOCAL_PROGRAMS, PROGRAMS, type RegionId } from "./data";
import { rest, type SnapshotSource } from "./supabase";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewItem = {
  id: number;
  created_at: string;
  source: SnapshotSource | "document";
  service_id: string;
  name: string;
  kind: "changed" | "added" | "document";
  changes: { field: string; before: string; after: string }[];
  status: ReviewStatus;
  reviewer_note: string;
  doc_url: string;
  reviewed_at: string | null;
  /** 이 원문이 우리 데이터의 어느 제도인지 — 승인 뒤 data.ts 에서 고칠 곳 */
  ours: string | null;
};

export type SyncRunSummary = {
  finished_at: string;
  trigger: string;
  checked: number;
  added: number;
  changed: number;
  failed: number;
};

export type ReviewOverview = {
  items: ReviewItem[];
  counts: Record<ReviewStatus, number>;
  runs: SyncRunSummary[];
  snapshots: Record<string, number>;
};

/** 서비스ID → 「치료지원 · 강원」 */
function ourPrograms(): Map<string, string> {
  const map = new Map<string, string>();
  const regionName = (id: string) => IMPLEMENTED_REGIONS.find((r) => r.id === id)?.name ?? id;
  for (const p of [...PROGRAMS, ...LOCAL_PROGRAMS]) {
    if (p.bokjiroId) map.set(`bokjiro:${p.bokjiroId}`, `${p.name} (data.ts · ${p.id})`);
    if (p.gov24Id) map.set(`gov24:${p.gov24Id}`, `${p.name} (data.ts · ${p.id})`);
    for (const [rid, r] of Object.entries(p.byRegion ?? {})) {
      if (r?.gov24Id) map.set(`gov24:${r.gov24Id}`, `${r.name ?? p.name} · ${regionName(rid)} (data.ts · ${p.id}.byRegion.${rid})`);
    }
  }
  return map;
}

const COLUMNS = "id,created_at,source,service_id,name,kind,changes,status,reviewer_note,doc_url,reviewed_at";

export async function reviewOverview(status: ReviewStatus): Promise<ReviewOverview> {
  const [items, all, runs, snaps] = await Promise.all([
    rest<Omit<ReviewItem, "ours">[]>(`review_queue?status=eq.${status}&select=${COLUMNS}&order=created_at.desc&limit=100`),
    rest<{ status: ReviewStatus }[]>("review_queue?select=status"),
    rest<SyncRunSummary[]>("sync_runs?select=finished_at,trigger,checked,added,changed,failed&order=finished_at.desc&limit=7"),
    rest<{ source: string }[]>("raw_snapshots?select=source"),
  ]);
  const ours = ourPrograms();
  const counts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of all) counts[r.status]++;
  const snapshots: Record<string, number> = {};
  for (const s of snaps) snapshots[s.source] = (snapshots[s.source] ?? 0) + 1;
  return {
    items: items.map((i) => ({ ...i, ours: ours.get(`${i.source}:${i.service_id}`) ?? null })),
    counts,
    runs,
    snapshots,
  };
}

export async function decide(id: number, status: Exclude<ReviewStatus, "pending">, note: string) {
  const rows = await rest<{ id: number }[]>(`review_queue?id=eq.${id}`, {
    method: "PATCH",
    body: { status, reviewer_note: note, reviewed_at: new Date().toISOString() },
    prefer: "return=representation",
  });
  return rows.length > 0;
}

/** 교육청 문서 확인 결과를 사람이 올린다 — API 가 없는 서식 번호 · 선정 절차 (파이프라인 3장 달력) */
export async function addDocumentCheck(input: { regionId: RegionId; title: string; url: string; note: string }) {
  const region = IMPLEMENTED_REGIONS.find((r) => r.id === input.regionId);
  await rest("review_queue", {
    method: "POST",
    body: {
      source: "document",
      service_id: `${input.regionId}:${new Date().toISOString().slice(0, 10)}`,
      name: `${region?.officeName ?? input.regionId} · ${input.title}`,
      kind: "document",
      new_hash: randomUUID(),
      changes: input.note ? [{ field: "memo", before: "", after: input.note }] : [],
      doc_url: input.url,
    },
    prefer: "return=minimal",
  });
}
