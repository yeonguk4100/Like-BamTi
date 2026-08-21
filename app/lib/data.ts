// 너도나도 길잡이 — 데모용 제도 데이터
//
// ⚠ 이 파일의 데이터는 데모용입니다.
//   - source가 있는 항목: 강원·경남 교육청 지침 원문 또는 법령에서 확인한 내용
//   - source가 없는 항목: 화면 구성을 보여주기 위해 임의로 구성한 예시
//   실제 서비스에서는 전 항목에 출처와 확인일이 붙습니다.

export type Sourced = {
  /** 근거를 확인한 항목인지 (false면 데모용 임의 데이터) */
  verified: boolean;
  /** 근거 출처 */
  source?: string;
};

/* ────────────────────────────── 지역 ────────────────────────────── */

export type RegionId = "gangwon" | "gyeongnam" | "chungnam" | "gyeonggi" | "incheon" | "seoul";

export type Region = {
  id: RegionId;
  name: string;
  officeName: string;
  /** 치료지원·방과후활동비를 지급하는 교육청 바우처 카드 이름 */
  cardName: string;
  cardVerified: boolean;
  cardSource?: string;
  /** 진단·평가 의뢰서 서식 번호 (지역마다 다름) */
  requestFormNo: string;
  /** 기초조사 서류의 명칭 (지역마다 다름) */
  basicSurveyName: string;
  /** 지역 지침에 폐지된 용어 '장애등급'이 남아 있는지 */
  legacyTermInGuide: boolean;
  guideName: string;
};

export const REGIONS: Region[] = [
  {
    id: "gangwon",
    name: "강원특별자치도",
    officeName: "강원특별자치도교육청",
    cardName: "마음모아카드",
    cardVerified: true,
    cardSource: "강원특별자치도교육청 「특수교육대상자 선정·배치 업무 길잡이」",
    requestFormNo: "서식 3",
    basicSurveyName: "기초조사 카드(보호자용 / 담임교사용)",
    legacyTermInGuide: false,
    guideName: "특수교육대상자 선정·배치 업무 길잡이",
  },
  {
    id: "gyeongnam",
    name: "경상남도",
    officeName: "경상남도교육청",
    cardName: "특기적성비지원카드",
    cardVerified: true,
    cardSource: "경상남도교육청 「2025 특수교육대상자 선정·배치 업무 처리 지침」",
    requestFormNo: "서식 2",
    basicSurveyName: "기초조사서(일반 / 건강장애)",
    legacyTermInGuide: true,
    guideName: "2025 특수교육대상자 선정·배치 업무 처리 지침",
  },
  {
    id: "chungnam",
    name: "충청남도",
    officeName: "충청남도교육청",
    cardName: "디딤카드",
    cardVerified: true,
    cardSource: "국립특수교육원 온맘 — 충청남도교육청 디딤카드 안내",
    requestFormNo: "서식 미확인",
    basicSurveyName: "기초조사서",
    legacyTermInGuide: false,
    guideName: "특수교육대상자 선정·배치 지침",
  },
  {
    id: "gyeonggi",
    name: "경기도",
    officeName: "경기도교육청",
    cardName: "꿈이든카드",
    cardVerified: true,
    cardSource: "경기도교육청 꿈이든카드",
    requestFormNo: "서식 미확인",
    basicSurveyName: "기초조사서",
    legacyTermInGuide: false,
    guideName: "특수교육대상자 선정·배치 지침",
  },
  {
    id: "incheon",
    name: "인천광역시",
    officeName: "인천광역시교육청",
    cardName: "참좋은카드",
    cardVerified: true,
    cardSource: "인천광역시교육청 특수교육지원센터",
    requestFormNo: "서식 미확인",
    basicSurveyName: "기초조사서",
    legacyTermInGuide: false,
    guideName: "특수교육대상자 선정·배치 지침",
  },
  {
    id: "seoul",
    name: "서울특별시",
    officeName: "서울특별시교육청",
    cardName: "굳센카드",
    cardVerified: false,
    cardSource: "공식 출처 확보 필요",
    requestFormNo: "서식 미확인",
    basicSurveyName: "기초조사서",
    legacyTermInGuide: false,
    guideName: "특수교육대상자 선정·배치 지침",
  },
];

