// 저녁 갱신 — /api/cron/sync 와 같은 일을 한다. Vercel Hobby 는 cron 하나당 하루 1번이라
// 12시 · 18시 두 번을 돌리려고 경로를 둘로 나눴다 (vercel.json). 비밀값 확인도 같다.
// 라우트 설정(runtime 등)은 다시 내보낼 수 없어 여기 직접 적는다.
export { GET } from "../sync/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
