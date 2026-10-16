// 공공데이터포털(data.go.kr) 게이트웨이 공통 — bokjiro.ts · localwelfare.ts · gov24.ts 가 같이 쓴다.
//
//  - 인증키: 포털은 같은 키를 Encoding(%2B 등으로 바뀐 것)과 Decoding(원래 문자열) 두 모양으로 보여준다.
//    어느 쪽을 넣어도 동작하게 원래 문자열로 되돌린다. Encoding 키를 그대로 쓰면 주소에 넣을 때
//    한 번 더 인코딩되어 「등록되지 않은 서비스키」가 난다.
//  - XML 호출: apis.data.go.kr 게이트웨이 API(한국사회보장정보원 두 API)는 응답 모양·오류 코드가 같다.
//    키는 응답에도 오류 메시지에도 싣지 않는다. 하루 캐시하고, 오류가 나면 그 캐시를 비운다.
//  - XML 파서: 새 의존성을 넣지 않으려고 이 API들의 모양(중첩 1단, 속성 없음)만 다루는 작은 파서를 둔다.

import { revalidateTag } from "next/cache";

export function dataGoKrKey(): string | null {
  const raw = process.env.DATA_GO_KR_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!raw) return null;
  if (!/%[0-9A-Fa-f]{2}/.test(raw)) return raw;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/* ─── 오류 ─── */

/** 활용가이드 「OpenAPI 에러 코드」 — 두 API 가 같은 표를 쓴다 */
const RESULT_MESSAGES: Record<string, string> = {
  "10": "요청 파라미터가 잘못되었습니다.",
  "12": "해당 오픈API 서비스가 없거나 폐기되었습니다.",
  "20": "서비스 접근이 거부되었습니다. 활용신청 승인 여부를 확인하세요.",
  "22": "하루 요청 한도를 넘었습니다.",
  "30": "등록되지 않은 서비스키입니다. 활용신청 승인 직후라면 반영까지 기다려야 합니다.",
  "31": "활용기간이 만료되었습니다.",
};

export class DataGoKrError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/* ─── 작은 XML 파서 ─── */

export function decodeXml(s: string): string {
  return s
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    // 원문 HTML 에서 넘어온 이름 붙은 문자. XML 안에 &amp;times; 로 한 번 더 감싸여 오므로
    // &amp; 를 푼 다음에 풀어야 한다 (장애아동수당 소득인정액 식)
    .replace(/&times;/g, "×")
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ")
    // 원문 줄바꿈이 \r 하나로 온다. 브라우저는 \r 을 공백으로 그려서 소득 구간별 금액이 한 줄로 붙는다
    .replace(/\r\n?/g, "\n")
    .trim();
}

/** 첫 번째 <tag>값</tag> */
export function xmlField(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? decodeXml(m[1]) : "";
}

/** 모든 <tag>…</tag> 블록 */
export function xmlBlocks(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => m[1]);
}

/* ─── 호출 ─── */

const TIMEOUT_MS = 10_000;
const CACHE_SECONDS = 60 * 60 * 24;

/**
 * apis.data.go.kr XML API 한 번 부르기.
 * @param label 오류 메시지에 쓸 API 이름
 * @param cacheTag 오류가 나면 비울 캐시 태그. 포털은 오류도 200 으로 줄 때가 있어 하루 동안 오류가 남을 수 있다
 */
export async function callDataGoKrXml(
  url: string,
  params: Record<string, string>,
  { label, cacheTag }: { label: string; cacheTag: string }
): Promise<string> {
  const key = dataGoKrKey();
  if (!key) throw new DataGoKrError("DATA_GO_KR_KEY 가 설정되지 않았습니다.", 503);

  const u = new URL(url);
  // Decoding 키를 넣는다. URLSearchParams 가 한 번만 인코딩한다
  u.searchParams.set("serviceKey", key);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(u, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS, tags: [cacheTag] },
    });
  } catch {
    throw new DataGoKrError(`${label} API 에 연결하지 못했습니다.`, 504);
  }

  const xml = await res.text();

  // 게이트웨이 오류는 <cmmMsgHeader> 로, 서비스 오류는 <resultCode> 로 온다
  const code = xmlField(xml, "returnReasonCode") || xmlField(xml, "resultCode");
  const badCode = Boolean(code) && code !== "0" && code !== "00";
  if (badCode || !res.ok) revalidateTag(cacheTag);
  if (badCode) {
    throw new DataGoKrError(
      RESULT_MESSAGES[code] ?? `${label} API 오류 (코드 ${code})`,
      code === "22" ? 429 : 502
    );
  }
  if (!res.ok) {
    // 원문 본문은 싣지 않는다 — 요청 주소(키 포함)가 되돌아올 수 있다
    throw new DataGoKrError(`${label} API 가 ${res.status} 를 돌려주었습니다.`, 502);
  }
  return xml;
}