/* ────────────────────────── 장애영역 ────────────────────────── */

export type DisabilityId = "autism" | "intellectual" | "developmentalDelay" | "other";

/** 특수교육법 시행령 제10조가 정한 11개 영역 중 이 도구에 아직 없는 것 */
export const UNREGISTERED_AREAS =
  "시각장애 · 청각장애 · 지체장애 · 정서·행동장애 · 의사소통장애 · 학습장애 · 건강장애 · 두 가지 이상 중복된 장애";

export type Disability = {
  id: DisabilityId;
  name: string;
  /** 진단·평가 시 실시하는 검사 */
  tests: { label: string; required: boolean; items: string }[];
  /** 재선정이 필요한 조건 (있으면 마감일 계산 대상) */
  reselection?: "age9" | "middleSchool";
  note?: string;
};

export const DISABILITIES: Disability[] = [
  {
    id: "autism",
    name: "자폐성장애",
    tests: [
      {
        label: "자폐성 검사",
        required: true,
        items: "K-CARS-Ⅱ / K-ADS / ASDS / K-GARS-Ⅱ 중 1",
      },
      {
        label: "적응행동검사",
        required: true,
        items: "SMS / NISE-K·ABS / K-Vineland-Ⅱ / SIB-R 중 1",
      },
      {
        label: "기초학습검사",
        required: true,
        items: "NISE-B·ACT / KISE-BAAT / K-WFA / BASA 중 1 (취학 전 유아는 생략 가능)",
      },
    ],
    note: "최근 6개월 이내 병원 검사 결과를 활용할 수 있습니다. 병원 진단을 우선 안내합니다.",
  },
  {
    id: "intellectual",
    name: "지적장애",
    tests: [
      {
        label: "지능검사",
        required: true,
        items: "K-WPPSI-IV / K-WISC-IV·V / K-WAIS-IV / KABC-Ⅱ 중 1",
      },
      {
        label: "사회성숙도·적응행동검사",
        required: true,
        items: "SMS / NISE-K·ABS / K-Vineland-Ⅱ / SIB-R 중 1",
      },
      {
        label: "학습준비도검사",
        required: false,
        items: "NISE-B·ACT / KISE-BAAT / BASA 등 (취학 전 유아는 생략 가능)",
      },
    ],
    note: "최근 6개월 이내 병원 검사 결과를 활용할 수 있습니다.",
  },
  {
    id: "developmentalDelay",
    name: "발달지체",
    reselection: "age9",
    tests: [
      {
        label: "지능검사",
        required: true,
        items: "K-WPPSI-IV / K-WISC-IV·V / KABC-Ⅱ 중 1",
      },
      {
        label: "영유아발달검사",
        required: true,
        items: "K-CDI / K-DII / K-DIP / K-TABS 중 1",
      },
      {
        label: "그 밖의 영역",
        required: false,
        items: "적응행동 · 의사소통 · 조음음운 · 정서행동 등에서 선택 (필수 포함 총 3가지 이상)",
      },
    ],
    note: "만 9세 미만 아동에게만 적용되는 영역입니다. 만 9세가 되기 전에 재진단·재선정이 필요합니다.",
  },
  {
    id: "other",
    name: "기타 (직접 입력)",
    tests: [],
    note: `이 도구에는 아직 검사 도구가 등록되지 않은 영역입니다. 검사 항목은 소속 교육청 지침에서 확인하세요. (미등록: ${UNREGISTERED_AREAS})`,
  },
];

/* ────────────────────────── 학교급 ────────────────────────── */

export type LevelId = "kinder" | "elementary" | "middle" | "high";

export type Level = {
  id: LevelId;
  name: string;
  /** 진단·평가 의뢰서 제출처 */
  submitTo: string;
  /** 심사 기구 */
  committee: string;
  /** 최종 결정권자 */
  decider: string;
};

