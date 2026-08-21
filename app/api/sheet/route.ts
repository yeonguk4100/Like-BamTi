// 규칙 계산 — 백엔드의 본체.
//
// 조건을 받아 확인 시트 한 벌을 돌려준다. AI 는 관여하지 않는다.
//
// 설계 판단
//  - 같은 조건에는 늘 같은 결과가 나온다. 나이는 오늘 날짜가 아니라 BASE_DATE 로 센다.
//    담당자가 어제 뽑은 시트와 오늘 뽑은 시트가 달라지면 이 도구를 못 믿는다.
//  - 판정하지 않는다. programs 는 「확인할 목록」이고 자격 여부를 담지 않는다.
//  - 입력값을 저장하지 않는다. 로그도 남기지 않는다. 계산하고 돌려주면 끝이다.
//  - 화면(app/page.tsx)은 같은 모듈을 브라우저에서 직접 부른다. 그래서 화면 결과와
//    이 API 결과가 어긋날 수 없다. 이 라우트는 교육청 내부 시스템이 붙는 자리다.

import { buildSheet } from "@/app/lib/build-sheet";
import { fail, parseConditions, readJson } from "@/app/lib/validate";

export const runtime = "nodejs";
/** 순수 계산이라 외부 호출이 없다. 길게 잡을 이유가 없다 */
export const maxDuration = 10;

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return fail(body.error, 400);

  const parsed = parseConditions(body.value);
  if (!parsed.ok) return fail(parsed.error, 422);

  const sheet = buildSheet(parsed.value);

  return Response.json(
    {
      sheet,
      meta: {
        판정: "하지 않습니다. 확인해야 할 항목과 근거만 담습니다.",
        나이기준: sheet.ageBasis,
        저장: "요청 내용을 저장하거나 기록하지 않습니다.",
      },
    },
    {
      // 조건이 개인정보에 가까우므로 중간 캐시에 남기지 않는다
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function GET() {
  return fail("POST 로 조건을 보내 주세요. 선택지는 /api/options 에 있습니다.", 405);
}
