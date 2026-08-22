// ⚠ 데모용 — 발표 후 이 파일을 지운다.
//
// 발표에서 조건을 빠르게 바꿔 보이기 위한 가상 사례와, 장애영역별 용어 참고 목록이다.
// 실제 아동 정보가 아니다. 한 파일에 모아 둔 이유는, 발표가 끝나면 이 파일을 지우고
// page.tsx 의 import 한 줄만 지우면 끝나게 하려는 것이다.
//
// 같이 지울 것 — app/components/DemoKey.tsx · globals.css 의 .demo-* / .keys-off / .preset*

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
    label: "자폐성장애 · 취학 예정 · 신규",
    note: "가장 흔한 문의",
    regionId: "gangwon",
    disabilityId: "autism",
    levelId: "elementary",
    birthDate: "2019-03-14",
    currentServices: ["localChildCenter"],
  },
  {
    id: "b",
    label: "발달지체 · 취학 예정 · 신규",
    note: "★ 만 9세에 두 부처가 같이 끝남",
    regionId: "gangwon",
    disabilityId: "developmentalDelay",
    levelId: "elementary",
    birthDate: "2019-03-14",
    currentServices: [],
  },
  {
    id: "c",
    label: "자폐성장애 · 초등 · 온종일교실 이용",
    note: "복지부 방과후활동과 중복 제한",
    regionId: "gangwon",
    disabilityId: "autism",
    levelId: "elementary",
    birthDate: "2019-03-14",
    currentServices: ["allDayClass"],
  },
  {
    id: "d",
    label: "발달지체 · 유치원 · 신규",
    note: "유치원 배치(처음학교로) 기한",
    regionId: "gangwon",
    disabilityId: "developmentalDelay",
    levelId: "kinder",
    birthDate: "2021-08-02",
    currentServices: [],
  },
  {
    id: "e",
    label: "지적장애 · 초등 · 전학·재배치",
    note: "상황이 바뀌면 서류가 통째로 바뀜",
    regionId: "gangwon",
    disabilityId: "intellectual",
    levelId: "elementary",
    procedureId: "reassign",
    birthDate: "2019-05-20",
    currentServices: ["rehabVoucher"],
  },
];

/* ⚠ 데모용 — 장애영역별 실제 진단·증후군 용어 참고 목록. 발표 후 삭제 */
export const DEMO_TERMS: Record<DisabilityId, { group: string; items: string }[]> = {
  autism: [
    {
      group: "DSM-5 통합 이전 하위 유형",
      items:
        "자폐성 장애 · 아스퍼거 증후군 · 소아기 붕괴성 장애 · 비전형 자폐(PDD-NOS) · 레트 장애",
    },
    {
      group: "정도 표현",
      items: "지원 요구 1·2·3단계(DSM-5) · 고기능 / 저기능(임상 통용, 공식 진단명 아님)",
    },
    {
      group: "자주 동반되는 것",
      items: "ADHD · 감각처리 어려움 · 표현언어 지연 · 뇌전증 · 수면 문제",
    },
    {
      group: "유전 배경이 밝혀진 경우",
      items: "취약 X 증후군(FMR1) · 결절성 경화증 · 15q11-13 중복 · 22q13 결실(펠란-맥더미드)",
    },
    {
      group: "혼동하기 쉬운 다른 진단",
      items: "사회적 의사소통장애(SCD) · 선택적 함묵증 · 반응성 애착장애",
    },
  ],
  intellectual: [
    {
      group: "염색체·유전 질환",
      items:
        "다운 증후군(21 삼염색체) · 취약 X 증후군(FMR1) · 프래더-윌리 증후군 · 엔젤만 증후군 · 윌리엄스 증후군 · 레트 증후군(MECP2) · 스미스-마제니스 증후군 · 묘성 증후군(5p 결실) · 22q11.2 결실 증후군(디조지)",
    },
    {
      group: "⚠ 같은 병을 여러 이름으로 부르는 예",
      items:
        "엔젤만 증후군 = 엔젤 증후군 = 행복한 인형 증후군(happy puppet) = 속칭 「스마일 증후군」. 진단서에는 Angelman syndrome으로 적힙니다.",
    },
    {
      group: "대사·내분비 질환",
      items: "페닐케톤뇨증(PKU) · 갈락토스혈증 · 선천성 갑상선기능저하증 · 뮤코다당증",
    },
    {
      group: "후천·환경 요인",
      items: "태아알코올증후군(FAS) · 저산소성 허혈성 뇌손상 · 뇌수막염 후유증 · 조산·극저체중",
    },
    { group: "정도 표현", items: "경도 · 중등도 · 중도 · 최중도 (DSM-5는 적응기능 기준)" },
  ],
  developmentalDelay: [
    {
      group: "지연 영역 (시행령이 정한 다섯 가지)",
      items: "신체(대근육·소근육) · 인지 · 의사소통(수용·표현) · 사회·정서 · 적응행동",
    },
    {
      group: "묶어 부르는 진단",
      items: "전반적 발달지연(GDD) · 언어발달지체 · 말소리장애 · 발달성 협응장애(DCD)",
    },
    {
      group: "배경으로 적히는 것",
      items: "조산·극저체중 출생 · 뇌성마비 초기 소견 · 유전 검사 진행 중 · 원인 미확인",
    },
    {
      group: "⚠ 확인할 것",
      items:
        "만 9세가 되기 전에 재선정해야 지원이 이어집니다. 다문화 배경 아동은 최근 6개월 사전 중재 여부를 먼저 확인합니다(경남 지침).",
    },
  ],
  other: [
    {
      group: "시각장애",
      items: "저시력 · 전맹 · 망막색소변성 · 시신경 위축 · 백색증 · 레베르 선천성 흑암시",
    },
    {
      group: "청각장애",
      items: "감각신경성 난청 · 전음성 난청 · 일측성 난청 · 인공와우 이식 · 청신경병증",
    },
    {
      group: "지체장애",
      items: "뇌성마비(경직형·무정위형) · 이분척추 · 듀센형 근이영양증 · 척수성 근위축(SMA)",
    },
    {
      group: "정서·행동장애",
      items:
        "우울 · 불안 · 반항성 도전장애(ODD) · 품행장애 · 선택적 함묵증 · 틱·뚜렛. ⚠ ADHD와 정신질환은 선정 대상이 아니라고 경남 지침에 명시",
    },
    { group: "의사소통장애", items: "조음음운장애 · 말더듬 · 음성장애 · 수용·표현 언어장애" },
    { group: "학습장애", items: "난독증(읽기) · 난서증(쓰기) · 난산증(수학)" },
    {
      group: "건강장애",
      items:
        "소아암·백혈병 · 만성신부전(투석) · 선천성 심장질환 · 1형 당뇨 · 뇌전증. ⚠ 3개월 이상 장기 의료처치 소견이 진단서에 있어야 합니다",
    },
    { group: "두 가지 이상 중복된 장애", items: "중도중복장애 · 시청각장애(deafblind)" },
  ],
};
