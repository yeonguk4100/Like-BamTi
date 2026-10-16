// 한국사회보장정보원 「중앙부처복지서비스」 API (공공데이터포털 15090532).
// 복지로(bokjiro.go.kr)에 실린 중앙부처 복지서비스를 그대로 받는다.
//
// 설계 판단
//  - 서버에서만 부른다. 인증키(DATA_GO_KR_KEY)는 응답에도 오류 메시지에도 넣지 않는다.
//  - 아동 조건을 보내지 않는다. 보내는 것은 검색어와 코드표의 코드(생애주기·가구유형·관심주제)뿐이다.
//    생년월일이나 이름이 들어갈 자리가 없다 (설계 원칙 2번).
//  - 고르지 않는다. 받은 목록을 모양만 맞춘다. 시트에 무엇을 올릴지는 규칙(build-sheet)이 정한다.
//  - 하루 동안 캐시한다. 개발계정 한도가 하루 100건이고, 원본도 하루 1회 갱신된다 (활용가이드).
//  - 응답이 XML 뿐이다. 호출·오류·파서는 data-go-kr.ts 와 같이 쓴다.
//
// 명세 · 코드표: 「활용가이드_중앙부처복지서비스(v2.2)」(한국사회보장정보원, 2025.4)

import { DataGoKrError, callDataGoKrXml, xmlBlocks as blocks, xmlField as field } from "./data-go-kr";

const BASE = "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001";
const LABEL = "중앙부처복지서비스";
const CACHE_TAG = "bokjiro";

export const BOKJIRO_SOURCE = {
  name: "한국사회보장정보원 「중앙부처복지서비스」",
  url: "https://www.data.go.kr/data/15090532/openapi.do",
  updateCycle: "일 1회",
} as const;

/* ─── 코드표 (활용가이드) ─── */

export const LIFE_CODES = {
  "000": "구분없음(전생애)",
  "001": "영유아",
  "002": "아동",
  "003": "청소년",
  "004": "청년",
  "005": "중장년",
  "006": "노년",
  "007": "임신 · 출산",
} as const;

export const HOUSEHOLD_CODES = {
  "010": "다문화·탈북민",
  "020": "다자녀",
  "030": "보훈대상자",
  "040": "장애인",
  "050": "저소득",
  "060": "한부모·조손",
} as const;

export const THEME_CODES = {
  "010": "신체건강",
  "020": "정신건강",
  "030": "생활지원",
  "040": "주거",
  "050": "일자리",
  "060": "문화·여가",
  "070": "안전·위기",
  "080": "임신·출산",
  "090": "보육",
  "100": "교육",
  "110": "입양·위탁",
  "120": "보호·돌봄",
  "130": "서민금융",
  "140": "법률",
  "150": "관계개선",
  "160": "에너지",
} as const;

/** 이전 이름. 라우트가 쓰던 이름을 그대로 둔다 */
export const BokjiroError = DataGoKrError;

/* ─── 응답 모양 ─── */

export type BokjiroService = {
  id: string;
  name: string;
  summary: string;
  ministry: string;
  department: string;
  lifeCycle: string;
  household: string;
  themes: string;
  supportCycle: string;
  provisionType: string;
  onlineApply: boolean;
  /** 복지로 상세 페이지 — 학부모가 열어 볼 공식 주소 */
  detailUrl: string;
  firstRegistered: string;
  views: number;
};

export type BokjiroLink = { name: string; link: string };

export type BokjiroDetail = {
  id: string;
  name: string;
  ministry: string;
  overview: string;
  target: string;
  criteria: string;
  content: string;
  baseYear: string;
  supportCycle: string;
  provisionType: string;
  lifeCycle: string;
  themes: string;
  /** 신청·조사·결정 기관 (servSeCode 070 복지사업전달체계) */
  applyFlow: BokjiroLink[];
  /** 문의처 (010) */
  contacts: BokjiroLink[];
  /** 관련 누리집 (020) */
  sites: BokjiroLink[];
  /** 근거법령 (030) */
  laws: BokjiroLink[];
  /** 서식·자료 (040) — 구비서류 양식이 여기 온다 */
  forms: BokjiroLink[];
};

