// 데이터 갱신 파이프라인 1단계 — Vercel Cron 이 하루 한 번 부른다 (vercel.json).
//
//   GET /api/cron/sync            Authorization: Bearer {CRON_SECRET}
//   GET /api/cron/sync?manual=1   같은 헤더로 손으로 한 번 돌릴 때 (기록에 manual 로 남는다)
//
// Vercel 은 CRON_SECRET 환경변수가 있으면 cron 호출에 그 값을 Bearer 로 붙인다.
// 그 값이 없거나 다르면 아무것도 하지 않는다 — 누구나 불러 하루 API 한도를 쓰게 두지 않는다.
// 결과에는 건수와 오류 메시지만 싣는다. 원문 · 키는 싣지 않는다.

import { supabaseConfigured } from "@/app/lib/supabase";
import { runSync } from "@/app/lib/sync";
import { fail } from "@/app/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return fail("CRON_SECRET 이 설정되지 않았습니다.", 503);
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return fail("권한이 없습니다.", 401);
  if (!supabaseConfigured()) return fail("SUPABASE_URL · SUPABASE_SECRET_KEY 가 설정되지 않았습니다.", 503);

  const manual = new URL(request.url).searchParams.get("manual") === "1";
  try {
    const run = await runSync(manual ? "manual" : "cron");
    return Response.json({ ok: true, ...run }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "동기화에 실패했습니다.", 500);
  }
}
