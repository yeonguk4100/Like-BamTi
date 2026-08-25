// 배포 확인용. Vercel 에 올라간 뒤 이 주소만 열어 보면 된다.
//
// AI 키가 있는지는 true/false 로만 알린다. 키 값은 절대 응답에 넣지 않는다.
// 키가 없어도 화면과 규칙 계산은 그대로 동작한다. AI 버튼만 안내 메시지를 낸다.

import { BASE_DATE, PROGRAMS, REGIONS } from "@/app/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
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
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
