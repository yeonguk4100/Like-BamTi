// 학부모용 안내문을 제미나이로 다시 쓴다.
//
// 설계 판단
//  - Google Search 를 쓰지 않는다. 이미 규칙이 정확한 데이터를 넘겼으므로
//    검색은 오히려 오염원이다. 검색은 /api/lookup 이 담당한다.
//  - 실패하면 그냥 실패를 알린다. 화면은 템플릿 안내문을 그대로 유지한다.
//  - SDK 를 쓰지 않고 REST 를 fetch 로 부른다. 새 의존성이 없다.
//  - API 키는 헤더로만 보낸다. URL 에 넣으면 로그에 남는다.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 12_000;

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
8. 인사말로 시작하고, 끝에 문의 안내를 둡니다.
9. 마크다운 기호(#, *, -, **)를 쓰지 않습니다. 번호와 「」 만 씁니다.
10. 전체 길이는 500자에서 900자 사이로 맞춥니다.

지키지 못할 정보가 있으면 그 부분을 쓰지 말고 넘어갑니다. 추측해서 채우지 않습니다.`;

type Part = { text?: string; thought?: boolean };

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "GEMINI_API_KEY 가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  // 모델 이름은 환경변수로 뺀다. models/ 접두어가 붙어 있어도 받아 준다.
  const model = (process.env.GEMINI_MODEL || "gemini-3-flash-preview").replace(
    /^models\//,
    ""
  );

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const userText = [
    "아래는 규칙이 계산한 결과입니다. 이 내용만으로 학부모용 안내문을 쓰세요.",
    "",
    JSON.stringify(payload, null, 2),
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
        { status: 502 }
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
        { status: 502 }
      );
    }

    return Response.json({ letter, model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    const timedOut = message.includes("timed out") || message.includes("abort");
    return Response.json(
      { error: timedOut ? "12초 안에 응답이 오지 않았습니다." : message },
      { status: 504 }
    );
  }
}
