// 한국사회보장정보원 「지자체복지서비스」 API (공공데이터포털 15108347).
// 복지로에 실린 시·도, 시·군·구 자체 복지사업을 받는다 — 「지역 자체사업 0건」을 채우는 출처.
//
// 설계 판단은 bokjiro.ts 와 같다.
//  - 서버에서만 부르고 키는 싣지 않는다. 보내는 것은 시도명·시군구명·코드·검색어뿐이다 (아동 조건 없음).
//  - 고르지 않는다. 목록을 모양만 맞춘다. 시트에 올릴지는 규칙과 담당자가 정한다.
//  - 하루 캐시. 개발계정 하루 1,000건 (공공데이터포털 상세).
//
// 명세: 공공데이터포털 상세 페이지의 swagger · 「지자체복지서비스_코드표(v1.0)」.
// 코드표의 생애주기·가구상황·관심주제 코드는 중앙부처복지서비스와 같다 (bokjiro.ts 의 표를 쓴다).

import { callDataGoKrXml, xmlBlocks as blocks, xmlField as field } from "./data-go-kr";
import type { HOUSEHOLD_CODES, LIFE_CODES, THEME_CODES } from "./bokjiro";

const BASE = "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations";
const LABEL = "지자체복지서비스";
const CACHE_TAG = "localwelfare";

export const LOCAL_WELFARE_SOURCE = {
  name: "한국사회보장정보원 「지자체복지서비스」",
  url: "https://www.data.go.kr/data/15108347/openapi.do",
} as const;

export type LocalService = {
  id: string;
  name: string;
  summary: string;
  /** 시도명 · 시군구명 — 원문 표기 그대로 */
  sido: string;
  sigungu: string;
  department: string;
  lifeCycle: string;
  household: string;
  themes: string;
  supportCycle: string;
  provisionType: string;
  applyMethod: string;
  detailUrl: string;
  lastModified: string;
  views: number;
};

export type LocalLink = { name: string; content: string };

export type LocalDetail = {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  department: string;
  summary: string;
  /** 시행 기간 — 끝난 사업을 걸러 낼 근거 */
  startDate: string;
  endDate: string;
  target: string;
  criteria: string;
  content: string;
  applyMethod: string;
  applyMethodDetail: string;
  supportCycle: string;
  provisionType: string;
  lastModified: string;
  contacts: LocalLink[];
  sites: LocalLink[];
  laws: LocalLink[];
  forms: LocalLink[];
};

/** 이 API 는 목록 이름이 중앙부처 쪽과 다르다 (wlfareInfoReldNm / wlfareInfoReldCn) */
function links(xml: string, tag: string): LocalLink[] {
  return blocks(xml, tag)
    .map((b) => ({ name: field(b, "wlfareInfoReldNm"), content: field(b, "wlfareInfoReldCn") }))
    .filter((x) => x.name || x.content);
}

function call(path: string, params: Record<string, string>) {
  return callDataGoKrXml(`${BASE}/${path}`, params, { label: LABEL, cacheTag: CACHE_TAG });
}

export type LocalListQuery = {
  /** 시도명 (예: 강원특별자치도). 표기가 원문과 달라 0건이면 화면이 알 수 있게 그대로 돌려준다 */
  sido?: string;
  sigungu?: string;
  q?: string;
  life?: keyof typeof LIFE_CODES;
  household?: keyof typeof HOUSEHOLD_CODES;
  theme?: keyof typeof THEME_CODES;
  perPage?: number;
};

export async function listLocalServices(query: LocalListQuery) {
  const params: Record<string, string> = {
    pageNo: "1",
    numOfRows: String(query.perPage ?? 50),
    arrgOrd: "002", // 인기순
  };
  if (query.sido) params.ctpvNm = query.sido;
  if (query.sigungu) params.sggNm = query.sigungu;
  if (query.q) {
    params.srchKeyCode = "001";
    params.searchWrd = query.q;
  }
  if (query.life) params.lifeArray = query.life;
  if (query.household) params.trgterIndvdlArray = query.household;
  if (query.theme) params.intrsThemaArray = query.theme;

  const xml = await call("LcgvWelfarelist", params);
  const items: LocalService[] = blocks(xml, "servList").map((b) => ({
    id: field(b, "servId"),
    name: field(b, "servNm"),
    summary: field(b, "servDgst"),
    sido: field(b, "ctpvNm"),
    sigungu: field(b, "sggNm"),
    department: field(b, "bizChrDeptNm"),
    lifeCycle: field(b, "lifeNmArray"),
    household: field(b, "trgterIndvdlNmArray"),
    themes: field(b, "intrsThemaNmArray"),
    supportCycle: field(b, "sprtCycNm"),
    provisionType: field(b, "srvPvsnNm"),
    applyMethod: field(b, "aplyMtdNm"),
    detailUrl: field(b, "servDtlLink"),
    lastModified: field(b, "lastModYmd"),
    views: Number(field(b, "inqNum")) || 0,
  }));
  return { total: Number(field(xml, "totalCount")) || items.length, items };
}

export async function getLocalService(id: string): Promise<LocalDetail | null> {
  const xml = await call("LcgvWelfaredetailed", { servId: id });
  const name = field(xml, "servNm");
  if (!name) return null;
  return {
    id: field(xml, "servId"),
    name,
    sido: field(xml, "ctpvNm"),
    sigungu: field(xml, "sggNm"),
    department: field(xml, "bizChrDeptNm"),
    summary: field(xml, "servDgst"),
    startDate: field(xml, "enfcBgngYmd"),
    endDate: field(xml, "enfcEndYmd"),
    target: field(xml, "sprtTrgtCn"),
    criteria: field(xml, "slctCritCn"),
    content: field(xml, "alwServCn"),
    applyMethod: field(xml, "aplyMtdNm"),
    applyMethodDetail: field(xml, "aplyMtdCn"),
    supportCycle: field(xml, "sprtCycNm"),
    provisionType: field(xml, "srvPvsnNm"),
    lastModified: field(xml, "lastModYmd"),
    contacts: links(xml, "inqplCtadrList"),
    sites: links(xml, "inqplHmpgReldList"),
    laws: links(xml, "baslawList"),
    forms: links(xml, "basfrmList"),
  };
}
