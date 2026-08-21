// 우리 데이터베이스에 없는 칸을 제미나이가 웹에서 찾아본다.
//
// 설계 판단
//  - Google Search 를 쓴다. 여기가 검색이 필요한 유일한 자리다.
//  - 확정하지 않는다. 결과에는 늘 「확인 필요」가 붙고, 출처 URL 이 없으면
//    아예 결과를 내지 않는다. 근거 없는 답은 우리 원칙상 답이 아니다.
//  - 데이터베이스를 덮지 않는다. 화면에만 후보로 띄운다.
//  - 서식 번호처럼 hwp·pdf 안에 있는 값은 검색으로 찾을 수 없다.
//    그래서 「문서가 어디 있는지」를 찾게 목표를 잡았다.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 20_000;

const SYSTEM = `당신은 한국 특수교육 담당자를 돕는 조사 보조입니다.
웹 검색으로 확인할 수 있는 사실만 답합니다.

반드시 지킬 것
1. 검색으로 확인하지 못한 것은 "찾지 못했습니다"라고 답합니다. 추측해서 채우지 않습니다.
2. 확정 표현을 쓰지 않습니다. "○○입니다"가 아니라 "○○로 안내되어 있습니다", "확인이 필요합니다"로 씁니다.
3. 찾은 내용은 출처가 있는 것만 씁니다. 기억이나 추론으로 보태지 않습니다.
4. 금액·기한·나이 같은 숫자는 출처에 적힌 그대로만 옮기고, 없으면 쓰지 않습니다.
5. 한국어로, 짧게 씁니다. 항목마다 한두 문장.
6. 마크다운 기호(#, *, -, **)를 쓰지 않습니다. 번호와 「」 만 씁니다.
7. 전체 400자 이내로 씁니다.`;

const TARGETS: Record<string, (region: string, office: string) => string> = {
  guide: (region, office) =>
    `${office}의 「특수교육대상자 선정·배치」 업무 지침 또는 안내 문서가 어디에 공개되어 있는지 찾아 주세요. ` +
    `문서 이름과 게시된 위치(어느 기관 홈페이지의 어느 게시판인지)를 알려 주세요. ` +
    `최신 연도 자료가 있으면 연도도 적어 주세요.`,
  card: (region, office) =>
    `${office}가 특수교육대상자에게 치료지원비 또는 방과후활동비를 지급하는 바우처 카드의 ` +
    `정식 명칭과 공식 안내 페이지를 찾아 주세요. 지원 범위와 신청 방법이 안내되어 있으면 함께 적어 주세요.`,
  local: (region, office) =>
    `${region}의 지방자치단체가 장애아동·특수교육대상 아동에게 제공하는 자체 지원사업을 찾아 주세요. ` +
    `국가 공통 제도(발달재활서비스, 장애아동수당 등)는 빼고, 그 지역에만 있는 사업만 알려 주세요. ` +
    `사업 이름과 신청처를 적어 주세요. 못 찾으면 찾지 못했다고 답해 주세요.`,
};

type Part = { text?: string; thought?: boolean };
type Chunk = { web?: { uri?: string; title?: string } };

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "GEMINI_API_KEY 가 설정되지 않았습니다." }, { status: 503 });
  }

  const model = (process.env.GEMINI_MODEL || "gemini-3-flash-preview").replace(/^models\//, "");

  let body: { target?: string; regionName?: string; officeName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const make = TARGETS[body.target ?? ""];
  if (!make || !body.regionName || !body.officeName) {
    return Response.json({ error: "찾을 항목이나 지역이 지정되지 않았습니다." }, { status: 400 });
  }

  try {
    const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          { role: "user", parts: [{ text: make(body.regionName, body.officeName) }] },
        ],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
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
    const candidate = data?.candidates?.[0];
    const parts: Part[] = candidate?.content?.parts ?? [];
    const answer = parts
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();

    const meta = candidate?.groundingMetadata ?? {};
    const chunks: Chunk[] = meta.groundingChunks ?? [];
    const sources = chunks
      .map((c) => ({ uri: c.web?.uri ?? "", title: c.web?.title ?? "" }))
      .filter((x) => x.uri);
    const queries: string[] = meta.webSearchQueries ?? [];

    // 근거가 없으면 답을 내지 않는다
    if (sources.length === 0) {
      return Response.json(
        {
          answer: null,
          sources: [],
          queries,
          note: "웹에서 근거를 찾지 못했습니다. 해당 교육청에 직접 문의해야 합니다.",
        },
        { status: 200 }
      );
    }

    return Response.json({ answer, sources, queries, model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    const timedOut = message.includes("timed out") || message.includes("abort");
    return Response.json(
      { error: timedOut ? "20초 안에 응답이 오지 않았습니다." : message },
      { status: 504 }
    );
  }
}