export const LEVELS: Level[] = [
  {
    id: "kinder",
    name: "유치원 (취학 전)",
    submitTo: "해당 지역 특수교육지원센터",
    committee: "시·군 특수교육운영위원회",
    decider: "교육장",
  },
  {
    id: "elementary",
    name: "초등학교 (취학 예정)",
    submitTo: "지역 교육지원청",
    committee: "시·군 특수교육운영위원회",
    decider: "교육장",
  },
  {
    id: "middle",
    name: "중학교",
    submitTo: "지역 교육지원청",
    committee: "시·군 특수교육운영위원회",
    decider: "교육장",
  },
  {
    id: "high",
    name: "고등학교",
    submitTo: "지역 교육지원청 → 도교육청",
    committee: "도 특수교육운영위원회",
    decider: "교육감",
  },
];

/* ────────────────────────── 지원 제도 ────────────────────────── */

export type Track = "education" | "welfare" | "medical";

export type Program = {
  id: string;
  name: string;
  track: Track;
  /** 소관 */
  authority: string;
  /** 신청처 */
  applyTo: string;
  /** 어떤 조건에서 목록에 뜨는지 */
  appliesTo?: { levels?: LevelId[]; disabilities?: DisabilityId[] };
  /** 지역 카드 이름으로 치환되는 항목인지 */
  usesRegionCard?: boolean;
  summary: string;
  documents: string[];
  deadline: string;
  legalBasis: string;
} & Sourced;

export const PROGRAMS: Program[] = [
  {
    id: "selection",
    name: "특수교육대상자 선정·배치 (진단·평가)",
    track: "education",
    authority: "교육청",
    applyTo: "{{submitTo}}",
    summary:
      "특수교육대상자로 선정되어야 아래 교육청 지원제도를 받을 수 있습니다. 모든 절차의 출발점입니다.",
    documents: [
      "선정·배치 신청자 명단 (엑셀)",
      "진단·평가 의뢰서 [{{requestFormNo}}]",
      "{{basicSurveyName}}",
      "배치 신청서",
      "개인정보 수집·이용 동의서",
      "학교장 의견서 또는 장애인증명서·복지카드 중 택 1",
    ],
    deadline: "회부일로부터 30일 이내 진단·평가 → 결과보고 후 2주 이내 선정·배치 통보",
    legalBasis: "장애인 등에 대한 특수교육법 제15조·제16조·제17조",
    verified: true,
    source: "강원·경남 교육청 지침 (2026.08 대조 확인)",
  },
  {
    id: "therapy",
    name: "치료지원",
    track: "education",
    authority: "교육청",
    applyTo: "특수교육지원센터",
    usesRegionCard: true,
    summary:
      "언어·행동·놀이치료 등의 비용을 바우처 카드로 지원합니다. **카드 이름이 시도마다 다릅니다.**",
    documents: ["치료지원 이용계획서", "특수교육대상자 배치 결과통지서 사본"],
    deadline: "선정·배치 후 신청. 지원 기간은 학년도 단위 (예시)",
    legalBasis: "장애인 등에 대한 특수교육법 제28조 (특수교육 관련서비스)",
    verified: false,
    source: "카드 명칭만 확인. 금액·절차는 데모용 예시",
  },
  {
    id: "afterschool",
    name: "방과후 교육활동 지원",
    track: "education",
    authority: "교육청",
    applyTo: "특수교육지원센터 / 소속 학교",
    usesRegionCard: true,
    summary: "방과후 교육활동비를 지원합니다. 치료지원과 같은 카드로 운영되는 지역이 있습니다.",
    documents: ["방과후 교육활동 신청서", "배치 결과통지서 사본"],
    deadline: "학년도 단위 신청 (예시)",
    legalBasis: "장애인 등에 대한 특수교육법 제28조",
    verified: false,
    source: "데모용 예시",
  },
  {
    id: "commute",
    name: "통학 지원",
    track: "education",
    authority: "교육청",
    applyTo: "소속 학교 / 교육지원청",
    summary: "통학 차량 또는 통학비를 지원합니다.",
    documents: ["통학지원 신청서"],
    deadline: "학년도 초 신청 (예시)",
    legalBasis: "장애인 등에 대한 특수교육법 제28조",
    verified: false,
    source: "데모용 예시",
  },
  {
    id: "registration",
    name: "장애 진단 · 장애인 등록",
    track: "medical",
    authority: "보건복지부 (의료기관 경유)",
    applyTo: "병원 → 읍면동 행정복지센터",
    summary:
      "복지부 제도를 받으려면 필요합니다. **교육청의 특수교육대상자 선정과는 별개 절차입니다.**",
    documents: ["의사 진단서", "장애 정도 심사용 진단서", "검사 결과지"],
    deadline: "상시 신청. 심사에 통상 수 주 소요 (예시)",
    legalBasis: "장애인복지법 제32조",
    verified: false,
    source: "데모용 예시. 별개 절차라는 점은 경남 지침 Q&A에서 확인",
  },
  {
    id: "rehab",
    name: "발달재활서비스 바우처",
    track: "welfare",
    authority: "보건복지부",
    applyTo: "읍면동 행정복지센터",
    summary: "언어·미술·음악·행동 재활 등을 바우처로 지원합니다. 소득 기준 심사가 있습니다.",
    documents: ["사회보장급여 신청서", "발달재활서비스 의뢰서", "소득·재산 증빙"],
    deadline: "상시 신청. 제공기관이 부족한 지역은 대기 발생",
    legalBasis: "장애아동 복지지원법 제21조",
    verified: false,
    source: "데모용 예시",
  },
  {
    id: "welfareAfterschool",
    name: "방과후활동서비스 (복지부)",
    track: "welfare",
    authority: "보건복지부",
    applyTo: "읍면동 / 발달장애인지원센터",
    appliesTo: { levels: ["middle", "high"] },
    summary:
      "청소년 발달장애인 대상 방과후 돌봄·활동 서비스입니다. **다른 돌봄 사업과 중복 이용이 제한될 수 있습니다.**",
    documents: ["사회보장급여 신청서", "장애인증명서"],
    deadline: "상시 신청 (예시)",
    legalBasis: "발달장애인 권리보장 및 지원에 관한 법률",
    verified: false,
    source: "데모용 예시",
  },
  {
    id: "allowance",
    name: "장애아동수당",
    track: "welfare",
    authority: "보건복지부",
    applyTo: "읍면동 행정복지센터",
    summary: "소득 기준을 충족하는 장애아동에게 수당을 지급합니다.",
    documents: ["사회보장급여 신청서", "소득·재산 증빙", "통장 사본"],
    deadline: "상시 신청 (예시)",
    legalBasis: "장애인복지법 제50조",
    verified: false,
    source: "데모용 예시",
  },
];

