// 행정안전부 「대한민국 공공서비스(혜택) 정보」 API (공공데이터포털 15113968).
//
// 설계 판단
//  - 서버에서만 부른다. 인증키(DATA_GO_KR_KEY)는 응답에도 오류 메시지에도 넣지 않는다.
//  - 아동 조건을 보내지 않는다. 보내는 것은 서비스 이름 검색어와 서비스ID 뿐이다 (설계 원칙 2번).
//  - 고르지 않는다. 이 모듈은 공공 데이터를 받아 모양만 맞춘다. 어떤 제도를 보여줄지는
//    지금처럼 규칙(build-sheet)이 정한다 — 「규칙이 고르고, AI는 못 하는 것만 한다」.
//  - 하루 동안 캐시한다. 개발계정 한도가 하루 10,000건이고, 제도 정보는 하루 안에 잘 바뀌지 않는다.
//
// 필드 이름과 지원조건 코드는 swagger 문서 기준이다.
// https://infuser.odcloud.kr/api/stages/44436/api-docs

import { revalidateTag } from "next/cache";
import { dataGoKrKey } from "./data-go-kr";

const BASE = "https://api.odcloud.kr/api/gov24/v3";
const TIMEOUT_MS = 10_000;
const CACHE_SECONDS = 60 * 60 * 24;
/** 오류가 나면 이 태그의 캐시를 비운다. 포털은 오류도 200 으로 줄 때가 있어 하루 동안 오류가 남을 수 있다 */
const CACHE_TAG = "gov24";

/** 응답에 함께 실어 출처를 밝힌다 */
export const GOV24_SOURCE = {
  name: "행정안전부 「대한민국 공공서비스(혜택) 정보」",
  url: "https://www.data.go.kr/data/15113968/openapi.do",
} as const;

export class Gov24Error extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

type Page<T> = {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  data: T[];
};

type RawListItem = Record<string, string | number | null | undefined>;

/** 공공 API 의 한글 필드를 화면과 규칙이 쓰기 좋은 이름으로 옮긴다. 값은 바꾸지 않는다 */
export type Gov24Service = {
  id: string;
  name: string;
  summary: string;
  target: string;
  criteria: string;
  content: string;
  applyMethod: string;
  deadline: string;
  receiver: string;
  phone: string;
  org: string;
  orgType: string;
  field: string;
  detailUrl: string;
  updatedAt: string;
};

export type Gov24Detail = {
  id: string;
  name: string;
  purpose: string;
  target: string;
  criteria: string;
  content: string;
  applyMethod: string;
  deadline: string;
  /** 보호자가 준비할 서류. 원문 문자열 그대로 */
  documents: string;
  /** 담당 공무원이 행정정보 공동이용으로 확인하는 서류 */
  documentsCheckedByOfficial: string;
  documentsNeedConsent: string;
  receiver: string;
  contact: string;
  onlineUrl: string;
  org: string;
  laws: string;
  adminRules: string;
  localRules: string;
  updatedAt: string;
};

/** 지원조건 중 이 도구에 필요한 것만 */
export type Gov24Conditions = {
  /** JA0328 장애인 */
  disabled: boolean;
  /** JA0110 · JA0111 대상연령. 비어 있으면 null */
  ageFrom: number | null;
  ageTo: number | null;
  /** JA0317~JA0319 */
  students: { elementary: boolean; middle: boolean; high: boolean };
};

