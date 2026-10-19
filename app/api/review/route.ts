// 데이터 갱신 파이프라인 2단계 — 검토 목록. 운영자 화면(/review)이 부른다.
//
//   GET  /api/review?status=pending|approved|rejected
//   POST /api/review  { action: "approve" | "reject", id, note? }
//   POST /api/review  { action: "document", regionId, title, url, note? }   교육청 문서 확인 올리기
//
// 헤더 Authorization: Bearer {REVIEW_SECRET} — 없으면 CRON_SECRET 으로 잠근다 (로그인·계정은 만들지 않는다).
// 아동 정보는 오가지 않는다. 제도 원문의 바뀐 칸과 운영자 메모뿐이다.

import { IMPLEMENTED_REGIONS, type RegionId } from "@/app/lib/data";
import { addDocumentCheck, decide, reviewOverview, type ReviewStatus } from "@/app/lib/review";
import { checkBearer } from "@/app/lib/secret";
import { supabaseConfigured } from "@/app/lib/supabase";
import { fail } from "@/app/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRETS = ["REVIEW_SECRET", "CRON_SECRET"];
const NO_STORE = { headers: { "Cache-Control": "no-store" } };
const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];
const MAX_NOTE = 500;
const MAX_TITLE = 80;

function guard(request: Request): Response | null {
  const denied = checkBearer(request, SECRETS);
  if (denied) return denied;
  if (!supabaseConfigured()) return fail("SUPABASE_URL · SUPABASE_SECRET_KEY 가 설정되지 않았습니다.", 503);
  return null;
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "검토 목록을 처리하지 못했습니다.";
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const status = (new URL(request.url).searchParams.get("status") ?? "pending") as ReviewStatus;
  if (!STATUSES.includes(status)) return fail(`status 는 ${STATUSES.join(" / ")} 중 하나입니다.`, 400);
  try {
    return Response.json(await reviewOverview(status), NO_STORE);
  } catch (e) {
    return fail(message(e), 502);
  }
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return fail("JSON 본문이 필요합니다.", 400);
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > MAX_NOTE) return fail(`메모는 ${MAX_NOTE}자까지입니다.`, 422);

  try {
    if (body.action === "approve" || body.action === "reject") {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id <= 0) return fail("id 가 올바르지 않습니다.", 422);
      const ok = await decide(id, body.action === "approve" ? "approved" : "rejected", note);
      if (!ok) return fail("해당 항목을 찾지 못했습니다.", 404);
      return Response.json({ ok: true }, NO_STORE);
    }

    if (body.action === "document") {
      const regionId = String(body.regionId ?? "") as RegionId;
      if (!IMPLEMENTED_REGIONS.some((r) => r.id === regionId)) {
        return fail(`regionId 는 ${IMPLEMENTED_REGIONS.map((r) => r.id).join(" / ")} 중 하나입니다.`, 422);
      }
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > MAX_TITLE) return fail(`문서 이름은 1~${MAX_TITLE}자입니다.`, 422);
      const url = typeof body.url === "string" ? body.url.trim() : "";
      let parsed: URL | null = null;
      try {
        parsed = new URL(url);
      } catch {
        parsed = null;
      }
      if (!parsed || parsed.protocol !== "https:" || url.length > 400) {
        return fail("문서 주소는 https:// 로 시작하는 400자 이내 주소여야 합니다.", 422);
      }
      await addDocumentCheck({ regionId, title, url, note });
      return Response.json({ ok: true }, NO_STORE);
    }

    return fail("action 은 approve · reject · document 중 하나입니다.", 400);
  } catch (e) {
    return fail(message(e), 502);
  }
}
