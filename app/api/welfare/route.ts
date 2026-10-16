// 공공 복지서비스 정보를 실데이터로 받아 온다 — app/lib 의 API 모듈을 감싼 얇은 통로.
//
// 기본 출처는 한국사회보장정보원 「중앙부처복지서비스」(bokjiro.ts)다.
//   GET /api/welfare?q=발달재활                  서비스 이름 검색
//   GET /api/welfare?household=040&life=002     코드표로 찾기 (040 장애인 · 002 아동)
//   GET /api/welfare?id=WLF00000000             상세 · 근거법령 · 서식 · 신청 경로
//
// source=gov24 를 붙이면 행정안전부 「공공서비스(혜택) 정보」(gov24.ts)로 찾는다.
//   GET /api/welfare?source=gov24&q=발달재활
//   GET /api/welfare?source=gov24&id=서비스ID
//
// 아동 조건은 받지 않는다. 검색어 · 코드표의 코드 · 서비스ID 만 받는다.
// 결과는 「확인용 원문」이다. 어떤 제도를 시트에 올릴지는 규칙이 정한다.

import {
  BOKJIRO_SOURCE,
  BokjiroError,
  HOUSEHOLD_CODES,
  LIFE_CODES,
  THEME_CODES,
  getServiceDetail,
  listServices,
} from "@/app/lib/bokjiro";
import { GOV24_SOURCE, Gov24Error, getService, searchServices } from "@/app/lib/gov24";
import { fail } from "@/app/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_QUERY = 40;
const NO_STORE = { headers: { "Cache-Control": "no-store" } };
const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

/** 코드표에 있는 코드만 통과시킨다 */
function code<T extends Record<string, string>>(
  value: string | null,
  table: T,
  name: string
): { ok: true; value?: keyof T & string } | { ok: false; error: string } {
  if (!value) return { ok: true };
  if (value in table) return { ok: true, value: value as keyof T & string };
  return { ok: false, error: `${name} 코드가 올바르지 않습니다. (${Object.keys(table).join(" / ")})` };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get("source") ?? "bokjiro";
  const q = params.get("q")?.trim() ?? "";
  const id = params.get("id")?.trim() ?? "";

  if (q.length > MAX_QUERY) return fail(`q 는 ${MAX_QUERY}자까지입니다.`, 400);
  if (id && !ID_PATTERN.test(id)) return fail("id 형식이 올바르지 않습니다.", 400);

  try {
    if (source === "gov24") {
      if (!q && !id) return fail("q 또는 id 중 하나가 필요합니다.", 400);
      if (id) {
        const found = await getService(id);
        if (!found) return fail("해당 서비스ID 를 찾지 못했습니다.", 404);
        return Response.json({ source: GOV24_SOURCE, ...found }, NO_STORE);
      }
      return Response.json({ source: GOV24_SOURCE, query: q, ...(await searchServices(q)) }, NO_STORE);
    }

    if (source !== "bokjiro") return fail("source 는 bokjiro 또는 gov24 입니다.", 400);

    if (id) {
      const detail = await getServiceDetail(id);
      if (!detail) return fail("해당 서비스ID 를 찾지 못했습니다.", 404);
      return Response.json({ source: BOKJIRO_SOURCE, detail }, NO_STORE);
    }

    const life = code(params.get("life"), LIFE_CODES, "life");
    const household = code(params.get("household"), HOUSEHOLD_CODES, "household");
    const theme = code(params.get("theme"), THEME_CODES, "theme");
    if (!life.ok) return fail(life.error, 400);
    if (!household.ok) return fail(household.error, 400);
    if (!theme.ok) return fail(theme.error, 400);
    if (!q && !life.value && !household.value && !theme.value) {
      return fail("q, life, household, theme, id 중 하나 이상이 필요합니다.", 400);
    }

    const result = await listServices({
      q: q || undefined,
      life: life.value,
      household: household.value,
      theme: theme.value,
    });
    return Response.json({
      source: BOKJIRO_SOURCE,
      query: {
        q: q || null,
        life: life.value ? `${life.value} ${LIFE_CODES[life.value]}` : null,
        household: household.value ? `${household.value} ${HOUSEHOLD_CODES[household.value]}` : null,
        theme: theme.value ? `${theme.value} ${THEME_CODES[theme.value]}` : null,
      },
      ...result,
    }, NO_STORE);
  } catch (e) {
    if (e instanceof BokjiroError || e instanceof Gov24Error) return fail(e.message, e.status);
    return fail("공공 복지서비스 정보를 가져오지 못했습니다.", 500);
  }
}
