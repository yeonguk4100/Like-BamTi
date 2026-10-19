// Supabase — 데이터 갱신 파이프라인의 저장소. SDK 대신 PostgREST 를 fetch 로 부른다 (새 의존성 없음).
//
//  - 서버에서만 쓴다. secret 키(sb_secret_… 또는 옛 service_role JWT)는 브라우저로 나가지 않는다.
//  - 테이블은 supabase/migrations 에 있다. RLS 를 켜고 정책을 두지 않아 secret 키로만 다룰 수 있다.
//  - 아동 정보는 이 파일을 지나가지 않는다. 제도 원문과 동기화 기록만 다룬다.
//  - 키가 없으면 configured() 가 false 이고, 부르는 쪽은 Supabase 없이 그대로 동작해야 한다.

export class SupabaseError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/** 대시보드에서 `…supabase.co/rest/v1/` 처럼 경로까지 복사해 넣어도 동작하게 주소의 앞부분만 쓴다 */
function origin(raw: string | undefined): string | undefined {
  const v = raw?.trim().replace(/^["']|["']$/g, "");
  if (!v) return undefined;
  try {
    return new URL(v).origin;
  } catch {
    return undefined;
  }
}

function env() {
  const url = origin(process.env.SUPABASE_URL);
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  return url && key ? { url, key } : null;
}

export function supabaseConfigured(): boolean {
  return env() !== null;
}

const TIMEOUT_MS = 8_000;

/**
 * PostgREST 한 번 부르기.
 * @param path `/rest/v1/` 뒤 — 예: `raw_snapshots?source=eq.gov24`
 */
export async function rest<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {}
): Promise<T> {
  const e = env();
  if (!e) throw new SupabaseError("SUPABASE_URL · SUPABASE_SECRET_KEY 가 설정되지 않았습니다.", 503);

  const headers: Record<string, string> = { apikey: e.key, "Content-Type": "application/json" };
  // 새 키(sb_secret_…)는 JWT 가 아니라 Authorization 에 넣으면 거절된다. 옛 JWT 키만 함께 보낸다
  if (e.key.startsWith("eyJ")) headers.Authorization = `Bearer ${e.key}`;
  if (init.prefer) headers.Prefer = init.prefer;

  let res: Response;
  try {
    res = await fetch(`${e.url}/rest/v1/${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new SupabaseError("Supabase 에 연결하지 못했습니다.", 504);
  }

  if (!res.ok) {
    // PostgREST 오류 본문에는 키가 없다. 테이블이 없을 때(마이그레이션 전) 알아보기 쉽게 메시지를 싣는다
    const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    throw new SupabaseError(`Supabase ${res.status}: ${body.message ?? ""}${body.code ? ` (${body.code})` : ""}`, 502);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* ─── 테이블 모양 ─── */

export type SnapshotSource = "bokjiro" | "gov24" | "local";

export type SnapshotRow = {
  source: SnapshotSource;
  service_id: string;
  name: string;
  hash: string;
  payload: unknown;
  source_updated: string;
  fetched_at: string;
  changed_at: string;
};

export type ReviewRow = {
  source: SnapshotSource;
  service_id: string;
  name: string;
  kind: "changed" | "added" | "document";
  old_hash: string | null;
  new_hash: string;
  changes: { field: string; before: string; after: string }[];
};

export type SyncRunRow = {
  started_at: string;
  trigger: "cron" | "manual";
  checked: number;
  added: number;
  changed: number;
  failed: number;
  by_source: Record<string, { checked: number; added: number; changed: number; failed: number }>;
  errors: { source: string; id: string; message: string }[];
};

/** 마지막으로 받아 둔 원문 하나. 없거나 Supabase 가 없으면 null — 부르는 쪽의 대체 경로라 오류를 내지 않는다 */
export async function getSnapshot(
  source: SnapshotSource,
  serviceId: string
): Promise<Pick<SnapshotRow, "payload" | "fetched_at"> | null> {
  if (!supabaseConfigured()) return null;
  try {
    const rows = await rest<Pick<SnapshotRow, "payload" | "fetched_at">[]>(
      `raw_snapshots?source=eq.${source}&service_id=eq.${encodeURIComponent(serviceId)}&select=payload,fetched_at&limit=1`
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** 가장 최근 동기화 한 번 — /api/health 가 「어젯밤 ○건 확인」을 보여준다 */
export async function lastSyncRun() {
  const rows = await rest<(SyncRunRow & { finished_at: string })[]>(
    "sync_runs?select=started_at,finished_at,trigger,checked,added,changed,failed&order=finished_at.desc&limit=1"
  );
  return rows[0] ?? null;
}

export async function pendingReviewCount(): Promise<number> {
  const rows = await rest<{ id: number }[]>("review_queue?status=eq.pending&select=id");
  return rows.length;
}
