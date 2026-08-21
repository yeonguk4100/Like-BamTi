// 알림 마당 · 서식 자료실 · FAQ 데이터.
//
// 지금은 코드에 있는 값을 그대로 낸다. 공지와 파일 목록은 가상 데이터이므로
// 응답에 그렇다고 적어 둔다. 나중에 교육청 게시판을 읽어 오게 바꿀 자리다.

import { FAQ, FILES, NOTICES } from "@/app/lib/board";

export const runtime = "nodejs";
export const revalidate = 3600;

export function GET() {
  return Response.json(
    {
      notices: NOTICES,
      files: FILES,
      faq: FAQ,
      disclaimer:
        "notices 와 files 는 화면 구성을 위한 가상 데이터입니다. 실제 공지·파일이 아닙니다. " +
        "faq 는 강원·경남 교육청 지침 Q&A 에서 가져온 내용입니다.",
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600" } }
  );
}
