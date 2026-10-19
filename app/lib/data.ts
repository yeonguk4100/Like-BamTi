// 복지그루 — 데모용 제도 데이터
//
// ⚠ 이 파일의 데이터는 데모용입니다.
//   - source가 있는 항목: 강원·경남 교육청 지침 원문 또는 법령에서 확인한 내용
//   - source가 없는 항목: 화면 구성을 보여주기 위해 임의로 구성한 예시
//   실제 서비스에서는 전 항목에 출처와 확인일이 붙습니다.

/** 나이 판정 기준일. 오늘 날짜를 쓰면 서버와 브라우저 렌더링이 어긋난다.
 *  학년도 시작일이 실제 행정 기준이기도 하다. */
export const BASE_SCHOOL_YEAR = 2026;
export const BASE_DATE = `${BASE_SCHOOL_YEAR}-03-01`;

export type Sourced = {
  /** 근거를 확인한 항목인지 (false면 데모용 임의 데이터) */
  verified: boolean;
  /** 근거 출처 */
  source?: string;
  /** 금액·소득 기준처럼 해마다 바뀌는 값의 기준 시점. 화면에 그대로 표시한다 */
  asOf?: string;
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
  /**
   * MVP 구현 대상인지.
   *
   * false 인 지역은 **대조만 했고 구현하지 않았다.** 화면에서 고를 수 없고
   * /api/sheet 도 거부한다. 서식 번호와 절차를 확인하지 않은 채 시트를 내면
   * 「미확인」으로 가득한 반쯤 만든 결과가 나가기 때문이다.
   *
   * 대조 결과는 참고 자료(/api/reference)에 그대로 남는다 — 「같은 지원인데
   * 이름이 다르다」는 근거이고, 절차가 동일하다는 것이 확장 가능성의 증거다.
   */
  implemented: boolean;
  /**
   * 교육청 제도의 문의처.
   *
   * 제도마다 다른 값이 아니라 **소관 교육청의 것**이다. 복지·의료 제도는 전국 공통이라
   * 제도에 번호가 붙지만(129 · 1355), 교육청 제도는 시도마다 달라서 지역에 붙는다.
   *
   * 번호는 시도교육청 특수교육 부서다. 실제 신청처는 관할 교육지원청이라
   * 목록 주소(listUrl)를 함께 둔다 — 시도교육청 번호만 주면 학부모가 한 번 더 돌린다.
   *
   * **구현한 지역만 채운다.** 확인하지 않은 번호를 학부모에게 읽어 주면 안 된다.
   */
  eduContact?: {
    tel: string;
    telLabel: string;
    /** 관할 교육지원청 연락처 목록 */
    listUrl: string;
    listLabel: string;
    verified: boolean;
    source: string;
    asOf: string;
  };
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
    implemented: true,
    eduContact: {
      tel: "033-258-5390",
      telLabel: "강원특별자치도교육청 문화체육특수교육과 특수교육팀",
      listUrl: "https://www.gwe.go.kr/main/content.do?key=bTIzMDcyMTEyMDY0NTg%3D",
      listLabel: "강원 교육지원청 17곳 연락처 — 관할 교육지원청 찾기",
      verified: true,
      source: "강원특별자치도교육청 조직도 — 문화체육특수교육과 특수교육팀 대표전화",
      asOf: "2026.08 확인",
    },
  },
  {
    id: "gyeongnam",
    name: "경상남도",
    officeName: "경상남도교육청",
    cardName: "특기적성비지원카드",
    cardVerified: true,
    // 지역 대조표의 이름은 2025 지침 표기다. 2026 지침은 Q&A에 「특기적성 비지원카드」, 서식에 「특기적성교육지원카드」로 적는다
    cardSource: "경상남도교육청 「2025 특수교육대상자 선정·배치 업무 처리 지침」 (2026 지침 Q&A에도 같은 표기)",
    requestFormNo: "서식 2",
    // 2026 지침에서 보호자용 · 담임교사용이 나뉘었다 (강원과 같은 구조). 건강장애는 따로
    basicSurveyName: "기초조사서(보호자용 / 담임교사용)",
    // 2026 지침에도 「장애등급」이 14회 남아 있다 (신청서류 목록의 「장애등급 결정서」, 배치 신청서의 「장애등급(정도)」 등)
    legacyTermInGuide: true,
    guideName: "2026. 특수교육대상자 선정 배치 업무 처리 지침",
    // 2026 지침 원문(128쪽)에서 서식 번호를 다시 확인했다 (2026-10-17). 2025판보다 3번부터 2~3씩 밀렸다
    implemented: true,
    eduContact: {
      tel: "055-268-1140",
      telLabel: "경상남도교육청 유아특수교육과",
      listUrl: "https://www.gne.go.kr/www/office/eduguide.jsp",
      listLabel: "경남 교육지원청 18곳 연락처 — 관할 교육지원청 찾기",
      verified: true,
      /* 같은 쪽에 장학사 개인 직통번호가 함께 있지만 넣지 않는다 —
         담당자가 자주 바뀌고(수원 Q7), 개인 번호를 학부모에게 읽어 줄 것이 아니다 */
      source: "경상남도교육청 유아특수교육과 업무분장 — 과 대표전화",
      asOf: "2026.08 확인",
    },
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
    implemented: false,
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
    implemented: false,
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
    implemented: false,
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
    implemented: false,
  },
];

/** 지금 구현된 지역. 화면의 선택지와 /api/sheet 가 받는 값은 이것뿐이다 */
export const IMPLEMENTED_REGIONS = REGIONS.filter((r) => r.implemented);

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
  /** 상세 입력 칸의 이름. 영역마다 적을 것이 다르다 */
  detailLabel: string;
  detailPlaceholder: string;
  detailHint: string;
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
    detailLabel: "상세 유형 · 특성",
    detailPlaceholder: "예: 아스퍼거 진단 이력, 지원 요구 2단계, 언어 표현 제한",
    detailHint:
      "DSM-5에서 하위 유형이 자폐스펙트럼장애로 통합됐지만, 지침의 검사 도구에는 아스퍼거 척도(ASDS)가 남아 있어 현장에서는 구분이 통용됩니다.",
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
    detailLabel: "원인 질환 · 정도",
    detailPlaceholder: "예: 다운 증후군, 중등도, 적응행동 지원 필요",
    detailHint:
      "지적장애는 원인 질환이 여러 갈래입니다. 진단서에 적힌 질환명과 정도(경도·중등도·중도·최중도)를 그대로 적으셔도 됩니다.",
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
    detailLabel: "지연 영역 · 관련 진단",
    detailPlaceholder: "예: 표현언어 지연, 대근육 운동 지연, 전반적 발달지연(GDD)",
    detailHint:
      "발달지체는 신체·인지·의사소통·사회정서·적응행동 중 어느 영역이 지체됐는지에 따라 이후 선정될 장애영역이 달라집니다.",
  },
  {
    id: "other",
    name: "기타 (직접 입력)",
    tests: [],
    note: `이 도구에는 아직 검사 도구가 등록되지 않은 영역입니다. 검사 항목은 소속 교육청 지침에서 확인하세요. (미등록: ${UNREGISTERED_AREAS})`,
    detailLabel: "상세 특성 · 관련 진단",
    detailPlaceholder: "예: 감각신경성 난청, 인공와우 이식, 좌측 일측성",
    detailHint: "진단서나 상담에서 확인한 표현을 그대로 적으셔도 됩니다.",
  },
];

/* ────────────────────────── 학교급 ────────────────────────── */

export type LevelId = "daycare" | "kinder" | "elementary" | "middle" | "high";

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

/**
 * 아동이 속한(또는 배치받을) 학교급.
 *
 * 「(취학 전)」·「(취학 예정)」 괄호를 뗀 이유 — 기준이 섞여 있었다.
 * 어린이집·유치원의 괄호는 **지금 있는 곳**을 가리키고 초등학교의 괄호는
 * **갈 곳**을 가리켜서, 같은 칸인데 뜻이 달랐다. 중학교·고등학교는 괄호가 없어
 * 무엇을 뜻하는지 알 수 없었다.
 *
 * 전환 유형(신규 선정인가 상급학교 진학인가)은 **신청 상황(PROCEDURES)이 담당한다.**
 * 이 칸은 학교급만 고른다.
 */