function text(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

function flag(v: unknown): boolean {
  return text(v).toUpperCase() === "Y";
}

function age(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(text(v));
  return Number.isFinite(n) && text(v) !== "" ? n : null;
}

async function call<T>(path: string, params: Record<string, string>): Promise<Page<T>> {
  const key = dataGoKrKey();
  if (!key) throw new Gov24Error("DATA_GO_KR_KEY 가 설정되지 않았습니다.", 503);

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      // 헤더 방식은 Decoding 키를 그대로 쓴다. 쿼리에 넣으면 인코딩 문제가 생긴다
      headers: { Authorization: `Infuser ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS, tags: [CACHE_TAG] },
    });
  } catch {
    throw new Gov24Error("공공서비스 정보 API 에 연결하지 못했습니다.", 504);
  }

  if (!res.ok) {
    revalidateTag(CACHE_TAG);
    // 원문 응답에 키가 섞여 돌아올 수 있어 본문은 싣지 않는다
    const hint =
      res.status === 401 || res.status === 403
        ? " 인증키가 아직 반영되지 않았거나 올바르지 않습니다."
        : "";
    throw new Gov24Error(`공공서비스 정보 API 가 ${res.status} 를 돌려주었습니다.${hint}`, 502);
  }

  return (await res.json()) as Page<T>;
}

/**
 * 서비스 이름 · 소관기관명으로 찾는다. 검색어와 기관명 말고는 아무것도 보내지 않는다.
 * 소관기관명에 「강원특별자치도교육청」을 주면 그 교육청의 특수교육 서비스만 온다 —
 * 교육청 층(치료지원·통학비·방과후)이 이 API 에 들어 있다 (2026-10-16 실측).
 */
export async function searchServices(query: string, perPage = 50, org?: string) {
  const cond: Record<string, string> = {
    page: "1",
    perPage: String(perPage),
  };
  if (query) cond["cond[서비스명::LIKE]"] = query;
  if (org) cond["cond[소관기관명::LIKE]"] = org;
  const page = await call<RawListItem>("/serviceList", cond);
  const items: Gov24Service[] = page.data.map((r) => ({
    id: text(r["서비스ID"]),
    name: text(r["서비스명"]),
    summary: text(r["서비스목적요약"]),
    target: text(r["지원대상"]),
    criteria: text(r["선정기준"]),
    content: text(r["지원내용"]),
    applyMethod: text(r["신청방법"]),
    deadline: text(r["신청기한"]),
    receiver: text(r["접수기관"]),
    phone: text(r["전화문의"]),
    org: text(r["소관기관명"]),
    orgType: text(r["소관기관유형"]),
    field: text(r["서비스분야"]),
    detailUrl: text(r["상세조회URL"]),
    updatedAt: text(r["수정일시"]),
  }));
  return { total: page.matchCount ?? page.totalCount, items };
}

/** 한 서비스의 상세와 지원조건 */
export async function getService(id: string) {
  const [detailPage, condPage] = await Promise.all([
    call<RawListItem>("/serviceDetail", { page: "1", perPage: "1", "cond[서비스ID::EQ]": id }),
    call<RawListItem>("/supportConditions", { page: "1", perPage: "1", "cond[서비스ID::EQ]": id }),
  ]);

  const d = detailPage.data[0];
  if (!d) return null;
  const c = condPage.data[0];

  const detail: Gov24Detail = {
    id: text(d["서비스ID"]),
    name: text(d["서비스명"]),
    purpose: text(d["서비스목적"]),
    target: text(d["지원대상"]),
    criteria: text(d["선정기준"]),
    content: text(d["지원내용"]),
    applyMethod: text(d["신청방법"]),
    deadline: text(d["신청기한"]),
    documents: text(d["구비서류"]),
    documentsCheckedByOfficial: text(d["공무원확인구비서류"]),
    documentsNeedConsent: text(d["본인확인필요구비서류"]),
    receiver: text(d["접수기관명"]),
    contact: text(d["문의처"]),
    onlineUrl: text(d["온라인신청사이트URL"]),
    org: text(d["소관기관명"]),
    laws: text(d["법령"]),
    adminRules: text(d["행정규칙"]),
    localRules: text(d["자치법규"]),
    updatedAt: text(d["수정일시"]),
  };

  const conditions: Gov24Conditions | null = c
    ? {
        disabled: flag(c["JA0328"]),
        ageFrom: age(c["JA0110"]),
        ageTo: age(c["JA0111"]),
        students: {
          elementary: flag(c["JA0317"]),
          middle: flag(c["JA0318"]),
          high: flag(c["JA0319"]),
        },
      }
    : null;

  return { detail, conditions };
}
