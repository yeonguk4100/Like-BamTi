// 공공 복지서비스 정보를 실데이터로 받아 온다 — app/lib 의 API 모듈을 감싼 얇은 통로.
//
// 기본 출처는 한국사회보장정보원 「중앙부처복지서비스」(bokjiro.ts)다.
//   GET /api/welfare?q=발달재활                  서비스 이름 검색
//   GET /api/welfare?household=040&life=002     코드표로 찾기 (040 장애인 · 002 아동)
//   GET /api/welfare?id=WLF00000000             상세 · 근거법령 · 서식 · 신청 경로
//
// source=local 은 한국사회보장정보원 「지자체복지서비스」(localwelfare.ts) — 시·도, 시·군·구 자체사업.
//   GET /api/welfare?source=local&region=gangwon&household=040   지역 id 로 (REGIONS 의 이름을 쓴다)
//   GET /api/welfare?source=local&sido=강원특별자치도&sigungu=원주시
//   GET /api/welfare?source=local&id=서비스ID
//
// source=gov24 를 붙이면 행정안전부 「공공서비스(혜택) 정보」(gov24.ts)로 찾는다. 교육청 서비스도 들어 있다.
//   GET /api/welfare?source=gov24&q=발달재활
//   GET /api/welfare?source=gov24&q=특수교육&org=강원특별자치도교육청
//   GET /api/welfare?source=gov24&id=서비스ID
//
// 아동 조건은 받지 않는다. 검색어 · 코드표의 코드 · 서비스ID 만 받는다.
// 결과는 「확인용 원문」이다. 어떤 제도를 시트에 올릴지는 규칙이 정한다.
//
// 상세(id) 조회가 실패하면 Supabase 에 받아 둔 마지막 원문(raw_snapshots, 매일 cron 이 채운다)을 대신 낸다.
// 그때는 응답에 cached.fetchedAt 이 붙고, 화면은 「○월 ○일에 받아 둔 원문」이라고 밝힌다.

import {
  BOKJIRO_SOURCE,
  BokjiroError,
  HOUSEHOLD_CODES,
  LIFE_CODES,
  THEME_CODES,
  getServiceDetail,
  listServices,
} from "@/app/lib/bokjiro";
import { REGIONS } from "@/app/lib/data";
import { DataGoKrError } from "@/app/lib/data-go-kr";
import { GOV24_SOURCE, Gov24Error, getService, searchServices } from "@/app/lib/gov24";
import { LOCAL_WELFARE_SOURCE, getLocalService, listLocalServices } from "@/app/lib/localwelfare";
import { getSnapshot } from "@/app/lib/supabase";
import { fail } from "@/app/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_QUERY = 40;
const NO_STORE = { headers: { "Cache-Control": "no-store" } };
const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
/** 시도명·시군구명 — 한글과 공백만, 20자까지. 아동 정보가 섞일 자리가 아니다 */
const PLACE_PATTERN = /^[가-힣 ]{1,20}$/;

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
      const org = params.get("org")?.trim() ?? "";
      if (org && !PLACE_PATTERN.test(org)) return fail("org 는 한글 기관명이어야 합니다.", 400);
      if (!q && !id && !org) return fail("q, org, id 중 하나가 필요합니다.", 400);
      if (id) {
        const found = await getService(id);
        if (!found) return fail("해당 서비스ID 를 찾지 못했습니다.", 404);
        return Response.json({ source: GOV24_SOURCE, ...found }, NO_STORE);
      }
      return Response.json(
        { source: GOV24_SOURCE, query: { q: q || null, org: org || null }, ...(await searchServices(q, 50, org || undefined)) },
        NO_STORE
      );
    }

    if (source !== "bokjiro" && source !== "local") {
      return fail("source 는 bokjiro · local · gov24 중 하나입니다.", 400);
    }

    if (source === "local" && id) {
      const detail = await getLocalService(id);
      if (!detail) return fail("해당 서비스ID 를 찾지 못했습니다.", 404);
      return Response.json({ source: LOCAL_WELFARE_SOURCE, detail }, NO_STORE);
    }

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

    if (source === "local") {
      const regionId = params.get("region");
      const region = regionId ? REGIONS.find((r) => r.id === regionId) : undefined;
      if (regionId && !region) {
        return fail(`region 이 올바르지 않습니다. (${REGIONS.map((r) => r.id).join(" / ")})`, 400);
      }
      const sido = region?.name ?? params.get("sido")?.trim() ?? "";
      const sigungu = params.get("sigungu")?.trim() ?? "";
      if (sido && !PLACE_PATTERN.test(sido)) return fail("sido 는 한글 시도명이어야 합니다.", 400);
      if (sigungu && !PLACE_PATTERN.test(sigungu)) return fail("sigungu 는 한글 시군구명이어야 합니다.", 400);
      if (!sido && !sigungu && !q && !household.value && !life.value && !theme.value) {
        return fail("region, sido, sigungu, q, household, life, theme, id 중 하나 이상이 필요합니다.", 400);
      }
      const result = await listLocalServices({
        sido: sido || undefined,
        sigungu: sigungu || undefined,
        q: q || undefined,
        life: life.value,
        household: household.value,
        theme: theme.value,
      });
      return Response.json(
        {
          source: LOCAL_WELFARE_SOURCE,
          query: {
            sido: sido || null,
            sigungu: sigungu || null,
            q: q || null,
            household: household.value ? `${household.value} ${HOUSEHOLD_CODES[household.value]}` : null,
            life: life.value ? `${life.value} ${LIFE_CODES[life.value]}` : null,
            theme: theme.value ? `${theme.value} ${THEME_CODES[theme.value]}` : null,
          },
          ...result,
        },
        NO_STORE
      );
    }

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
    if (e instanceof DataGoKrError || e instanceof BokjiroError || e instanceof Gov24Error) {
      if (id && (source === "bokjiro" || source === "gov24")) {
        const snap = await getSnapshot(source, id);
        if (snap && snap.payload && typeof snap.payload === "object") {
          const { _content, ...payload } = snap.payload as Record<string, unknown>;
          void _content;
          return Response.json(
            {
              source: source === "gov24" ? GOV24_SOURCE : BOKJIRO_SOURCE,
              ...payload,
              cached: { fetchedAt: snap.fetched_at, reason: e.message },
            },
            NO_STORE
          );
        }
      }
      return fail(e.message, e.status);
    }
    return fail("공공 복지서비스 정보를 가져오지 못했습니다.", 500);
  }
}