export const LEVELS: Level[] = [
  {
    // 담당자 인터뷰 Q4 — 「어린이집에 다니는 아이들이 자주 놓침. 교육청 소속이 아니기 때문에
    // 공문을 보내지 못하고 행정복지센터를 통해서 거쳐야 하는거라 많이 누락이 되긴함」
    // 절차·제출처·결정권자는 유치원과 같다. 다른 것은 「공문이 가느냐」뿐이다.
    id: "daycare",
    name: "어린이집",
    submitTo: "해당 지역 특수교육지원센터",
    committee: "시·군 특수교육운영위원회",
    decider: "교육장",
  },
  {
    id: "kinder",
    name: "유치원",
    submitTo: "해당 지역 특수교육지원센터",
    committee: "시·군 특수교육운영위원회",
    decider: "교육장",
  },
  {
    id: "elementary",
    name: "초등학교",
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
  appliesTo?: {
    levels?: LevelId[];
    disabilities?: DisabilityId[];
    /** 이 지역에서만 있는 제도. 비어 있으면 전국 공통 */
    regions?: RegionId[];
    /** 만 나이 하한·상한 (기준일 BASE_DATE) */
    ageMin?: number;
    ageMax?: number;
  };
  /** 나이 조건의 예외 규정 등 */
  ageNote?: string;
  /** 지자체·교육청 자체사업인지 (전국 공통 제도와 구분해 보여준다) */
  local?: boolean;
  /** 지역 카드 이름으로 치환되는 항목인지 */
  usesRegionCard?: boolean;
  summary: string;
  documents: string[];
  deadline: string;
  legalBasis: string;
  /**
   * 학부모가 직접 열어 볼 수 있는 공식 안내 페이지.
   *
   * 담당자 소관 밖 제도에만 붙는다 — 교육청 담당자가 설명할 수 없는 것들이고,
   * 수원교육지원청 지원센터 담당자가 「관할이 아니면 홈페이지나 전화번호를 찾아서
   * 안내한다」고 한 바로 그 일이다. 그 찾는 일을 대신한다.
   *
   * URL 이 source 문자열에도 들어 있는 경우가 있는데 역할이 다르다 —
   * source 는 우리가 무엇을 보고 확인했는지의 기록이고, 이 필드는 학부모에게 건네는 주소다.
   * 확인하지 못한 제도(verified: false)에는 붙이지 않는다 (설계 원칙 3번).
   */
  officialUrl?: string;
  /** 링크에 붙일 기관·페이지 이름 */
  officialUrlLabel?: string;
  /**
   * 담당 부서 전화번호.
   *
   * **전국 어디서나 같은 번호만 넣는다.** 교육청 제도는 넣지 않는다 —
   * 선정·배치는 관할 교육지원청 특수교육지원센터가 받고, 그 번호는 시·군마다 다르다.
   * 강원만 해도 교육지원청이 열일곱 곳이라 시도 대표번호를 적으면 틀린 곳으로 보내게 된다.
   * 교육청 쪽 문의처는 담당자가 「안내문 발신 정보」에 자기 번호를 넣어 채운다.
   *
   * 읍면동에 신청하는 복지 제도도 주민센터 번호는 거주지마다 다르므로,
   * 전국 공통 상담번호(129)만 적는다.
   */
  contactTel?: string;
  /** 그 번호가 어디인지. 번호만 있으면 어디에 거는지 알 수 없다 */
  contactTelLabel?: string;
  /**
   * 복지로(한국사회보장정보원 「중앙부처복지서비스」)의 서비스ID.
   *
   * 있으면 제도 카드를 펼칠 때 /api/welfare?id= 로 공식 원문(대상·지원내용·신청 경로·서식·근거법령)을
   * 받아 「공식 정보」 칸에 함께 보여준다. 보내는 것은 이 ID 뿐이고 아동 조건은 보내지 않는다.
   * 우리 데이터를 덮지 않는다 — 나란히 놓아 담당자가 대조하게 한다 (설계 원칙 5번과 같은 이유).
   * ID 는 2026-10-16 `household=040&life=002` 목록 응답에서 확인했다.
   */
  bokjiroId?: string;
  /**
   * 지역마다 다른 값. 교육청 제도(치료지원·방과후·통학)는 금액·서류·신청 시기·카드 이름이
   * 시도마다 다르다. 여기 있는 칸만 그 지역에서 덮어쓴다. 없는 칸은 위의 공통 값을 쓴다.
   * 지역 값의 verified·source·asOf 가 그 지역에서의 확인 여부다.
   */
  byRegion?: Partial<Record<RegionId, RegionalProgram>>;
  /** 행안부 「공공서비스(혜택) 정보」 서비스ID — 지역 값(byRegion)에서만 채워진다. 있으면 카드가 교육청 원문을 띄운다 */
  gov24Id?: string;
  /**
   * 학교에 다니는 동안 학교를 통해 받는 지원 (방과후 · 지원인력 · 통학).
   * 취학유예 · 면제 중에는 목록에서 빼고 「재취학하면 신청」으로 따로 보여준다
   */
  requiresAttendance?: boolean;
} & Sourced;

/** 한 지역에서만 다른 제도 값 — Program.byRegion */
export type RegionalProgram = {
  /** 그 지역에서 부르는 제도 이름 (예: 경남은 방과후가 아니라 「특기적성교육비 지원」) */
  name?: string;
  /** 이 제도에 쓰는 카드 이름. 지역 공통 cardName 과 다를 때 (경남은 치료·특기적성 카드가 따로다) */
  cardName?: string;
  /** 지침 등에 남아 있는 옛 카드 표기 — 담당자가 지침과 대조할 수 있게 함께 보여준다 (설계 원칙 5번) */
  cardNameOld?: string;
  summary?: string;
  applyTo?: string;
  documents?: string[];
  deadline?: string;
  /** 그 지역에서의 대상 조건 (예: 강원 방과후는 유치원 제외) */
  appliesTo?: Program["appliesTo"];
  /** 행정안전부 「공공서비스(혜택) 정보」 서비스ID — 원문 대조 근거 */
  gov24Id?: string;
} & Sourced;

/** 교육청 제도 지역 값의 원문 출처 — 행정안전부 API(15113968)에 시도교육청 서비스가 실려 있다 */
const GOV24 = "행정안전부 「공공서비스(혜택) 정보」";

export const PROGRAMS: Program[] = [
  {
    id: "selection",
    name: "특수교육대상자 선정·배치 (진단·평가)",
    track: "education",
    authority: "교육청",
    applyTo: "{{submitTo}}",
    summary:
      "특수교육대상자로 선정되어야 아래 교육청 지원제도를 신청할 수 있습니다. 모든 절차의 출발점입니다.",
    documents: ["위 「제출 서류」 표를 그대로 씁니다 — 신청 상황에 따라 달라집니다"],
    deadline: "회부일로부터 30일 이내 진단·평가 → 결과보고 후 2주 이내 선정·배치 통보",
    legalBasis: "장애인 등에 대한 특수교육법 제15조·제16조·제17조",
    verified: true,
    source: "강원·경남 교육청 지침 (2026.08 대조 확인)",
    asOf: "2026.08 확인",
  },
  {
    id: "therapy",
    name: "치료지원",
    // 복지로 「(특수교육대상자) 치료지원서비스」(교육부). 금액·절차는 시도마다 달라 우리 값은 계속 「예시」다
    bokjiroId: "WLF00001113",
    track: "education",
    authority: "교육청",
    // 신청 경로는 복지로 원문 기준 — 학교에서 신청하고 시도교육청이 심사·결정한다
    applyTo: "소속 학교 · 특수교육지원센터 (시도교육청이 심사·결정)",
    usesRegionCard: true,
    summary:
      "병·의원, 장애인복지관, 사설치료실 등에서 받는 **물리치료·작업치료 등 치료지원**과 " +
      "언어·청능훈련, 감각운동지각훈련, 심리행동적응훈련 같은 특수교육 관련서비스를 바우처로 매월 지원합니다. " +
      "**복지부 발달재활서비스는 물리·작업치료를 지원하지 않으므로, 두 제도가 메우는 칸이 다릅니다.** " +
      "**카드 이름이 시도마다 다릅니다.**",
    documents: ["치료지원 이용계획서", "특수교육대상자 배치 결과통지서 사본"],
    deadline: "선정·배치 후 신청. 지원 기간은 학년도 단위 (예시)",
    legalBasis: "장애인 등에 대한 특수교육법 제28조 (특수교육 관련서비스), 같은 법 시행령",
    // 지원 내용·신청 경로는 공식 원문으로 확인했지만 금액·제출 서류·기한은 시도마다 달라 아직 예시다.
    // 서류가 틀릴 수 있는 항목을 「확인함」으로 올리면 1면 원칙이 깨지므로 false 를 유지한다
    verified: false,
    source:
      "지원 내용·신청 경로 — 복지로 「(특수교육대상자) 치료지원서비스」(교육부 특수교육정책과, 2026년 기준) 원문 대조. " +
      "카드 명칭은 시도 지침 확인. 금액·제출 서류·기한은 데모용 예시",
    asOf: "2026.10 복지로 원문 대조",
    // 구현 지역은 교육청 공식 원문으로 금액·서류·시기를 채웠다 (2026-10-16)
    byRegion: {
      gangwon: {
        summary:
          "병·의원, 장애인복지관, 사설치료실 등에서 받는 치료지원 비용을 **1인당 월 16만 원 이내 실소요액**으로 " +
          "지원합니다. 마음모아카드 포인트로 12개월(3월~다음 해 2월) 씁니다. " +
          "영아 · 유 · 초 · 중 · 고 · 특수학교(전공과 포함) 특수교육대상자 중 치료지원 대상자로 선정된 학생이 대상이며, " +
          "영아는 재택 보육하는 경우만 해당합니다. " +
          "**복지부 발달재활서비스는 물리·작업치료를 지원하지 않으므로, 두 제도가 메우는 칸이 다릅니다.**",
        applyTo: "특수교육지원센터 (이용계획서 등록·승인)",
        documents: ["치료지원기관 이용계획서"],
        deadline: "매년 3월 (대상자 선정 → 이용계획서 등록·승인 → 카드 발급)",
        gov24Id: "780000000011",
        verified: true,
        source:
          `${GOV24} 「특수교육대상자 치료지원」(강원특별자치도교육청, 2026-06-04 수정, 780000000011) ` +
          "· 강원 특수교육지원센터 운영계획 「치료지원 운영 계획」(2026-03-27, gwe.go.kr bbsSn=50566)",
        asOf: "2026.10 공식 원문 대조",
      },
      gyeongnam: {
        cardName: "치료지원 전자카드",
        // 2026 지침 서식(9·10)의 표기. 운영계획 · 교육청 누리집은 「치료지원 전자카드」
        cardNameOld: "치료지원비 전자카드",
        summary:
          "**1인당 월 15만 원 한도**로 치료지원비를 지원합니다. 전자카드에 매월 충전되거나 영수증으로 청구합니다. " +
          "병·의원의 물리치료 · 작업치료 · 청능훈련과, 발달재활치료기관의 언어 · 미술 · 놀이 · 음악재활, 재활심리, " +
          "운동 · 감각 · 행동재활, 보행시기능훈련이 대상입니다. " +
          "**복지부 발달재활서비스는 물리·작업치료를 지원하지 않으므로, 두 제도가 메우는 칸이 다릅니다.**",
        applyTo: "소속 학교",
        documents: [
          "치료지원 신청서",
          "개인정보 수집·이용 동의서",
          "의사진단서 (병·의원 치료 시, 해당자)",
          "병·의원 치료지원 영수증 (영수증으로 청구할 때, 해당자)",
        ],
        deadline: "상시 신청",
        gov24Id: "901000000012",
        verified: true,
        source:
          `${GOV24} 「특수교육대상자 치료지원비 지원」(경상남도교육청, 2026-08-10 수정, 901000000012) ` +
          "· 경상남도교육청 특수교육 지원 안내(gne.go.kr q_bbsSn=1568) — 「치료지원 전자카드」 월 15만 원",
        asOf: "2026.10 공식 원문 대조",
      },
    },
  },
  {
    id: "afterschool",
    requiresAttendance: true,
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
    byRegion: {
      gangwon: {
        name: "방과후학교 지원",
        summary:
          "초 · 중 · 고 · 특수학교(전공과 포함) 특수교육대상자 중 희망자에게 **1인당 월 15만 원 이내 실소요액**을 " +
          "지원합니다. 위탁형은 치료지원과 같은 마음모아카드 포인트로, 교내형은 학교 예산으로 운영합니다. " +
          "**유치원은 무상교육비로 지원하므로 이 사업 대상이 아닙니다.**",
        applyTo: "소속 학교 → 특수교육지원센터 (이용계획서 등록·승인)",
        documents: ["방과후학교 이용계획서"],
        deadline: "매년 3월 (이용계획서 등록·승인 → 카드 발급)",
        appliesTo: { levels: ["elementary", "middle", "high"] },
        gov24Id: "780000000012",
        verified: true,
        source:
          `${GOV24} 「특수교육대상학생 방과후학교지원」(강원특별자치도교육청, 2026-06-04 수정, 780000000012) ` +
          "· 강원 특수교육지원센터 운영계획 「방과후학교 운영 계획」(2026-03-27, gwe.go.kr bbsSn=50566)",
        asOf: "2026.10 공식 원문 대조",
      },
      gyeongnam: {
        name: "특기적성교육비 지원",
        cardName: "특기적성교육비 전자카드",
        // 2026 지침 서식(9·10)의 표기. 교육청 누리집·행안부 원문은 「특기적성교육비 전자카드」,
        // 2025 지침과 2026 Q&A는 「특기적성비지원카드」 — 지역 대조표(Region.cardName)에는 그 이름이 남아 있다
        cardNameOld: "특기적성교육지원카드",
        summary:
          "유 · 초 · 중 · 고 · 특수학교 특수교육대상자에게 **1인당 월 12만 원 한도**로 특기적성교육비를 전자카드로 " +
          "지원합니다. 예 · 체능, 직업 관련 학원 · 교습소 등 가맹점에서 씁니다. " +
          "**특수학교 전공과 학생과 저소득층 방과후학교 자유수강권을 받는 학생은 제외됩니다.** " +
          "치료지원과는 카드가 따로입니다.",
        applyTo: "소속 학교",
        documents: [
          "특기적성교육비 지원 신청서 (학교에서 받음)",
          "가족관계 증빙 (주민등록등본 · 가족관계증명서 등)",
          "특기적성교육기관 사업자등록증 사본",
        ],
        deadline: "상시 신청",
        appliesTo: { levels: ["kinder", "elementary", "middle", "high"] },
        gov24Id: "901000000007",
        verified: true,
        source:
          `${GOV24} 「특수교육대상자 특기적성교육비 지원」(경상남도교육청, 2026-08-05 수정, 901000000007) ` +
          "· 경상남도교육청 특수교육 지원 안내(gne.go.kr q_bbsSn=1568) — 2026학년도 월 12만 원",
        asOf: "2026.10 공식 원문 대조",
      },
    },
  },
  {
    // 담당자 인터뷰 Q3 — 「대부분 특수교육대상자가 되면 교육청에서 어떤 혜택을 주는지를
    // 가장 궁금해함」이고, 예로 든 것이 방과후 보조 인력이었다. 목록에 없던 제도다.
    id: "aideStaff",
    requiresAttendance: true,
    name: "지원인력 (보조인력) 배치",
    track: "education",
    authority: "교육청",
    applyTo: "소속 학교 → 교육지원청",
    summary:
      "교수학습 활동 · 신변처리 · 급식 · 교내외 활동 · 등하교를 보조하는 인력을 배치합니다. " +
      "**학부모가 가장 자주 묻는 항목입니다.** 다만 **선정되면 자동으로 배치되는 것이 아니라** " +
      "학교장이 통합교육계획에 포함해 신청하고 교육감이 수급 계획에 따라 배치합니다. " +
      "배치 여부와 시기는 학교·교육지원청에 확인해야 합니다.",
    documents: ["지원인력 배치 요청 (소속 학교를 통해)", "배치 결과통지서 사본"],
    deadline: "학교장이 통합교육계획에 포함해 신청. 시기는 학교·교육지원청 확인",
    legalBasis: "장애인 등에 대한 특수교육법 제28조 제3항, 시행규칙 제5조",
    verified: true,
    source:
      "법제처 찾기쉬운 생활법령정보 「특수교육 관련서비스」 — 지원인력은 교수학습 활동·신변처리·" +
      "급식·교내외 활동·등하교 보조. 교육감이 수급 계획 수립과 채용·배치를 수행",
    asOf: "2026.08 확인",
  },
  {
    id: "commute",
    requiresAttendance: true,
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
    byRegion: {
      gangwon: {
        name: "통학비 및 숙식비 지원",
        summary:
          "특수교육대상자의 통학비와 숙식비를 지원합니다. 학년 초 지원 대상자를 정할 때 학교에 신청합니다. " +
          "**지원 금액은 원문에 적혀 있지 않아 학교에 확인해야 합니다.**",
        applyTo: "소속 학교",
        documents: ["학교 신청서 (학년 초 지원 대상자 선정 시)"],
        deadline: "상시 신청 — 보통 학년 초 지원 대상자 선정 때 냅니다",
        gov24Id: "780000000003",
        verified: true,
        source:
          `${GOV24} 「특수교육대상자 통학비 및 숙식비 지원」(강원특별자치도교육청 행정과, 2026-06-04 수정, 780000000003) ` +
          "— 근거 특수교육법 제28조 제5항. 금액은 원문에 없음",
        asOf: "2026.10 공식 원문 대조",
      },
      gyeongnam: {
        name: "통학비 지원",
        summary:
          "학교와 집 사이 **편도 2km 이상**(유 · 초등은 도심지 시내버스 2구간 이상)이고, 학교 통학버스가 아니라 " +
          "시 · 내외버스나 자가용으로 통학하는 특수교육대상자와 보호자에게 **버스 요금 또는 자가용 유류비**를 지원합니다. " +
          "특수학교 기숙사에 들어간 학생은 조 · 석식 숙식비를 따로 지원합니다(1년 200일 기준).",
        applyTo: "소속 학교",
        documents: [
          "통학비 지원 신청서 (학교에서 받음)",
          "가족관계 증빙 (주민등록등본 · 가족관계증명서 등)",
        ],
        deadline: "상시 신청",
        gov24Id: "901000000008",
        verified: true,
        source:
          `${GOV24} 「특수교육대상자 통학비 지원」(901000000008) · 「특수교육대상자 숙식비 지원」(901000000009) ` +
          "(경상남도교육청, 2026-08-05 수정)",
        asOf: "2026.10 공식 원문 대조",
      },
    },
  },
  {
    id: "registration",
    name: "장애 진단 · 장애인 등록",
    track: "medical",
    authority: "보건복지부 (심사는 국민연금공단)",
    applyTo: "읍면동 주민센터에 신청 → 의료기관 진단 → 국민연금공단 심사",
    summary:
      "복지부 제도 대부분의 전제입니다. **교육청의 특수교육대상자 선정과는 별개 절차입니다.** " +
      "① 읍면동에 신청 → ② 의료기관에서 「장애정도 심사용 진단서」 발급 → " +
      "③ 국민연금공단이 2인 이상 전문의 의학자문회의로 심사 → ④ 시·군·구가 등록하고 결과를 통지합니다. " +
      "등록이 끝나면 장애인증명서는 읍면동에서 즉시 발급됩니다.",
    documents: [
      "장애인등록 및 서비스 신청서",
      "사진 1장 (3.5cm × 4.5cm)",
      "장애정도 심사용 진단서 (의료기관 전문의 발급)",
      "검사 결과지 · 진료기록",
    ],
    deadline: "상시 신청. 처리기간은 보건복지부 안내에 명시돼 있지 않아 읍면동에 확인해야 합니다",
    legalBasis: "장애인복지법 제32조",
    officialUrl: "https://www.mohw.go.kr/menu.es?mid=a10710010900",
    officialUrlLabel: "보건복지부 — 장애인등록·장애정도 심사제도",
    contactTel: "1355",
    contactTelLabel: "국민연금공단 (장애정도 심사)",
    verified: true,
    source:
      "보건복지부 「장애인등록/장애정도 심사제도」 https://www.mohw.go.kr/menu.es?mid=a10710010900 " +
      "· 별개 절차라는 점은 경남 지침 Q&A에서 확인",
    asOf: "2026.08 확인",
  },
  {
    id: "rehab",
    name: "발달재활서비스 바우처",
    bokjiroId: "WLF00003195",
    track: "welfare",
    authority: "보건복지부",
    applyTo: "읍면동 주민센터 (온라인은 복지로)",
    summary:
      "언어·청능·미술·음악·행동·놀이심리·감각·운동발달 재활 등을 바우처로 지원합니다. " +
      "**장애 등록이 없어도 만 9세 미만이면 「발달재활서비스 의뢰서」와 검사자료로 신청할 수 있습니다.** " +
      "등록 대상 유형은 뇌병변·지적·자폐성·청각·언어·시각입니다. 기준중위소득 180% 이하이며 소득 구간별로 월 18~26만원입니다. " +
      "**의료기관의 물리치료·작업치료는 지원하지 않습니다** — 교육청 치료지원은 이를 지원하므로 함께 확인합니다.",
    documents: [
      "사회보장급여 신청서",
      "신분증",
      "소득 증명 자료",
      "장애 등록 전이면 — 발달재활서비스 의뢰서 + 검사자료",
      // 복지로 원문 서식에 있고 우리 목록에 없던 것. 아동 명의 카드라 보호자 동의가 필요하다
      "국민행복카드 발급용 법정대리인 동의서 (아동 명의 바우처 카드)",
    ],
    appliesTo: { ageMax: 17 },
    ageNote:
      "신청일 현재 만 18세 미만이 대상이며 18세가 되는 달까지 지원합니다. " +
      "장애 등록이 없는 경우에는 만 9세가 되는 달까지만 지원됩니다.",
    deadline: "상시 신청. 제공기관이 부족한 지역은 대기 발생",
    legalBasis: "장애아동 복지지원법 제21조",
    officialUrl: "https://www.socialservice.or.kr:444/user/htmlEditor/view2.do?p_sn=11",
    officialUrlLabel: "사회서비스 전자바우처 — 발달재활서비스",
    contactTel: "129",
    contactTelLabel: "보건복지상담센터 (4번 장애인)",
    verified: true,
    source:
      "사회서비스 전자바우처(한국사회보장정보원) 「발달재활서비스」 사업 안내 " +
      "https://www.socialservice.or.kr:444/user/htmlEditor/view2.do?p_sn=11 " +
      "· 복지로 「발달재활서비스」(보건복지부 장애인건강과, 2026년 기준) 원문 대조 — 금액·대상 일치, " +
      "물리·작업치료 제외와 법정대리인 동의서는 원문에서 추가",
    asOf: "2026.10 복지로 원문 대조 — 금액·소득 기준은 해마다 바뀝니다",
  },
  {
    id: "welfareAfterschool",
    name: "청소년 발달장애인 방과후활동서비스",
    bokjiroId: "WLF00001178",
    track: "welfare",
    authority: "보건복지부",
    applyTo: "읍면동 주민센터",
    // 「청소년」이라는 이름 때문에 중·고등학생만으로 잡아 두었는데 틀렸다.
    // 만 6세부터가 대상이므로 초등학생도 해당된다 (보건복지부 안내 확인).
    appliesTo: { disabilities: ["autism", "intellectual"], ageMin: 6, ageMax: 17 },
    ageNote:
      "만 6세 이상 만 18세 미만이 대상입니다. 만 18세 이상 재학생은 주간활동서비스(기본형)와 택 1이며, " +
      "이때 발급 1개월 이내 재학증명서가 필요합니다.",
    summary:
      "방과후 돌봄·활동과 성인기 자립준비를 위한 이용권(바우처)을 **월 66시간** 지원합니다. " +
      "**장애인복지법상 등록된 지적·자폐성 장애인만 대상입니다** — 발달지체로 특수교육대상자가 되어도 " +
      "복지 쪽 등록 유형이 지적·자폐성이 아니면 신청할 수 없습니다. " +
      "**온종일교실 · 청소년 방과후 아카데미 · 장애인 거주시설 입소자는 제외됩니다.**",
    documents: ["사회보장급여 신청서", "장애인증명서"],
    deadline: "상시 신청",
    legalBasis: "발달장애인 권리보장 및 지원에 관한 법률 제29조의2 (주간활동·방과 후 활동 지원)",
    officialUrl: "https://www.mohw.go.kr/menu.es?mid=a10710041200",
    officialUrlLabel: "보건복지부 — 발달장애인 방과후활동서비스",
    contactTel: "129",
    contactTelLabel: "보건복지상담센터 (4번 장애인)",
    verified: true,
    source:
      "보건복지부 「청소년 발달장애인 방과후활동서비스」 " +
      "https://www.mohw.go.kr/menu.es?mid=a10710041200 " +
      "· 복지로 「청소년 발달장애인 방과후활동서비스」(보건복지부 장애인서비스과, 2026년 기준) 원문 대조 — " +
      "대상 일치, 월 66시간·재학증명서 조건은 원문에서 추가",
    asOf: "2026.10 복지로 원문 대조",
  },
  {
    id: "allowance",
    name: "장애아동수당",
    bokjiroId: "WLF00003198",
    track: "welfare",
    authority: "보건복지부",
    applyTo: "읍면동 행정복지센터 (읍·면·동장을 거쳐 시장·군수·구청장에게 제출)",
    appliesTo: { ageMax: 17 },
    ageNote:
      "신청월 현재 만 18세 미만이 대상입니다. " +
      "초·중등교육법 제2조 학교에 재학(휴학 포함) 중이면 20세 이하까지 포함되며, " +
      "**특수학교 전공과도 이 학교에 포함됩니다** (장애인연금 수급자는 제외).",
    summary:
      "**장애인복지법 제32조에 따라 등록한 장애인**이어야 합니다. 발달재활서비스와 달리 등록 없이는 신청할 수 없습니다. " +
      "국민기초생활보장 수급자와 차상위계층(소득인정액이 기준중위소득 50% 이하 — 2026년 4인 가구 3,247,369원 이하)이 대상이며, " +
      "장애 정도와 소득 계층에 따라 월 3만~22만원을 지급합니다. " +
      "2025년 4월 22일부터 **생계·의료급여를 받는 장애아동은 신청하지 않아도 지급**됩니다.",
    documents: ["사회보장급여 신청서", "금융정보 등 제공 동의서", "소득·재산 증빙", "통장 사본"],
    deadline: "상시 신청. 지급일은 매월 20일 (토요일·공휴일이면 그 전날)",
    legalBasis: "장애인복지법 제50조·제51조, 시행령 제32조, 시행규칙 제38조",
    officialUrl:
      "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=916&ccfNo=2&cciNo=1&cnpClsNo=2",
    officialUrlLabel: "찾기쉬운 생활법령 — 장애아동수당",
    contactTel: "129",
    contactTelLabel: "보건복지상담센터 (4번 장애인)",
    verified: true,
    source:
      "법제처 찾기쉬운 생활법령정보 「장애수당 및 장애아동수당」 " +
      "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=916&ccfNo=2&cciNo=1&cnpClsNo=2 " +
      "· 복지로 「장애아동수당」(보건복지부 장애인자립기반과, 2026년 기준) 원문 대조 — 지급액 일치, " +
      "전공과 포함·2026 차상위 금액·금융정보 동의서는 원문에서 추가 " +
      "· 신청 없이 지급은 보건복지부 보도자료(2025.4, list_no=1485524)",
    asOf: "2026.10 복지로 원문 대조 — 지급액은 「2026년 장애인연금 사업안내」 기준",
  },
];

/* ══════════════════════════════════════════════════════════
   지역 자체사업 — 아직 조사하지 않았다
   구조만 만들어 두고, 조사되는 대로 이 배열에 넣는다.
   비어 있으면 화면이 「등록된 자체사업 없음」으로 표시한다.
   ══════════════════════════════════════════════════════════ */

export const LOCAL_PROGRAMS: Program[] = [
  // 예) {
  //   id: "wonju-something",
  //   name: "원주시 장애아동 ○○ 지원",
  //   track: "welfare",
  //   authority: "원주시",
  //   applyTo: "원주시청 / 읍면동 행정복지센터",
  //   appliesTo: { regions: ["gangwon"], ageMax: 17 },
  //   local: true,
  //   summary: "...",
  //   documents: ["..."],
  //   deadline: "...",
  //   legalBasis: "원주시 조례 제○호",
  //   verified: true,
  //   source: "원주시 홈페이지 (확인일)",
  // },
];

/**
 * 시·군 목록 — 지역 자체사업을 고르는 데만 쓴다 (선택 입력).
 *
 * 이름은 지자체복지서비스 API 의 sggNm 표기 그대로다 (2026-10-16 응답에서 확인한 형식: 「원주시」「홍천군」).
 * 서버에는 보내지 않는다. 시도 단위로 목록을 받아 브라우저에서 이 이름으로 거른다.
 */
export const SIGUNGU: Partial<Record<RegionId, string[]>> = {
  gangwon: [
    "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시",
    "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군",
  ],
  gyeongnam: [
    "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시",
    "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군",
  ],
};

/** 조사해야 할 곳 — 화면에 그대로 띄워 무엇이 비었는지 보여준다 */
export const LOCAL_SOURCES: Partial<Record<RegionId, string[]>> = {
  // MVP 대상은 원주·춘천 두 곳이다 (기획서 7장). 조사되는 대로 LOCAL_PROGRAMS 에 넣는다
  gangwon: [
    "강원특별자치도교육청 특수교육과 공고",
    "강원특별자치도 장애인복지 조례",
    "원주시청 장애인복지 · 아동복지 안내",
    "원주시 장애인가족지원센터",
    "춘천시청 장애인복지 · 아동복지 안내",
    "춘천시 장애인가족지원센터",
  ],
};

/**
 * 지역별 · 신청 상황별 제출 서류 — 지침 원문의 「제출서류」 표를 그대로 옮긴다.
 *
 * 공통 목록(PROCEDURES[].forms)을 두 지역에 같이 쓰다가 강원에서 틀렸다 (2026-10-19 원문 대조).
 * 강원 신규 선정에는 「배치 신청서」 · 「학교장 의견서 또는 복지카드 택 1」이 없고(경남 서식이다),
 * 대신 주민등록등본이 필수이고 장애인 증명 · 진단 자료는 「해당자」 서류다.
 * 새 지역을 열 때 이 표부터 채운다. 없으면 공통 목록으로 나가지만 그 지역 원문과 다를 수 있다.
 */
export const PROCEDURE_FORMS_BY_REGION: Partial<Record<RegionId, Partial<Record<ProcedureId, FormEntry[]>>>> = {
  // 「2026 특수교육대상자 선정·배치 업무 길잡이」 6~7쪽 제출서류 요약 · 상급학교 진학 제출서류 (2026-03-27 게시)
  gangwon: {
    new: [
      "applicantList",
      "requestForm",
      "basicSurvey",
      "privacyConsent",
      "residentCopy",
      { key: "disabilityProof", when: "장애인 등록이 되어 있는 경우" },
      { key: "medicalRecords", when: "진단 · 치료 · 검사 기록이 있는 경우" },
      { key: "graduationCert", when: "졸업했거나 졸업을 앞둔 경우" },
    ],
    advance: [
      "advanceList",
      "advanceRequest",
      "privacyConsent",
      "residentCopy",
      { key: "principalOpinionHigh", when: "특목고 · 특성화고 · 자사고 · 대안학교에 진학하려는 경우" },
      { key: "iepMinutes", when: "배치 유형(일반학급 · 특수학급 등)을 바꾸는 경우" },
    ],
    reassign: [
      "reassignRequest",
      "privacyConsent",
      { key: "iepMinutes", when: "배치 유형을 바꾸는 경우 (거주지 이전만이면 생략)" },
      { key: "placementResultCopy", when: "다른 시 · 군이나 다른 시 · 도로 전학하는 경우" },
      { key: "residentCopy", when: "다른 시 · 군이나 다른 시 · 도로 주소를 옮긴 경우" },
    ],
    deferral: [
      "deferralRequest",
      "iepMinutes",
      { key: "deferralProof", when: "질병 · 유학 등 사유를 증명해야 하는 경우" },
    ],
    reenroll: ["reenrollRequest", "residentCopy", "placementResultCopy", "privacyConsent"],
  },
  // 「2026. 특수교육대상자 선정 배치 업무 처리 지침」 13~14쪽 · 42~56쪽 (2026-03-04 게시)
  gyeongnam: {
    new: [
      "applicantList",
      "requestForm",
      "basicSurvey",
      "placementRequest",
      "principalOpinion",
      "privacyConsent",
    ],
    advance: ["advanceList", "advanceRequest", "privacyConsent", "placementResultCopy"],
    reassign: [
      "reassignList",
      "reassignRequest",
      "privacyConsent",
      "placementResultCopy",
      { key: "iepMinutes", when: "단순 거주지 이전이 아닌 경우" },
      { key: "residentCopy", when: "거주지를 옮긴 경우 (또는 거주지 확인 증명서)" },
    ],
    deferral: [
      "deferralList",
      "deferralRequest",
      "privacyConsent",
      { key: "iepMinutes", when: "학교에 다니고 있는 경우" },
      { key: "placementResultCopy", when: "이미 배치를 받은 경우" },
      "deferralProof",
    ],
    reenroll: [
      "reenrollList",
      "reenrollRequest",
      "privacyConsent",
      "placementResultCopy",
      { key: "residentCopy", when: "해외에서 귀국한 경우 — 귀국 뒤 발행분 (재학 · 성적증명서도 필요)" },
    ],
  },
};

/* ─────────────────── 현재 이용 중인 서비스 (중복 확인용) ─────────────────── */

export const CURRENT_SERVICES = [
  { id: "localChildCenter", name: "지역아동센터" },
  { id: "togetherCare", name: "다함께돌봄센터" },
  { id: "schoolCare", name: "초등돌봄교실" },
  // 방과후활동서비스의 공식 제외 목록에 이름이 그대로 올라 있는 두 사업
  { id: "allDayClass", name: "온종일교실" },
  { id: "youthAcademy", name: "청소년 방과후 아카데미" },
  { id: "rehabVoucher", name: "발달재활서비스 바우처" },
] as const;

export type CurrentServiceId = (typeof CURRENT_SERVICES)[number]["id"];

/** 함께 이용할 때 확인이 필요한 조합 */
export const OVERLAP_RULES: ({
  programId: string;
  withService: CurrentServiceId;
  message: string;
} & Sourced)[] = [
  {
    programId: "welfareAfterschool",
    withService: "allDayClass",
    message:
      "온종일교실 이용자는 방과후활동서비스 대상에서 제외됩니다. 둘 중 하나를 골라야 합니다.",
    verified: true,
    source: "보건복지부 「청소년 발달장애인 방과후활동서비스」 제외 대상",
    asOf: "2026.08 확인",
  },
  {
    programId: "welfareAfterschool",
    withService: "youthAcademy",
    message:
      "청소년 방과후 아카데미 이용자는 방과후활동서비스 대상에서 제외됩니다. 둘 중 하나를 골라야 합니다.",
    verified: true,
    source: "보건복지부 「청소년 발달장애인 방과후활동서비스」 제외 대상",
    asOf: "2026.08 확인",
  },
  {
    programId: "welfareAfterschool",
    withService: "localChildCenter",
    message:
      "지역아동센터는 공식 제외 목록에 이름이 없습니다. 다만 이용 시간이 겹칠 수 있어 해당 연도 사업안내를 확인하세요.",
    verified: false,
    source: "공식 제외 목록에서 확인되지 않음 — 사업안내 원문 확인 필요",
  },
  {
    programId: "welfareAfterschool",
    withService: "togetherCare",
    message:
      "다함께돌봄도 공식 제외 목록에는 없습니다. 다만 이용 시간이 겹치면 조정이 필요할 수 있어 확인하세요.",
    verified: false,
    source: "공식 제외 목록에서 확인되지 않음 — 해당 연도 사업안내 원문 확인 필요",
  },
  {
    programId: "afterschool",
    withService: "schoolCare",
    message:
      "교육청 방과후 교육활동과 초등돌봄교실은 운영 시간이 겹칠 수 있습니다. 학교와 조정이 필요합니다.",
    verified: false,
    source: "운영 시간 충돌은 현장 사례 — 명문 조항 확인 필요",
  },
  {
    programId: "therapy",
    withService: "rehabVoucher",
    message:
      "교육청 치료지원과 복지부 발달재활서비스는 같은 치료를 중복 지원하지 않도록 확인이 필요합니다.",
    verified: false,
    source: "중복 지원 금지 조항 확인 필요",
  },
];

/* ══════════════════════════════════════════════════════════
   서식 — 같은 서류인데 번호가 지역마다 다르다
   강원·경남 지침 원문에서 확인한 번호다 (2026.08 대조)
   ══════════════════════════════════════════════════════════ */

export type FormKey =
  | "applicantList"
  | "requestForm"
  | "basicSurvey"
  | "placementRequest"
  | "healthSurvey"
  | "principalOpinion"
  | "privacyConsent"
  | "ldRecord"
  | "placementResultCopy"
  | "advanceList"
  | "advanceRequest"
  | "reassignRequest"
  | "deferralRequest"
  | "reenrollRequest"
  /** 유예·면제 사유 증빙 (질병 — 진단서 · 유학 — 출입국 사실증명서) */
  | "deferralProof"
  /** 주민등록등본 */
  | "residentCopy"
  /** 장애인복지카드 사본 또는 장애인 증명서 */
  | "disabilityProof"
  /** 의사 진단서 · 소견서 · 의무기록 사본 · 심리평가 보고서 등 */
  | "medicalRecords"
  | "graduationCert"
  /** 강원 서식 16 — 특목고 · 특성화고 · 자사고 · 대안학교 진학 때만 */
  | "principalOpinionHigh"
  | "iepMinutes"
  /** 경남 서식 1-❷ · 1-❸ · 1-❺ — 학교가 엑셀로 취합 */
  | "reassignList"
  | "deferralList"
  | "reenrollList";

/**
 * 신청 상황마다 내는 서류 한 줄. 문자열이면 늘 내는 서류, `when` 이 있으면 **해당하는 경우만** 내는 서류다.
 * 「해당자」 서류를 빼면 반송이 생기고, 늘 내는 것처럼 적으면 학부모가 필요 없는 서류를 찾아다닌다.
 */
export type FormEntry = FormKey | { key: FormKey; when: string };

export const FORM_LABEL: Record<FormKey, string> = {
  applicantList: "선정·배치 신청자 명단 (엑셀)",
  requestForm: "진단·평가 의뢰서",
  basicSurvey: "기초조사 서류",
  placementRequest: "배치 신청서",
  healthSurvey: "기초조사서 (건강장애)",
  principalOpinion: "학교장 의견서 또는 장애인증명서·복지카드 중 택 1",
  privacyConsent: "개인정보 수집·이용 및 제공 동의서",
  ldRecord: "학습장애 선정을 위한 기초조사서 · 중재반응 기록지",
  placementResultCopy: "이전 배치 결과통지서 사본",
  advanceList: "상급학교 배치 의뢰자 명단 (엑셀)",
  advanceRequest: "상급학교 배치 신청서",
  reassignRequest: "재배치(배치변경) 신청서",
  deferralRequest: "취학유예·면제 승인 신청서",
  reenrollRequest: "재취학 신청서",
  deferralProof: "유예·면제 사유를 증명하는 서류",
  residentCopy: "주민등록등본",
  disabilityProof: "장애인복지카드 사본 또는 장애인 증명서",
  medicalRecords: "의사 진단서 · 소견서 · 의무기록 사본 · 심리평가 보고서 등",
  graduationCert: "졸업증명서 또는 졸업예정증명서",
  principalOpinionHigh: "진학 희망 고등학교 학교장 의견서",
  iepMinutes: "개별화교육지원팀 회의록 사본",
  reassignList: "배치(재배치 · 배치변경) 의뢰자 명단 (엑셀)",
  deferralList: "유예(면제) 의뢰자 명단 (엑셀)",
  reenrollList: "재취학 의뢰자 명단 (엑셀)",
};

/** 지역별 서식 번호. 확인하지 못한 지역은 비워 두고 화면에서 「서식 미확인」으로 보여준다 */
export const FORM_NO: Record<RegionId, Partial<Record<FormKey, string>>> = {
  gangwon: {
    applicantList: "서식 1",
    advanceList: "서식 2",
    requestForm: "서식 3",
    basicSurvey: "서식 4·5 (보호자용 / 담임교사용)",
    advanceRequest: "서식 8",
    reassignRequest: "서식 7",
    deferralRequest: "서식 10",
    reenrollRequest: "서식 11",
    privacyConsent: "서식 12",
    ldRecord: "서식 25·26",
    healthSurvey: "서식 6",
    principalOpinionHigh: "서식 16",
  },
  // 경남 2026 지침 「2026. 특수교육대상자 선정 배치 업무 처리 지침」(2026-03-04 게시, 128쪽 — 파일명에 「(안)」)
  // 기초조사서가 보호자용 · 담임교사용으로 나뉘면서 3번부터 번호가 밀렸다. 2025판 번호로 안내하면 다른 서식을 찾게 된다
  gyeongnam: {
    applicantList: "서식 1-❶",
    advanceList: "서식 1-❷",
    requestForm: "서식 2",
    basicSurvey: "서식 3·4 (보호자용 / 담임교사용)",
    // 건강장애는 기초조사서가 따로다. 「기타」로 건강장애를 적을 수 있을 때만 basicSurvey 옆에 붙인다
    healthSurvey: "서식 6",
    placementRequest: "서식 7",
    // 상급학교 진학도 배치 신청서 [서식 7]을 쓴다 (2026 운영계획 94쪽)
    advanceRequest: "서식 7",
    reassignRequest: "서식 8",
    deferralRequest: "서식 10",
    reenrollRequest: "서식 11",
    principalOpinion: "서식 12",
    privacyConsent: "서식 13",
    ldRecord: "서식 5",
    reassignList: "서식 1-❷",
    deferralList: "서식 1-❸",
    reenrollList: "서식 1-❺",
  },
  chungnam: {},
  gyeonggi: {},
  incheon: {},
  seoul: {},
};

/* ══════════════════════════════════════════════════════════
   서류를 어디서 얻는가

   담당자 인터뷰(2026.08)에서 나온 것 — 다른 소관 자료(진단서 등)가
   없는 채로 문의·신청이 들어와 되돌려 보내는 일이 잦다. 한 건이
   담당자 손을 세 번 네 번 탄다.

   원인은 서류 목록에 「어디서 떼는가」가 없었던 것이다. 학부모는
   서류 이름만 보고는 병원인지 읍면동인지 학교인지 알 수 없다.
   ══════════════════════════════════════════════════════════ */

export type FormSource =
  /** 교육지원청·특수교육지원센터가 배포하는 서식. 보호자가 받아 작성한다 */
  | "eduForm"
  /** 재학(예정) 학교가 작성·발급한다 */
  | "school"
  /** 병원 */
  | "hospital"
  /** 읍면동 행정복지센터 */
  | "townOffice"
  /** 담당자·학교가 취합한다. 보호자 몫이 아니다 */
  | "staff"
  /** 보호자가 이미 가지고 있는 것 */
  | "guardianKept";

/** 다른 기관에 먼저 가야 하는 출처. 이게 빠지면 접수가 되돌아간다 */
export const NEEDS_OTHER_OFFICE: FormSource[] = ["hospital", "townOffice", "school"];

export type FormSourceInfo = {
  sources: FormSource[];
  /** 안내문과 화면에 그대로 들어가는 문구 */
  where: string;
} & Sourced;

export const FORM_SOURCE: Record<FormKey, FormSourceInfo> = {
  deferralProof: {
    sources: ["hospital"],
    where: "사유에 맞는 서류를 냅니다 — 질병이면 병원 진단서, 유학 · 해외 출국이면 출입국 사실증명서 등",
    verified: true,
    source: "강원 2026 길잡이 6쪽(추가제출) · 경남 2026 지침 43~44쪽",
  },
  residentCopy: {
    sources: ["townOffice"],
    where: "읍면동 행정복지센터나 정부24에서 뗍니다 (주민등록번호 뒷자리는 가립니다)",
    verified: true,
    source: "강원 2026 길잡이 6쪽 · 경남 2026 지침 재배치 제출서류",
  },
  disabilityProof: {
    sources: ["townOffice"],
    where: "장애인 등록이 되어 있으면 복지카드를 복사하거나, 행정복지센터 · 정부24에서 장애인 증명서를 뗍니다",
    verified: true,
    source: "강원 2026 길잡이 6쪽(추가제출 · 해당자)",
  },
  medicalRecords: {
    sources: ["hospital"],
    where: "진료 · 검사를 받은 병원이나 치료기관에서 받습니다",
    verified: true,
    source: "강원 2026 길잡이 6쪽(추가제출 · 해당자)",
  },
  graduationCert: {
    sources: ["school"],
    where: "졸업했거나 다니는 학교에서 받습니다",
    verified: true,
    source: "강원 2026 길잡이 6쪽(추가제출 · 해당자)",
  },
  principalOpinionHigh: {
    sources: ["school"],
    where: "진학하려는 고등학교의 학교장 의견서를 받아, 지금 다니는 중학교를 통해 냅니다",
    verified: true,
    source: "강원 2026 길잡이 상급학교 진학 — 서식 16 (특목고 · 특성화고 · 자사고 · 대안학교)",
  },
  iepMinutes: {
    sources: ["staff"],
    where: "학교가 개별화교육지원팀 회의를 열고 회의록을 붙입니다",
    verified: true,
    source: "강원 2026 길잡이 6~7쪽 · 경남 2026 지침 재배치 · 유예 제출서류",
  },
  reassignList: {
    sources: ["staff"],
    where: "학교가 취합합니다. 보호자가 준비할 서류가 아닙니다",
    verified: true,
    source: "경남 2026 지침 서식 1-❷",
  },
  deferralList: {
    sources: ["staff"],
    where: "학교 · 교육지원청이 취합합니다. 보호자가 준비할 서류가 아닙니다",
    verified: true,
    source: "경남 2026 지침 서식 1-❸",
  },
  reenrollList: {
    sources: ["staff"],
    where: "학교가 취합합니다. 보호자가 준비할 서류가 아닙니다",
    verified: true,
    source: "경남 2026 지침 서식 1-❺",
  },
  principalOpinion: {
    // ⚠ 한 항목에 서로 다른 두 기관이 섞여 있다. 학부모가 판단하게 두면 안 된다
    sources: ["school", "townOffice"],
    where:
      "둘 중 하나를 준비합니다 — 재학(예정) 학교에서 「학교장 의견서」, " +
      "또는 읍면동 행정복지센터에서 「장애인증명서·복지카드」",
    verified: true,
    source: "강원·경남 지침 제출 서류 (2026.08 대조) — 택 1 항목",
  },
  basicSurvey: {
    sources: ["eduForm", "school"],
    where: "보호자용은 직접 작성하시고, 담임교사용은 학교에 요청합니다",
    verified: true,
    source: "강원 지침 — 기초조사 카드(보호자용 / 담임교사용)",
  },
  // 단독 서류로 목록에 오르지 않는다 — 기초조사 서류 옆에 서식 번호만 붙는다 (build-sheet)
  healthSurvey: {
    sources: ["eduForm", "school"],
    where: "건강장애일 때 기초조사서 대신 씁니다",
    verified: true,
    source: "경남 2026 선정·배치 업무 처리 지침 서식 6",
  },
  ldRecord: {
    sources: ["school"],
    where: "학교가 작성합니다 (사전 중재 6개월 이상 기록)",
    verified: true,
    source: "강원·경남 지침 — 학습장애는 최소 6개월 사전 중재 후 신청",
  },
  placementResultCopy: {
    sources: ["guardianKept"],
    where: "이전에 받으신 배치 결과통지서를 복사해 오시면 됩니다",
    verified: true,
    source: "이미 통보된 문서의 사본",
  },
  requestForm: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 작성합니다",
    verified: false,
    source: "서식 배포 경로(온라인·방문)는 지역마다 달라 확인 필요",
  },
  placementRequest: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 작성합니다",
    verified: false,
    source: "서식 배포 경로 확인 필요",
  },
  privacyConsent: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 서명합니다",
    verified: false,
    source: "서식 배포 경로 확인 필요",
  },
  advanceRequest: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 작성합니다",
    verified: false,
    source: "서식 배포 경로 확인 필요",
  },
  reassignRequest: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 작성합니다",
    verified: false,
    source: "서식 배포 경로 확인 필요",
  },
  deferralRequest: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 작성합니다",
    verified: false,
    source: "서식 배포 경로 확인 필요",
  },
  reenrollRequest: {
    sources: ["eduForm"],
    where: "신청처에서 서식을 받아 작성합니다",
    verified: false,
    source: "서식 배포 경로 확인 필요",
  },
  applicantList: {
    sources: ["staff"],
    where: "담당자·학교가 취합합니다. 보호자가 준비할 서류가 아닙니다",
    verified: false,
    source: "지침의 담당자 업무 항목 — 작성 주체 확인 필요",
  },
  advanceList: {
    sources: ["staff"],
    where: "담당자·학교가 취합합니다. 보호자가 준비할 서류가 아닙니다",
    verified: false,
    source: "지침의 담당자 업무 항목 — 작성 주체 확인 필요",
  },
};

