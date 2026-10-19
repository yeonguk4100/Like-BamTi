// 배포 확인용. Vercel 에 올라간 뒤 이 주소만 열어 보면 된다.
//
// AI 키가 있는지는 true/false 로만 알린다. 키 값은 절대 응답에 넣지 않는다.
// 키가 없어도 화면과 규칙 계산은 그대로 동작한다. AI 버튼만 안내 메시지를 낸다.

import { BASE_DATE, PROGRAMS, REGIONS } from "@/app/lib/data";
import { lastSyncRun, pendingReviewCount, supabaseConfigured } from "@/app/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 마지막 동기화 — 「어젯밤 ○건 확인, ○건 바뀜」. Supabase 가 없거나 테이블이 아직 없으면 오류 문구만 */
async function pipeline() {
  if (!supabaseConfigured()) return { configured: false };
  try {
    const [lastRun, pendingReviews] = await Promise.all([lastSyncRun(), pendingReviewCount()]);
    return { configured: true, lastRun, pendingReviews };
  } catch (e) {
    return { configured: true, error: e instanceof Error ? e.message : "조회 실패" };
  }
}

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "복지그루",
      rules: {
        regions: REGIONS.length,
        programs: PROGRAMS.length,
        ageBaseDate: BASE_DATE,
      },
      ai: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
      },
      /* 공공서비스(혜택) 정보 API. 키 값은 넣지 않고 있는지만 알린다 */
      publicData: {
        configured: Boolean(process.env.DATA_GO_KR_KEY),
      },
      /* 데이터 갱신 파이프라인 (Supabase). 키 값은 넣지 않는다 */
      supabase: await pipeline(),
      cron: { configured: Boolean(process.env.CRON_SECRET) },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
