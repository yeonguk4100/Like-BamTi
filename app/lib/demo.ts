// ⚠ 데모용 — 발표 후 이 파일을 지운다.
//
// 발표에서 조건을 빠르게 바꿔 보이기 위한 가상 사례다. 실제 아동 정보가 아니다.
// 한 파일에 모아 둔 이유는, 발표가 끝나면 이 파일을 지우고 page.tsx 의 import 한 줄만
// 지우면 끝나게 하려는 것이다.
//
// 같이 지울 것 — globals.css 의 .preset* · page.tsx 의 「데모 사례」 행

import type {
  CurrentServiceId,
  DisabilityId,
  LevelId,
  ProcedureId,
  RegionId,
} from "./data";

/* ⚠ 데모용 — 발표 후 삭제. 전부 가상 사례다. */
export type Preset = {
  id: string;
  label: string;
  note: string;
  regionId: RegionId;
  disabilityId: DisabilityId;
  levelId: LevelId;
  /** 생략하면 화면이 「신규 선정」을 유지한다 */
  procedureId?: ProcedureId;
  birthDate: string;
  currentServices: CurrentServiceId[];
};

export const PRESETS: Preset[] = [
  {
    id: "a",
    label: "강원 · 자폐성장애 · 취학 예정",
    note: "가장 흔한 문의",
    regionId: "gangwon",
    disabilityId: "autism",
    levelId: "elementary",
    birthDate: "2019-03-14",
    currentServices: ["localChildCenter"],
  },
  {
    id: "b",
    label: "강원 · 발달지체 · 취학 예정",
    note: "★ 만 9세에 두 부처가 같이 끝남",
    regionId: "gangwon",
    disabilityId: "developmentalDelay",
    levelId: "elementary",
    birthDate: "2019-03-14",
    currentServices: [],
  },
  {
    id: "c",
    label: "강원 · 자폐성 · 온종일교실 이용",
    note: "복지부 방과후활동과 중복 제한",
    regionId: "gangwon",
    disabilityId: "autism",
    levelId: "elementary",
    birthDate: "2019-03-14",
    currentServices: ["allDayClass"],
  },
  {
    id: "d",
    label: "강원 · 발달지체 · 유치원",
    note: "유치원 배치(처음학교로) 기한",
    regionId: "gangwon",
    disabilityId: "developmentalDelay",
    levelId: "kinder",
    birthDate: "2021-08-02",
    currentServices: [],
  },
  {
    id: "e",
    label: "경남 · 지적장애 · 초등",
    note: "★ 「장애등급 결정서」 경고",
    regionId: "gyeongnam",
    disabilityId: "intellectual",
    levelId: "elementary",
    birthDate: "2019-05-20",
    currentServices: [],
  },
  {
    id: "f",
    label: "강원 · 어린이집 · 자폐성",
    note: "★ 공문이 안 가서 누락됨",
    regionId: "gangwon",
    disabilityId: "autism",
    levelId: "daycare",
    birthDate: "2020-04-10",
    currentServices: [],
  },
  {
    id: "g",
    label: "강원 · 지적장애 · 전학·재배치",
    note: "상황이 바뀌면 서류가 통째로 바뀜",
    regionId: "gangwon",
    disabilityId: "intellectual",
    levelId: "elementary",
    procedureId: "reassign",
    birthDate: "2019-05-20",
    currentServices: ["rehabVoucher"],
  },
];