/**
 * 지역마다 다른 발급처. FORM_SOURCE 를 덮는다.
 *
 * 기초조사 서류가 대표적이다 — 강원은 「보호자용 / 담임교사용」으로 갈라 **학교가 한 장을 쓴다.**
 * 경남은 「일반 / 건강장애」로 갈라 **장애 유형에 따라 서식이 달라진다.** 이름이 비슷한 서류인데
 * 누가 쓰는지가 다르다. 전역 문구를 그대로 쓰면 경남 학부모에게 「담임교사용을 학교에 요청하세요」라고
 * 안내하게 되고, 그런 서식이 없으니 헛걸음한다. 반송을 줄이려고 만든 칸이 반송을 만드는 셈이다.
 */
export const FORM_SOURCE_BY_REGION: Partial<
  Record<RegionId, Partial<Record<FormKey, FormSourceInfo>>>
> = {
  // 경남은 덮어쓰지 않는다 (2026-10-17). 2025판에 기초조사서를 「신청처에서 받아 보호자가 작성」으로 넣었는데
  // 2025 지침 원문 서식 3 아래에도 「담임교사가 작성함」이라고 적혀 있어 틀린 값이었다. 2026 지침은
  // 강원과 같이 보호자용[서식 3] · 담임교사용[서식 4]으로 나뉘고, 학교가 모아 공문에 첨부해 낸다.
  // 그래서 공통 값(보호자용은 직접 작성, 담임교사용은 학교에 요청)을 그대로 쓴다.
  // 학적이 없는 영유아(미취원 · 어린이집)는 서류를 센터에 직접 낸다 — 2026 지침 13~14쪽.
};