function links(xml: string, tag: string): BokjiroLink[] {
  return blocks(xml, tag)
    .map((b) => ({ name: field(b, "servSeDetailNm"), link: field(b, "servSeDetailLink") }))
    .filter((x) => x.name || x.link);
}

/* ─── 호출 ─── */

function call(path: string, params: Record<string, string>): Promise<string> {
  return callDataGoKrXml(`${BASE}/${path}`, params, { label: LABEL, cacheTag: CACHE_TAG });
}

export type ListQuery = {
  /** 서비스 이름 검색어 (srchKeyCode 001 제목) */
  q?: string;
  life?: keyof typeof LIFE_CODES;
  household?: keyof typeof HOUSEHOLD_CODES;
  theme?: keyof typeof THEME_CODES;
  perPage?: number;
};

export async function listServices(query: ListQuery) {
  const params: Record<string, string> = {
    callTp: "L",
    pageNo: "1",
    numOfRows: String(query.perPage ?? 30),
    srchKeyCode: "001",
    orderBy: "popular",
  };
  if (query.q) params.searchWrd = query.q;
  if (query.life) params.lifeArray = query.life;
  if (query.household) params.trgterIndvdlArray = query.household;
  if (query.theme) params.intrsThemaArray = query.theme;

  const xml = await call("NationalWelfarelistV001", params);
  const items: BokjiroService[] = blocks(xml, "servList").map((b) => ({
    id: field(b, "servId"),
    name: field(b, "servNm"),
    summary: field(b, "servDgst"),
    ministry: field(b, "jurMnofNm"),
    department: field(b, "jurOrgNm"),
    lifeCycle: field(b, "lifeArray"),
    household: field(b, "trgterIndvdlArray"),
    themes: field(b, "intrsThemaArray"),
    supportCycle: field(b, "sprtCycNm"),
    provisionType: field(b, "srvPvsnNm"),
    onlineApply: field(b, "onapPsbltYn") === "Y",
    detailUrl: field(b, "servDtlLink"),
    firstRegistered: field(b, "svcfrstRegTs"),
    views: Number(field(b, "inqNum")) || 0,
  }));
  return { total: Number(field(xml, "totalCount")) || items.length, items };
}

export async function getServiceDetail(id: string): Promise<BokjiroDetail | null> {
  const xml = await call("NationalWelfaredetailedV001", { callTp: "D", servId: id });
  const name = field(xml, "servNm");
  if (!name) return null;

  // 서식·자료(040)는 활용가이드 예시에는 없지만 코드표에 있다. 목록 이름이 달라도 코드로 모은다
  const anyList = [...xml.matchAll(/<([a-zA-Z]+List)>([\s\S]*?)<\/\1>/g)].map((m) => m[2]);
  const forms = [
    ...links(xml, "basfrmList"),
    ...anyList
      .filter((b) => field(b, "servSeCode") === "040")
      .map((b) => ({ name: field(b, "servSeDetailNm"), link: field(b, "servSeDetailLink") })),
  ].filter((x, i, all) => all.findIndex((y) => y.name === x.name && y.link === x.link) === i);

  return {
    id: field(xml, "servId"),
    name,
    ministry: field(xml, "jurMnofNm"),
    overview: field(xml, "wlfareInfoOutlCn"),
    target: field(xml, "tgtrDtlCn"),
    criteria: field(xml, "slctCritCn"),
    content: field(xml, "alwServCn"),
    baseYear: field(xml, "crtrYr"),
    supportCycle: field(xml, "sprtCycNm"),
    provisionType: field(xml, "srvPvsnNm"),
    lifeCycle: field(xml, "lifeArray"),
    themes: field(xml, "intrsThemaArray"),
    applyFlow: links(xml, "applmetList"),
    contacts: links(xml, "inqplCtadrList"),
    sites: links(xml, "inqplHmpgReldList"),
    laws: links(xml, "baslawList"),
    forms,
  };
}
