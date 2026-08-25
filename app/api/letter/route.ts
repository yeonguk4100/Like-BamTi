// 학부모용 안내문을 제미나이로 다시 쓴다.
//
// 설계 판단
//  - 규칙이 먼저다. 이 라우트는 조건만 받아 서버에서 buildSheet 를 돌리고,
//    그 결과만 제미나이에 넘긴다. 클라이언트가 보낸 문장을 그대로 AI 에 넘기지 않는다.
//    화면을 우회해 아무 내용이나 밀어 넣어도 안내문에 들어갈 수 없다.
//  - Google Search 를 쓰지 않는다. 규칙이 정확한 데이터를 넘겼으므로
//    검색은 오히려 오염원이다. 검색은 /api/lookup 이 담당한다.
//  - 생년월일·상세 메모·담당자 발신 정보는 제미나이에 보내지 않는다.
//    마감일 계산에만 쓰고 서버에서 잘라낸다. 화면을 믿지 않고 여기서 막는다.
//  - 실패하면 그냥 실패를 알린다. 화면은 규칙이 만든 템플릿 안내문을 그대로 유지한다.
//  - SDK 를 쓰지 않고 REST 를 fetch 로 부른다. 새 의존성이 없다.
//  - API 키는 헤더로만 보낸다. URL 에 넣으면 로그에 남는다.
//  - 요청 내용을 로그로 남기지 않는다 (설계 원칙 2번).

import {
  buildSheet,
  contactLines,
  officialLinkLines,
  TRACK_LABEL,
  type Sheet,
} from "@/app/lib/build-sheet";
import { fail, parseConditions, readJson } from "@/app/lib/validate";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 25_000;

export const runtime = "nodejs";
/**
 * 제미나이 응답을 25초까지 기다린다. Vercel 기본 한도가 더 짧아 maxDuration 을 명시한다.
 * gemini-3-flash-preview 는 추론(thought) 파트를 내는 모델이라 12초로는 자주 모자랐다.
 * TIMEOUT_MS 는 maxDuration 보다 반드시 작아야 한다 — 남는 시간에 응답을 만들어 돌려준다.
 */
export const maxDuration = 30;

const SYSTEM = `당신은 한국 특수교육지원센터 담당자를 돕는 문서 작성 보조입니다.
담당자가 학부모에게 그대로 건넬 안내문을 씁니다.

반드시 지킬 것
1. 입력에 있는 내용만 씁니다. 입력에 없는 제도·기관·날짜·서식 번호를 절대 만들지 않습니다.
2. 자격을 판정하지 않습니다. "받을 수 있습니다"가 아니라 "신청할 수 있습니다", "확인이 필요합니다"로 씁니다.
3. 날짜와 서식 번호와 기관 이름은 입력값을 글자 그대로 옮깁니다. 고치거나 줄이지 않습니다.
4. 초등학생도 이해할 문장으로, 존댓말로 씁니다. 한 문장을 짧게 끊습니다.
5. 전문용어를 쓸 때는 괄호로 쉬운 말을 덧붙입니다.
6. 교육청에 내는 것과 복지부(읍면동)에 내는 것을 반드시 나눠 적고, 각각 어디에 신청하는지 씁니다.
7. 마감일이 있으면 가장 먼저 적습니다.
8. 인사말로 시작합니다. 맨 끝의 문의 안내(기관명·담당자·연락처)는 쓰지 않습니다. 그 줄은 규칙이 뒤에 붙입니다.
9. 마크다운 기호(#, *, -, **)를 쓰지 않습니다. 번호와 「」 만 씁니다.
10. 전체 길이는 500자에서 900자 사이로 맞춥니다.

지키지 못할 정보가 있으면 그 부분을 쓰지 말고 넘어갑니다. 추측해서 채우지 않습니다.`;

type Part = { text?: string; thought?: boolean };

/**
 * 제미나이에 넘길 내용. 규칙 결과에서 필요한 칸만 골라 담는다.
 * 생년월일·상세 메모·발신 정보는 여기에 넣지 않는다.
 */
function promptPayload(sheet: Sheet) {
  return {
    지역: sheet.region.name,
    교육청: sheet.region.officeName,
    장애영역: sheet.disabilityLabel,
    학교급: sheet.level.name,
    제출처: sheet.level.submitTo,
    심사기구: sheet.level.committee,
    결정권자: sheet.level.decider,
    신청상황: sheet.procedure.name,
    상황설명: sheet.procedure.when,
    제출서류: sheet.documents.map((d) => `${d.label} [${d.formNo}]`),
    상황주의사항: sheet.procedure.notes,
    마감일: sheet.deadlines.map((d) => ({
      항목: d.label,
      기한: d.when,
      긴급: Boolean(d.urgent),
    })),
    확인할제도: sheet.programs.map((p) => ({
      이름: p.resolvedName,
      소관: TRACK_LABEL[p.track],
      신청처: p.resolvedApplyTo,
    })),
    확인이필요한항목: sheet.warnings.map((w) => ({ 제목: w.title, 내용: w.detail })),
  };
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return fail("GEMINI_API_KEY 가 설정되지 않았습니다.", 503);
  }

  // 모델 이름은 환경변수로 뺀다. models/ 접두어가 붙어 있어도 받아 준다.
  const model = (process.env.GEMINI_MODEL || "gemini-3-flash-preview").replace(/^models\//, "");

  const body = await readJson(request);
  if (!body.ok) return fail(body.error, 400);

  const parsed = parseConditions(body.value);
  if (!parsed.ok) return fail(parsed.error, 422);

  // 규칙이 먼저 계산한다. AI 는 이 결과를 문장으로 바꾸는 일만 한다.
  const sheet = buildSheet(parsed.value);

  const userText = [
    "아래는 규칙이 계산한 결과입니다. 이 내용만으로 학부모용 안내문을 쓰세요.",
    "",
    JSON.stringify(promptPayload(sheet), null, 2),
  ].join("\n");

  try {
    const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: `제미나이 응답 오류 (${res.status})`, detail: detail.slice(0, 400) },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await res.json();
    const parts: Part[] = data?.candidates?.[0]?.content?.parts ?? [];
    // 추론(thought) 파트는 본문이 아니므로 걸러낸다
    const letter = parts
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();

    if (!letter) {
      return Response.json(
        {
          error: "빈 응답이 왔습니다.",
          finishReason: data?.candidates?.[0]?.finishReason ?? null,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 담당자 발신 정보와 공식 안내 주소는 제미나이에 보내지 않았다.
    // 규칙이 만든 줄을 여기서 붙인다 — AI 가 주소를 고치거나 지어내지 못하게 한다.
    const linkLines = officialLinkLines(sheet.programs);
    const withContact = [
      letter,
      ...(linkLines.length > 0 ? ["", ...linkLines] : []),
      "",
      ...contactLines(sheet.region.officeName, parsed.value.sender),
    ].join("\n");

    return Response.json(
      { letter: withContact, model },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    const timedOut = message.includes("timed out") || message.includes("abort");
    return fail(timedOut ? `${TIMEOUT_MS / 1000}초 안에 응답이 오지 않았습니다.` : message, 504);
  }
}
