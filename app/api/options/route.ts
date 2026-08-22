// 조건 입력 칸의 선택지.
//
// 화면은 데이터 모듈을 직접 import 하므로 이 라우트를 쓰지 않는다.
// 밖에서 /api/sheet 를 부르려는 쪽이 「어떤 id 를 넣어야 하나」를 알아내는 자리다.

import {
  AGE_BASIS,
} from "@/app/lib/build-sheet";
import {
  BASE_DATE,
  BASE_SCHOOL_YEAR,
  CURRENT_SERVICES,
  DISABILITIES,
  LEVELS,
  PROCEDURES,
  REGIONS,
} from "@/app/lib/data";

export const runtime = "nodejs";
/** 코드에 박힌 값이라 하루 동안 캐시해도 안전하다 */
export const revalidate = 86400;

export function GET() {
  return Response.json(
    {
      // implemented 가 false 인 지역은 대조만 했고 /api/sheet 가 거부한다
      regions: REGIONS.map((r) => ({
        id: r.id,
        name: r.name,
        implemented: r.implemented,
        officeName: r.officeName,
        cardName: r.cardName,
        cardVerified: r.cardVerified,
        requestFormNo: r.requestFormNo,
      })),
      disabilities: DISABILITIES.map((d) => ({
        id: d.id,
        name: d.name,
        reselection: d.reselection ?? null,
        testCount: d.tests.length,
      })),
      levels: LEVELS.map((l) => ({
        id: l.id,
        name: l.name,
        submitTo: l.submitTo,
        committee: l.committee,
        decider: l.decider,
      })),
      procedures: PROCEDURES.map((p) => ({
        id: p.id,
        name: p.name,
        when: p.when,
        verified: p.verified,
      })),
      currentServices: CURRENT_SERVICES.map((s) => ({ id: s.id, name: s.name })),
      ageBasis: { baseDate: BASE_DATE, schoolYear: BASE_SCHOOL_YEAR, label: AGE_BASIS },
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=86400" } }
  );
}
