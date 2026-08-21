// 참고 자료 — 지역마다 다른 것들의 대조표.
//
// 「같은 지원인데 이름이 다르다」와 「같은 서류인데 번호가 다르다」가
// 이 도구가 있어야 하는 이유다. 그 근거 데이터를 그대로 낸다.
// verified 가 false 인 칸은 우리가 아직 확인하지 못한 칸이다. 숨기지 않는다.

import { FORM_LABEL, FORM_NO, REGIONS, type FormKey } from "@/app/lib/data";

export const runtime = "nodejs";
export const revalidate = 86400;

const FORM_KEYS = Object.keys(FORM_LABEL) as FormKey[];

export function GET() {
  return Response.json(
    {
      cards: REGIONS.map((r) => ({
        regionId: r.id,
        region: r.name,
        office: r.officeName,
        cardName: r.cardName,
        verified: r.cardVerified,
        source: r.cardSource ?? null,
      })),
      forms: FORM_KEYS.map((key) => ({
        key,
        label: FORM_LABEL[key],
        byRegion: Object.fromEntries(
          REGIONS.map((r) => [r.id, FORM_NO[r.id][key] ?? null])
        ),
      })),
      note:
        "서식 번호를 확인한 지역은 강원·경남 둘뿐입니다. null 은 확인하지 못한 칸이며, " +
        "추측해서 채우지 않았습니다.",
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=86400" } }
  );
}
