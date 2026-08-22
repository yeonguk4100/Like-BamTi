// API 요청 본문 검증.
//
// 설계 판단
//  - 새 의존성을 넣지 않는다 (zod 없음). 검사할 값이 전부 닫힌 목록이라 손으로 충분하다.
//  - 모르는 값은 통과시키지 않는다. 화면이 아닌 곳에서 부르는 요청도 있기 때문이다.
//  - 검증만 한다. 입력값을 기록하거나 어디에도 남기지 않는다 (설계 원칙 2번).
//  - 자유 입력 칸은 길이를 자른다. 그 값은 안내문에 그대로 들어가므로 프롬프트가 길어지는 것을 막는다.

import {
  CURRENT_SERVICES,
  IMPLEMENTED_REGIONS,
  DISABILITIES,
  LEVELS,
  PROCEDURES,
  REGIONS,
  type CurrentServiceId,
  type DisabilityId,
  type LevelId,
  type ProcedureId,
  type RegionId,
} from "./data";
import type { Input } from "./build-sheet";

/** 자유 입력 칸의 최대 길이. 넘으면 자른다 */
const MAX_LABEL = 80;
const MAX_NOTE = 500;
const MAX_SENDER = 100;

/** 요청 본문 최대 크기 (바이트). 넘으면 읽지 않는다 */
const MAX_BODY_BYTES = 8_000;

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const REGION_IDS = REGIONS.map((r) => r.id);
const DISABILITY_IDS = DISABILITIES.map((d) => d.id);
const LEVEL_IDS = LEVELS.map((l) => l.id);
const PROCEDURE_IDS = PROCEDURES.map((p) => p.id);
const SERVICE_IDS = CURRENT_SERVICES.map((s) => s.id);

function pickId<T extends string>(raw: unknown, allowed: T[]): T | null {
  return typeof raw === "string" && (allowed as string[]).includes(raw) ? (raw as T) : null;
}

function clamp(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

/** yyyy-mm-dd 형식이면서 달력에 실제로 있는 날짜인지 */
function isRealDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1900 || y > 2200 || mo < 1 || mo > 12) return false;
  return d >= 1 && d <= new Date(y, mo, 0).getDate();
}

/** 요청 본문을 크기 제한 안에서 JSON 으로 읽는다 */
export async function readJson(request: Request): Promise<Parsed<unknown>> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return { ok: false, error: "요청 본문이 너무 큽니다." };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, error: "요청 본문을 읽지 못했습니다." };
  }
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, error: "요청 본문이 너무 큽니다." };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: "JSON 형식이 아닙니다." };
  }
}

/**
 * 상담 조건을 검증해 규칙 엔진이 받는 형태로 만든다.
 * 모르는 id 는 오류로 돌려보낸다. 임의로 기본값을 끼우면 담당자가 눈치채지 못한다.
 */
export function parseConditions(raw: unknown): Parsed<Input> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "조건 객체가 필요합니다." };
  }
  const body = raw as Record<string, unknown>;

  const regionId = pickId<RegionId>(body.regionId, REGION_IDS);
  if (!regionId) {
    return { ok: false, error: `regionId 가 올바르지 않습니다. (${REGION_IDS.join(" / ")})` };
  }
  // 대조만 한 지역으로 시트를 만들면 「서식 미확인」으로 가득한 반쯤 만든 결과가 나간다.
  // 지역별 명칭·서식 대조표는 /api/reference 에서 그대로 볼 수 있다.
  if (!IMPLEMENTED_REGIONS.some((r) => r.id === regionId)) {
    return {
      ok: false,
      error:
        `${regionId} 는 아직 구현되지 않았습니다. 지금 구현된 지역은 ` +
        `${IMPLEMENTED_REGIONS.map((r) => r.id).join(" / ")} 뿐입니다. ` +
        `지역별 명칭·서식 대조는 GET /api/reference 를 보세요.`,
    };
  }

  const disabilityId = pickId<DisabilityId>(body.disabilityId, DISABILITY_IDS);
  if (!disabilityId) {
    return {
      ok: false,
      error: `disabilityId 가 올바르지 않습니다. (${DISABILITY_IDS.join(" / ")})`,
    };
  }

  const levelId = pickId<LevelId>(body.levelId, LEVEL_IDS);
  if (!levelId) {
    return { ok: false, error: `levelId 가 올바르지 않습니다. (${LEVEL_IDS.join(" / ")})` };
  }

  // 신청 상황은 생략하면 「신규 선정」으로 본다. 문의의 대부분이 신규다.
  const procedureId =
    body.procedureId === undefined
      ? ("new" as ProcedureId)
      : pickId<ProcedureId>(body.procedureId, PROCEDURE_IDS);
  if (!procedureId) {
    return { ok: false, error: `procedureId 가 올바르지 않습니다. (${PROCEDURE_IDS.join(" / ")})` };
  }

  const birthDate = typeof body.birthDate === "string" ? body.birthDate : "";
  if (!isRealDate(birthDate)) {
    return { ok: false, error: "birthDate 는 실제로 있는 yyyy-mm-dd 날짜여야 합니다." };
  }

  const rawServices = body.currentServices;
  if (rawServices !== undefined && !Array.isArray(rawServices)) {
    return { ok: false, error: "currentServices 는 배열이어야 합니다." };
  }
  const currentServices: CurrentServiceId[] = [];
  for (const item of (rawServices ?? []) as unknown[]) {
    const id = pickId<CurrentServiceId>(item, SERVICE_IDS);
    if (!id) {
      return {
        ok: false,
        error: `currentServices 에 모르는 값이 있습니다. (${SERVICE_IDS.join(" / ")})`,
      };
    }
    if (!currentServices.includes(id)) currentServices.push(id);
  }

  const senderRaw =
    body.sender !== null && typeof body.sender === "object" && !Array.isArray(body.sender)
      ? (body.sender as Record<string, unknown>)
      : {};

  return {
    ok: true,
    value: {
      regionId,
      disabilityId,
      levelId,
      procedureId,
      birthDate,
      currentServices,
      otherDisabilityLabel: clamp(body.otherDisabilityLabel, MAX_LABEL),
      detailNote: clamp(body.detailNote, MAX_NOTE),
      sender: {
        org: clamp(senderRaw.org, MAX_SENDER),
        name: clamp(senderRaw.name, MAX_SENDER),
        tel: clamp(senderRaw.tel, MAX_SENDER),
      },
    },
  };
}

/** 오류 응답 한 가지 모양으로만 낸다 */
export function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}
