// 운영자 비밀값 확인 — 로그인·계정을 만들지 않는 대신 서버 환경변수 하나로 잠근다.
//
//  - /api/cron/sync : CRON_SECRET (Vercel Cron 이 같은 값을 붙여 보낸다)
//  - /api/review    : REVIEW_SECRET, 없으면 CRON_SECRET
//
// 값은 응답에 싣지 않는다. 틀렸을 때는 길이만 알려 어느 쪽이 잘렸는지 짐작하게 한다.

import { fail } from "./validate";

/** 대시보드에 붙여 넣을 때 따라온 공백 · 따옴표 · 줄바꿈은 값이 아니다 */
function clean(v: string | null | undefined): string {
  return v?.trim().replace(/^["']|["']$/g, "").trim() ?? "";
}

/** 맞으면 null, 아니면 돌려줄 오류 응답 */
export function checkBearer(request: Request, envNames: string[]): Response | null {
  const name = envNames.find((n) => clean(process.env[n]));
  const secret = name ? clean(process.env[name]) : "";
  if (!secret) return fail(`${envNames.join(" 또는 ")} 이 설정되지 않았습니다.`, 503);

  const header = request.headers.get("authorization");
  if (!header) return fail("권한이 없습니다. Authorization 헤더가 없습니다.", 401);
  const sent = clean(header.replace(/^\s*Bearer\s+/i, ""));
  if (sent !== secret) {
    return fail(`권한이 없습니다. 보낸 값(${sent.length}자)이 ${name}(${secret.length}자)과 다릅니다.`, 401);
  }
  return null;
}