/* ─────────────────── 현재 이용 중인 서비스 (중복 확인용) ─────────────────── */

export const CURRENT_SERVICES = [
  { id: "localChildCenter", name: "지역아동센터" },
  { id: "togetherCare", name: "다함께돌봄센터" },
  { id: "schoolCare", name: "초등돌봄교실" },
  { id: "rehabVoucher", name: "발달재활서비스 바우처" },
] as const;

export type CurrentServiceId = (typeof CURRENT_SERVICES)[number]["id"];

/** 함께 이용할 때 확인이 필요한 조합 (데모용 예시 — 실제 조항 확인 필요) */
export const OVERLAP_RULES: {
  programId: string;
  withService: CurrentServiceId;
  message: string;
}[] = [
  {
    programId: "welfareAfterschool",
    withService: "localChildCenter",
    message:
      "방과후활동서비스와 지역아동센터는 중복 이용이 제한될 수 있습니다. 해당 연도 사업안내의 중복 이용 조항을 확인하세요.",
  },
  {
    programId: "welfareAfterschool",
    withService: "togetherCare",
    message:
      "방과후활동서비스와 다함께돌봄은 중복 이용이 제한될 수 있습니다. 사업안내를 확인하세요.",
  },
  {
    programId: "afterschool",
    withService: "schoolCare",
    message:
      "교육청 방과후 교육활동과 초등돌봄교실은 운영 시간이 겹칠 수 있습니다. 학교와 조정이 필요합니다.",
  },
  {
    programId: "therapy",
    withService: "rehabVoucher",
    message:
      "교육청 치료지원과 복지부 발달재활서비스는 같은 치료를 중복 지원하지 않도록 확인이 필요합니다.",
  },
];