/** 그 지역의 발급처. 지역별 덮어쓰기가 있으면 그것을 쓴다 */
export function formSource(regionId: RegionId, key: FormKey): FormSourceInfo {
  return FORM_SOURCE_BY_REGION[regionId]?.[key] ?? FORM_SOURCE[key];
}

/* ══════════════════════════════════════════════════════════
   신청 상황 — 상황이 바뀌면 서류가 통째로 바뀐다
   ══════════════════════════════════════════════════════════ */

export type ProcedureId = "new" | "advance" | "reassign" | "deferral" | "reenroll";

export type Procedure = {
  id: ProcedureId;
  name: string;
  /** 어떤 문의일 때 고르는지 */
  when: string;
  /** 지역 목록(PROCEDURE_FORMS_BY_REGION)이 없을 때 쓰는 공통 목록 */
  forms: FormEntry[];
  /** 서류 목록에 덧붙일 주의사항 */
  notes: string[];
  deadlines: { label: string; when: string; urgent?: boolean }[];
} & Sourced;

export const PROCEDURES: Procedure[] = [
  {
    id: "new",
    name: "신규 선정",
    when: "특수교육대상자로 처음 선정받으려는 경우",
    forms: [
      "applicantList",
      "requestForm",
      "basicSurvey",
      "placementRequest",
      "principalOpinion",
      "privacyConsent",
    ],
    notes: [
      "학습장애로 의뢰할 때는 최소 6개월 이상 사전 중재를 거친 뒤 신청하고, 중재 기록지를 함께 냅니다.",
      "정서·행동장애로 의뢰할 때는 기초조사서 비고란에 의학적 처치·상담 내역·치료 경험을 적습니다.",
      "건강장애는 3개월 이상 장기 의료처치가 필요하다는 소견이 담긴 진단서가 필요합니다.",
      "학적이 없는 아동은 보호자가 직접 해당 특수교육지원센터로 상담·신청합니다.",
      "기초조사서의 행동특성·발달사항 란은 구체적으로 적어야 합니다. 「발달이 느림」처럼 짧게 적으면 " +
        "정보가 부족해 재요청하게 되고, 담당자가 담임교사에게 다시 확인해야 합니다. " +
        "언제부터 · 어떤 상황에서 · 어떻게 나타나는지를 예를 들어 적도록 안내하세요. (담당자 통화 확인)",
    ],
    deadlines: [
      { label: "진단·평가 실시", when: "교육장이 회부한 날로부터 30일 이내" },
      { label: "선정·배치 결과 통보", when: "진단·평가 결과보고 후 2주 이내" },
    ],
    verified: true,
    source: "강원·경남 교육청 지침 (2026.08 대조)",
  },
  {
    id: "advance",
    name: "상급학교 진학 배치",
    when: "이미 선정된 아동이 유→초, 초→중, 중→고로 올라가는 경우",
    forms: ["advanceList", "advanceRequest", "privacyConsent", "placementResultCopy"],
    notes: [
      "건강장애는 상급학교 진학 시, 학습장애·정서·행동장애는 중학교 진학 시 신규 선정 서류를 다시 제출해 재선정을 받아야 합니다.",
      "당해 연도에 선정된 학생은 진학 배치 서류만 냅니다.",
      "배치일은 다음 학년도 3월 1일입니다.",
      "특수학급 배치를 희망하면 거주지에서 가까운 설치교를 1~3지망까지 적습니다.",
    ],
    deadlines: [
      {
        label: "배치 희망교 작성",
        when: "3지망까지 작성 — 미작성 시 특수교육운영위원회 심사에 따라 임의 배치",
        urgent: true,
      },
      { label: "배치일", when: "다음 학년도 3월 1일" },
    ],
    verified: true,
    source: "강원·경남 교육청 지침 (2026.08 대조)",
  },
  {
    id: "reassign",
    name: "전학 · 재배치",
    when: "이사나 배치 유형 변경으로 학교를 옮기는 경우",
    forms: ["reassignRequest", "privacyConsent", "placementResultCopy"],
    notes: [
      "같은 유형으로 옮기는 것은 재배치, 다른 유형으로 옮기는 것은 배치변경입니다. 둘 다 특수교육운영위원회 심의 사항입니다.",
      "거주지 이전으로 인한 재배치는 심의 없이 먼저 배치하고 나중에 추인할 수 있습니다.",
      "거주지 이사로 인한 타 시·군·도 재배치는 개별화교육지원팀 회의를 생략합니다.",
      "주민등록등본은 서류 접수일 기준 1개월 이내 발급본이어야 합니다.",
    ],
    deadlines: [
      {
        label: "개별화교육계획(IEP) 송부",
        when: "전출일로부터 14일 이내에 전출교가 전입교로 송부",
        urgent: true,
      },
      {
        label: "고등학교 계열 변경 전·편입학",
        when: "2학년 1학기 성적산출 직전까지 가능 — 교육과정 미이수 시 불이익을 보호자에게 안내",
      },
    ],
    verified: true,
    source: "강원·경남 교육청 지침 (2026.08 대조)",
  },
  {
    id: "deferral",
    name: "취학유예 · 면제",
    when: "질병이나 장기입원 등으로 취학을 미루려는 경우",
    forms: ["deferralRequest", "deferralProof", "privacyConsent"],
    notes: [
      "취학유예 기간은 1년 이내입니다. 연장하려면 특수교육운영위원회 심의를 거쳐야 합니다.",
      "특수교육대상자는 고등학교까지 의무교육이므로 유예·면제는 예외적으로만 인정됩니다.",
      "유예·면제 기간에도 다음 학년도 재취학 여부를 학교장·교육장이 확인합니다.",
    ],
    deadlines: [
      { label: "다음 학년도 재취학 여부 확인", when: "12월 말", urgent: true },
      { label: "취학유예 기간", when: "1년 이내 — 연장은 운영위원회 심의" },
    ],
    verified: true,
    source: "강원 교육청 지침 (2026.08 확인)",
  },
  {
    id: "reenroll",
    name: "재취학",
    when: "유예·면제 중이던 아동이 다시 학교에 다니려는 경우",
    forms: ["reenrollRequest", "privacyConsent", "placementResultCopy"],
    notes: [
      "유예·면제로 학년 차이가 생긴 경우, 의무교육 해당 연수를 더한 연령까지 교육받을 권리가 있습니다.",
      "보호자는 소속 학교와 해당 특수교육지원센터에 먼저 상담한 뒤 학교를 통해 신청합니다.",
    ],
    deadlines: [{ label: "재취학 여부 확인", when: "각급학교장·교육장이 12월 말에 보호자에게 확인" }],
    verified: true,
    source: "강원 교육청 지침 (2026.08 확인)",
  },
];

/** 심사에 이의가 있을 때의 기한 — 상황과 무관하게 늘 붙는다 */
export const APPEAL_DEADLINES = [
  { label: "심사청구 결정 통보", when: "청구를 받은 날로부터 30일 이내" },
  { label: "행정심판 제기", when: "심사결정 통보를 받은 날로부터 90일 이내" },
];
