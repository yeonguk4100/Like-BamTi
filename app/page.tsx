"use client";

import { useMemo, useState } from "react";
import {
  CURRENT_SERVICES,
  DISABILITIES,
  LEVELS,
  PROCEDURES,
  REGIONS,
  UNREGISTERED_AREAS,
  type CurrentServiceId,
  type DisabilityId,
  type LevelId,
  type ProcedureId,
  type RegionId,
  type Track,
} from "./lib/data";
import {
  age9EndOfMonth,
  buildSheet,
  TRACK_LABEL,
  type ResolvedProgram,
} from "./lib/build-sheet";

const REPO = "https://github.com/yeonguk4100/Like-BamTi";
const REPO_DOCS = `${REPO}/tree/main/docs`;

type ViewMode = "all" | "grouped";
type TrackFilter = Track | "all";

const TRACK_ORDER: Track[] = ["education", "welfare", "medical"];

const TRACK_DESC: Record<Track, string> = {
  education: "특수교육대상자로 선정되어야 받을 수 있습니다",
  welfare: "읍면동 행정복지센터에 따로 신청해야 합니다",
  medical: "병원에서 먼저 받아야 합니다",
};

const LOOKUP_TARGETS = [
  { id: "guide", label: "선정·배치 지침 문서", hint: "이 교육청 지침이 어디 있는지" },
  { id: "card", label: "바우처 카드 안내", hint: "치료지원·방과후 카드 공식 페이지" },
  { id: "local", label: "지역 자체 지원사업", hint: "그 지역에만 있는 사업" },
] as const;

type LookupResult = {
  answer: string | null;
  sources: { uri: string; title: string }[];
  queries: string[];
  note?: string;
};

const STEPS = [
  { no: 1, title: "조건 입력", desc: "상담하면서 아동 조건을 고릅니다", href: "#step1" },
  { no: 2, title: "결과 확인", desc: "확인할 제도·마감일·서류가 정리됩니다", href: "#step2" },
  { no: 3, title: "안내문 전달", desc: "학부모용 안내문을 출력해 건넵니다", href: "#step3" },
];

/* ⚠ 데모용 — 발표 후 삭제. 전부 가상 사례다. */
type Preset = {
  id: string;
  label: string;
  note: string;
  regionId: RegionId;
  disabilityId: DisabilityId;
  levelId: LevelId;
  birthDate: string;
  currentServices: CurrentServiceId[];
};

const PRESETS: Preset[] = [
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
    label: "경남 · 지적장애 · 중학교",
    note: "폐지 용어 경고가 뜸",
    regionId: "gyeongnam",
    disabilityId: "intellectual",
    levelId: "middle",
    birthDate: "2013-05-20",
    currentServices: ["rehabVoucher"],
  },
  {
    id: "c",
    label: "강원 · 발달지체 · 유치원",
    note: "만 9세 종료일 계산",
    regionId: "gangwon",
    disabilityId: "developmentalDelay",
    levelId: "kinder",
    birthDate: "2021-08-02",
    currentServices: [],
  },
  {
    id: "d",
    label: "충남 · 발달지체 · 취학 예정",
    note: "지역만 바뀌면 카드 이름이 바뀜",
    regionId: "chungnam",
    disabilityId: "developmentalDelay",
    levelId: "elementary",
    birthDate: "2019-11-27",
    currentServices: ["localChildCenter", "rehabVoucher"],
  },
  {
    id: "e",
    label: "서울 · 자폐성장애 · 고등학교",
    note: "도교육청 결정 · 중복 확인",
    regionId: "seoul",
    disabilityId: "autism",
    levelId: "high",
    birthDate: "2010-02-11",
    currentServices: ["togetherCare"],
  },
];

/* ⚠ 데모용 — 장애영역별 실제 진단·증후군 용어. 상세 칸에 무엇을 적는지 보여주는
   참고 목록이다. 발표 후 삭제하거나, 남긴다면 입력 자동완성 사전으로 쓴다. */
const DEMO_TERMS: Record<DisabilityId, { group: string; items: string }[]> = {
  autism: [
    {
      group: "DSM-5 통합 이전 하위 유형",
      items:
        "자폐성 장애 · 아스퍼거 증후군 · 소아기 붕괴성 장애 · 비전형 자폐(PDD-NOS) · 레트 장애",
    },
    {
      group: "정도 표현",
      items:
        "지원 요구 1·2·3단계(DSM-5) · 고기능 / 저기능(임상 통용, 공식 진단명 아님) · 지적장애 동반 / 비동반",
    },
    {
      group: "자주 동반되는 것",
      items: "ADHD · 감각처리 어려움 · 표현언어 지연 · 뇌전증 · 수면 문제 · 편식·섭식 문제",
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
        "다운 증후군(21 삼염색체) · 취약 X 증후군(FMR1, 유전성 지적장애 최다 원인) · 프래더-윌리 증후군 · 엔젤만 증후군 · 윌리엄스 증후군 · 레트 증후군(MECP2) · 스미스-마제니스 증후군 · 코넬리아 드 랑게 증후군 · 묘성 증후군(5p 결실) · 22q11.2 결실 증후군(디조지) · 결절성 경화증",
    },
    {
      group: "⚠ 같은 병을 여러 이름으로 부르는 예",
      items:
        "엔젤만 증후군 = 엔젤 증후군 = 행복한 인형 증후군(happy puppet) = 속칭 「스마일 증후군」. 진단서에는 Angelman syndrome으로 적힙니다. 보호자가 말한 이름과 서류의 이름이 다를 수 있습니다.",
    },
    {
      group: "대사·내분비 질환",
      items: "페닐케톤뇨증(PKU) · 갈락토스혈증 · 선천성 갑상선기능저하증 · 뮤코다당증",
    },
    {
      group: "후천·환경 요인",
      items:
        "태아알코올증후군(FAS) · 저산소성 허혈성 뇌손상 · 뇌수막염·뇌염 후유증 · 조산·극저체중 출생 · 납 중독",
    },
    {
      group: "정도 표현",
      items:
        "경도 · 중등도 · 중도 · 최중도 (DSM-5는 IQ 수치보다 개념·사회·실행 적응기능을 기준으로 봅니다)",
    },
  ],
  developmentalDelay: [
    {
      group: "지연 영역 (시행령이 정한 다섯 가지)",
      items: "신체(대근육·소근육) · 인지 · 의사소통(수용·표현) · 사회·정서 · 적응행동",
    },
    {
      group: "묶어 부르는 진단",
      items:
        "전반적 발달지연(GDD) · 언어발달지체 · 말소리장애(조음음운) · 아동기 발병 유창성장애 · 발달성 협응장애(DCD)",
    },
    {
      group: "배경으로 적히는 것",
      items:
        "조산·극저체중 출생 · 뇌성마비 초기 소견 · 유전 검사 진행 중 · 원인 미확인 · 감각처리 어려움",
    },
    {
      group: "⚠ 확인할 것",
      items:
        "만 9세가 되기 전에 재선정해야 지원이 이어집니다. 다문화 배경 아동은 최근 6개월간 언어치료·학습지도 등 사전 중재를 받았는지 먼저 확인합니다(경남 지침).",
    },
  ],
  other: [
    {
      group: "시각장애",
      items:
        "저시력 · 전맹 · 망막색소변성 · 시신경 위축 · 백색증 · 선천성 녹내장 · 레베르 선천성 흑암시 · 미숙아 망막병증",
    },
    {
      group: "청각장애",
      items:
        "감각신경성 난청 · 전음성 난청 · 혼합성 난청 · 일측성 난청 · 인공와우 이식 · 보청기 착용 · 청신경병증",
    },
    {
      group: "지체장애",
      items:
        "뇌성마비(경직형·무정위형·혼합형) · 이분척추 · 듀센형 근이영양증 · 척수성 근위축(SMA) · 골형성부전증 · 선천성 사지결손 · 관절굽음증 · 척수손상",
    },
    {
      group: "정서·행동장애",
      items:
        "우울 · 불안 · 반항성 도전장애(ODD) · 품행장애 · 선택적 함묵증 · 애착 문제 · 틱·뚜렛. ⚠ ADHD와 정신질환은 정서·행동장애 선정 대상이 아니라고 경남 지침에 명시돼 있습니다",
    },
    {
      group: "의사소통장애",
      items: "조음음운장애 · 말더듬(유창성) · 음성장애 · 수용·표현 언어장애 · 아동기 말실행증",
    },
    { group: "학습장애", items: "난독증(읽기) · 난서증(쓰기) · 난산증(수학) · 주의집중 어려움" },
    {
      group: "건강장애",
      items:
        "소아암·백혈병 · 만성신부전(투석) · 선천성 심장질환 · 1형 당뇨 · 재생불량성빈혈 · 크론병 · 뇌전증 · 장기이식 후 관리. ⚠ 3개월 이상 장기 의료처치가 필요하다는 소견이 진단서에 있어야 합니다",
    },
    {
      group: "두 가지 이상 중복된 장애",
      items:
        "중도중복장애(지적 또는 자폐성 + 시각·청각·지체·정서행동 중 하나, 각각 정도가 심한 경우) · 시청각장애(deafblind)",
    },
  ],
};

/* ⚠ 데모용 — 발표자 키워드. 빈 자리에 초록으로 띄운다. 발표 후 삭제. */
function DemoKey({
  children,
  top,
  right,
  left,
  bottom,
}: {
  children: React.ReactNode;
  top?: number | string;
  right?: number | string;
  left?: number | string;
  bottom?: number | string;
}) {
  return (
    <span className="demo-key" style={{ top, right, left, bottom }} aria-hidden="true">
      {children}
    </span>
  );
}

export default function Home() {
  const [regionId, setRegionId] = useState<RegionId>("gangwon");
  const [disabilityId, setDisabilityId] = useState<DisabilityId>("autism");
  const [levelId, setLevelId] = useState<LevelId>("elementary");
  const [procedureId, setProcedureId] = useState<ProcedureId>("new");
  const [birthDate, setBirthDate] = useState("2019-03-14");
  const [currentServices, setCurrentServices] = useState<CurrentServiceId[]>(["localChildCenter"]);
  const [otherDisabilityLabel, setOtherDisabilityLabel] = useState("");
  const [detailNote, setDetailNote] = useState("");
  const [copied, setCopied] = useState(false);

  /* AI 안내문 — 조건별로 캐시한다. 조건이 바뀌면 자동으로 템플릿으로 돌아간다 */
  const [aiCache, setAiCache] = useState<Record<string, string>>({});
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  /* AI 웹 검색 — 지역+항목별로 캐시한다 */
  const [lookupCache, setLookupCache] = useState<Record<string, LookupResult>>({});
  const [lookupBusy, setLookupBusy] = useState("");
  const [lookupError, setLookupError] = useState("");

  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  /* ⚠ 데모용 — 발표 후 삭제 */
  const [presetId, setPresetId] = useState<string>("a");

  function applyPreset(p: Preset) {
    setPresetId(p.id);
    setRegionId(p.regionId);
    setDisabilityId(p.disabilityId);
    setLevelId(p.levelId);
    setBirthDate(p.birthDate);
    setCurrentServices(p.currentServices);
    setOtherDisabilityLabel("");
    setDetailNote("");
  }

  const sheet = useMemo(
    () =>
      buildSheet({
        regionId,
        disabilityId,
        levelId,
        procedureId,
        birthDate,
        currentServices,
        otherDisabilityLabel,
        detailNote,
      }),
    [
      regionId,
      disabilityId,
      levelId,
      procedureId,
      birthDate,
      currentServices,
      otherDisabilityLabel,
      detailNote,
    ]
  );

  const counts = useMemo(() => {
    const c: Record<Track, number> = { education: 0, welfare: 0, medical: 0 };
    for (const p of sheet.programs) c[p.track] += 1;
    return c;
  }, [sheet.programs]);

  const visiblePrograms = useMemo(
    () =>
      trackFilter === "all" ? sheet.programs : sheet.programs.filter((p) => p.track === trackFilter),
    [sheet.programs, trackFilter]
  );

  const urgentCount = sheet.deadlines.filter((d) => d.urgent).length;
  const otherTrackCount = counts.welfare + counts.medical;
  const firstUrgent = sheet.deadlines.find((d) => d.urgent);
  /* 발달지체는 만 9세 생일이 지원 종료 기준이라 날짜가 계산된다 */
  const age9Date =
    sheet.disability.reselection === "age9" ? age9EndOfMonth(birthDate) : null;

  /* AI로 보내는 내용. 생년월일과 상세 메모는 넣지 않는다 */
  const aiPayload = useMemo(
    () => ({
      지역: sheet.region.name,
      교육청: sheet.region.officeName,
      장애영역: sheet.disabilityLabel,
      학교급: sheet.level.name,
      제출처: sheet.level.submitTo,
      심사기구: sheet.level.committee,
      결정권자: sheet.level.decider,
      신청상황: sheet.procedure.name,
      상황설명: sheet.procedure.when,
      제출서류: sheet.documents.map((d) => `${d.label} [${d.formNo}]`),
      상황주의사항: sheet.procedure.notes,
      마감일: sheet.deadlines.map((d) => ({
        항목: d.label,
        기한: d.when,
        긴급: Boolean(d.urgent),
      })),
      확인할제도: sheet.programs.map((pg) => ({
        이름: pg.resolvedName,
        소관: TRACK_LABEL[pg.track],
        신청처: pg.resolvedApplyTo,
      })),
      확인이필요한항목: sheet.warnings.map((w) => ({ 제목: w.title, 내용: w.detail })),
    }),
    [sheet]
  );

  const aiKey = useMemo(() => JSON.stringify(aiPayload), [aiPayload]);
  const aiLetter = aiCache[aiKey];
  const shownLetter = aiLetter ?? sheet.parentLetter;

  async function rewriteWithAi() {
    if (aiStatus === "loading") return;
    setAiStatus("loading");
    setAiError("");
    try {
      const res = await fetch("/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.letter) {
        setAiError(data.error ?? "안내문을 받지 못했습니다.");
        setAiStatus("error");
        return;
      }
      setAiCache((prev) => ({ ...prev, [aiKey]: data.letter }));
      setAiStatus("idle");
    } catch {
      setAiError("요청을 보내지 못했습니다. 네트워크를 확인하세요.");
      setAiStatus("error");
    }
  }

  async function runLookup(target: string) {
    const cacheKey = `${regionId}:${target}`;
    if (lookupBusy || lookupCache[cacheKey]) return;
    setLookupBusy(target);
    setLookupError("");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          regionName: sheet.region.name,
          officeName: sheet.region.officeName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? "검색에 실패했습니다.");
      } else {
        setLookupCache((prev) => ({ ...prev, [cacheKey]: data }));
      }
    } catch {
      setLookupError("요청을 보내지 못했습니다.");
    } finally {
      setLookupBusy("");
    }
  }

  function toggleService(id: CurrentServiceId) {
    setCurrentServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(shownLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <a className="skip" href="#main">
        본문 바로가기
      </a>

      {/* ═══════ 헤더 ═══════ */}
      <div className="util-bar">
        <div className="util-inner">
          <a href={REPO_DOCS} target="_blank" rel="noreferrer">
            기획서
          </a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>

      <header className="gnb">
        <div className="gnb-inner">
          <a href="#main" className="logo">
            <span className="logo-mark">특수교육</span>
            <span className="logo-name">너도나도 길잡이</span>
          </a>
          <nav className="gnb-menu" aria-label="바로가기">
            <a href="#step1" className="btn btn-primary btn-sm">
              상담 시작
            </a>
          </nav>
        </div>
      </header>

      <nav className="tabnav" aria-label="주 메뉴">
        <div className="tabnav-inner">
          {STEPS.map((s) => (
            <a
              key={s.no}
              href={s.href}
              className={`tab ${activeStep === s.no ? "tab-on" : ""}`}
              onClick={() => setActiveStep(s.no)}
            >
              {s.title}
            </a>
          ))}
          <a href="#reference" className="tab">
            참고 자료
          </a>
        </div>
      </nav>

      <div className="notice">
        <div className="notice-inner">
          <span className="notice-tag">안내</span>
          <p>
            이 도구는 <strong>개인정보를 저장하지 않습니다.</strong> 이름·연락처를 받지 않으며,
            입력값은 화면 계산에만 쓰이고 서버로 전송되지 않습니다. 화면의 아동 정보는 전부
            가상입니다.
          </p>
        </div>
      </div>

      <div className="greeting">
        <h2>담당자님, 안녕하세요.</h2>
        <p>“소관이 달라도, 한 화면에서 확인하실 수 있습니다”</p>
      </div>

      {/* ═══════ 페이지 머리 ═══════ */}
      <div className="page-head">
        <div className="page-head-inner rel">
          <DemoKey top={72} right={0}>
            {`소관이 네 갈래
교육 · 복지 · 의료 · 고용

전 과정이 신청주의
알려주는 주체가 없다`}
          </DemoKey>
          <p className="crumb">홈 &gt; 상담 지원 &gt; 특수교육 지원제도 확인</p>
          <h1 className="h-xl">특수교육 지원제도 상담 지원</h1>
          <p className="lead">
            학부모 문의를 받았을 때 아동의 조건을 입력하면, <strong>교육청·복지부·의료로 갈라진
            제도</strong>를 한 화면에 모아 확인할 제도와 마감일·준비 서류·근거를 정리해 드립니다.
            학부모용 안내문을 작성합니다.
          </p>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.no}>
              <a
                href={s.href}
                className={`step ${activeStep === s.no ? "step-on" : ""}`}
                onClick={() => setActiveStep(s.no)}
              >
                <span className="step-num">{s.no}</span>
                <span>
                  <strong>{s.title}</strong>
                  <br />
                  <span className="b-sm">{s.desc}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <main id="main">
        {/* ═══════ 1단계 · 조건 입력 ═══════ */}
        <section className="section wrap" id="step1">
          <div className="section-head">
            <h2 className="h-lg">1. 조건 입력</h2>
          </div>

          <table className="form-table">
            <caption className="skip">아동 조건 입력</caption>
            <tbody>
              {/* ⚠ 데모용 행 — 발표 후 삭제 */}
              <tr>
                <th scope="row">데모 사례</th>
                <td className="rel">
                  <div className="preset-row">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`preset ${presetId === p.id ? "preset-on" : ""}`}
                        onClick={() => applyPreset(p)}
                      >
                        <strong>{p.label}</strong>
                        <span>{p.note}</span>
                      </button>
                    ))}
                  </div>
                  <span className="hint">
                    전부 가상 사례입니다. 실제 아동 정보가 아닙니다.
                    <span className="demo-key-inline">
                      시연 순서 ① 기본 → ② 경고 → ③ 만9세 → ④ 지역차 → ⑤ 고교
                    </span>
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  신청 상황<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {PROCEDURES.map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        className={`chip ${x.id === procedureId ? "chip-on" : ""}`}
                        aria-pressed={x.id === procedureId}
                        onClick={() => setProcedureId(x.id)}
                      >
                        {x.name}
                      </button>
                    ))}
                  </div>
                  <span className="hint">{sheet.procedure.when}</span>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  거주 지역<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {REGIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`chip ${r.id === regionId ? "chip-on" : ""}`}
                        aria-pressed={r.id === regionId}
                        onClick={() => setRegionId(r.id)}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                  <span className="hint">
                    지역을 바꾸면 제도 명칭과 제출 서식 번호가 함께 바뀝니다.
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  장애영역<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {DISABILITIES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`chip ${d.id === disabilityId ? "chip-on" : ""}`}
                        aria-pressed={d.id === disabilityId}
                        onClick={() => setDisabilityId(d.id)}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>

                  {disabilityId === "other" && (
                    <div className="sub-field">
                      <label htmlFor="otherArea" className="sub-label">
                        장애영역 직접 입력
                      </label>
                      <input
                        id="otherArea"
                        type="text"
                        className="text-input"
                        value={otherDisabilityLabel}
                        onChange={(e) => setOtherDisabilityLabel(e.target.value)}
                        placeholder="예: 정서·행동장애"
                      />
                      <span className="hint">
                        특수교육법 시행령 제10조는 11개 영역을 정하고 있습니다. 아직 이 도구에 검사
                        도구가 등록되지 않은 영역: {UNREGISTERED_AREAS}
                      </span>
                    </div>
                  )}

                  <div className="sub-field">
                    <label htmlFor="detailNote" className="sub-label">
                      {sheet.disability.detailLabel} <span className="opt">선택</span>
                    </label>
                    <input
                      id="detailNote"
                      type="text"
                      className="text-input"
                      value={detailNote}
                      onChange={(e) => setDetailNote(e.target.value)}
                      placeholder={sheet.disability.detailPlaceholder}
                    />
                    <span className="hint">
                      {sheet.disability.detailHint} 상담에서 들은 표현을 그대로 적으셔도 됩니다.
                      확인 시트에만 참고로 표시되며 판정이나 검사 선택에는 쓰이지 않습니다.
                    </span>
                  </div>

                  {/* ⚠ 데모용 참고 용어 — 발표 후 삭제 */}
                  <div className="demo-terms">
                    <p className="demo-terms-head">
                      참고 용어 · {sheet.disability.name} — 아래 표현을 위 칸에 적을 수 있습니다
                    </p>
                    {DEMO_TERMS[disabilityId].map((g) => (
                      <p key={g.group} className="demo-terms-row">
                        <strong>{g.group}</strong>
                        {g.items}
                      </p>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  학교급<span className="req">*</span>
                </th>
                <td>
                  <div className="chip-row">
                    {LEVELS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        className={`chip ${l.id === levelId ? "chip-on" : ""}`}
                        aria-pressed={l.id === levelId}
                        onClick={() => setLevelId(l.id)}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <label htmlFor="birth">생년월일</label>
                </th>
                <td>
                  <input
                    id="birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                  <span className="hint">
                    재선정 마감일 계산에만 사용하며 저장하지 않습니다. (발달지체는 만 9세 생일 기준)
                  </span>
                  <span className="demo-key-inline">
                    ← 개인정보 아님 · 마감 계산용 · 저장 안 함
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">현재 이용 중인 서비스</th>
                <td>
                  <div className="chip-row">
                    {CURRENT_SERVICES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`chip ${currentServices.includes(s.id) ? "chip-on" : ""}`}
                        aria-pressed={currentServices.includes(s.id)}
                        onClick={() => toggleService(s.id)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  <span className="hint">중복 이용 제한이 있는 조합을 확인해 드립니다.</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="btn-row">
            <a
              href="#step2"
              className="btn btn-primary"
              onClick={() => setActiveStep(2)}
            >
              결과 확인하기
            </a>
          </div>
        </section>

        {/* ═══════ 2단계 · 결과 ═══════ */}
        <section className="section section-gray" id="step2">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h-lg">2. 결과 확인</h2>
              <span className="b-sm subtle right">조건을 바꾸면 결과가 바로 다시 계산됩니다</span>
            </div>

            {/* 조건 요약 */}
            <div className="summary-bar">
              <span className="sum-label">현재 조건</span>
              <span className="sum-item">{sheet.region.name}</span>
              <span className="sum-sep">|</span>
              <span className="sum-item">{sheet.disabilityLabel}</span>
              <span className="sum-sep">|</span>
              <span className="sum-item">{sheet.level.name}</span>
              {sheet.age !== null && (
                <>
                  <span className="sum-sep">|</span>
                  <span className="sum-item">만 {sheet.age}세</span>
                </>
              )}
              <a href="#step1" onClick={() => setActiveStep(1)}>
                조건 수정
              </a>
            </div>

            {/* 요약 카드 */}
            <div className="tint-card rel">
              <DemoKey top={12} right={12}>
                {`소관 밖 N건 ← 이 숫자가 값
지금은 담당자가 손으로 찾는 몫

첫 사용에서 바로 세지는 0차 지표`}
              </DemoKey>
              <p className="tint-title">이번 상담에서 확인할 항목</p>
              <p className="tint-line">
                {sheet.region.name} · {sheet.disabilityLabel} · {sheet.level.name}
              </p>
              <p className="tint-line">
                진단·평가 제출처 : {sheet.level.submitTo} · 결정 : {sheet.level.decider}
              </p>
              {sheet.age !== null && (
                <p className="tint-line">
                  만 {sheet.age}세 · {sheet.ageBasis}
                </p>
              )}

              <div className="subcard-grid">
                <div className="subcard">
                  <span className="subcard-label">확인할 제도</span>
                  <p className="subcard-val">
                    {sheet.programs.length}
                    <span className="unit">건</span>
                  </p>
                  <span className="subcard-sub">교육청 {counts.education}건 포함</span>
                </div>
                <div className="subcard">
                  <span className="subcard-label">소관 밖 제도</span>
                  <p className="subcard-val">
                    {otherTrackCount}
                    <span className="unit">건</span>
                  </p>
                  <span className="subcard-sub">복지부·의료 — 따로 신청해야 함</span>
                </div>
                <div className="subcard">
                  <span className="subcard-label">날짜가 있는 마감</span>
                  <p className="subcard-val">
                    {sheet.deadlines.length}
                    <span className="unit">개</span>
                  </p>
                  <span className="subcard-sub">그중 긴급 {urgentCount}개</span>
                </div>
                <div className="subcard subcard-alert">
                  <span className="subcard-label">확인이 필요한 항목</span>
                  <p className="subcard-val">
                    {sheet.warnings.length}
                    <span className="unit">건</span>
                  </p>
                  <span className="subcard-sub">아래 시트 맨 위에 표시</span>
                </div>
              </div>

              <div className="click-pill-row">
                <a href="#reference" className="click-pill">
                  이 숫자가 무슨 뜻인가요 →
                </a>
              </div>

              <div className="card-actions">
                <button type="button" className="card-action" onClick={() => window.print()}>
                  인쇄하기
                </button>
                <button type="button" className="card-action" onClick={copyLetter}>
                  {copied ? "복사했습니다" : "안내문 복사"}
                </button>
              </div>
            </div>

            {/* 상태 카드 — 가장 급한 것 하나만 크게 */}
            {age9Date ? (
              <div className="tint-card rel">
                <DemoKey top={12} right={12}>
                  {`이미 받던 지원이 끊긴다
만 9세 생일 = 종료 기준

생년월일에서 계산되는 실제 날짜
지침에 담당자 의무로 명시`}
                </DemoKey>
                <p className="tint-title">발달지체 지원 종료 예정일</p>
                <p className="tint-status">{age9Date}</p>
                <p className="tint-note">
                  이 날짜까지 유지된 뒤 종료됩니다. 그 전에 재진단·재선정을 해야 방과후 교육활동과
                  치료지원이 끊기지 않습니다.
                </p>
                <div className="card-actions">
                  <a href="#deadlines" className="card-action">
                    마감일 전체 보기
                  </a>
                    <a href="#step3" className="card-action">
                    안내문 확인
                  </a>
                </div>
              </div>
            ) : (
              firstUrgent && (
                <div className="tint-card">
                  <p className="tint-title">{firstUrgent.label}</p>
                  <p className="tint-status">기한 확인 필요</p>
                  <p className="tint-note">{firstUrgent.when}</p>
                  <div className="card-actions">
                    <a href="#deadlines" className="card-action">
                      마감일 전체 보기
                    </a>
                        <a href="#step3" className="card-action">
                      안내문 확인
                    </a>
                  </div>
                </div>
              )
            )}

            <div className="result-grid rel">
              <DemoKey top={0} left={-260}>
                {`한꺼번에 보기 = 부처를 넘는 증거
소관별 보기 = 어디로 보낼지

판정하지 않는다
확인 목록만 준다`}
              </DemoKey>
              <DemoKey top={0} right={-260}>
                {`한 번 입력 → 두 장
담당자용 · 학부모용

그대로 출력해서 건넨다
= 안내 기록이 남는다`}
              </DemoKey>
              {/* ── 담당자용 ── */}
              <section className="panel">
                <div className="panel-head">
                  <h3 className="h-sm">담당자용 확인 시트</h3>
                  <span className="b-sm subtle right">{sheet.region.officeName}</span>
                </div>
                <div className="panel-body">
                  {sheet.warnings.length > 0 && (
                    <div className="block">
                      <h4 className="block-title">
                        확인이 필요한 항목
                        <span className="count">{sheet.warnings.length}건</span>
                      </h4>
                      {sheet.warnings.map((w, i) => (
                        <div key={i} className={`alert ${alertClass(w.kind)}`}>
                          <span className="alert-tag">{alertTag(w.kind)}</span>
                          <p className="alert-title">{w.title}</p>
                          <p className="alert-detail">{w.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="block">
                    <h4 className="block-title">
                      제출 서류
                      <span className="count">
                        {sheet.procedure.name} · {sheet.documents.length}종
                      </span>
                    </h4>
                    <table className="tbl">
                      <caption className="skip">신청 상황별 제출 서류</caption>
                      <thead>
                        <tr>
                          <th scope="col">서류</th>
                          <th scope="col" style={{ width: "34%" }}>
                            {sheet.region.officeName} 서식
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.documents.map((d) => (
                          <tr key={d.key}>
                            <th scope="row">{d.label}</th>
                            <td className={d.formNo.includes("미확인") ? "td-sub" : ""}>
                              {d.formNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sheet.procedure.notes.length > 0 && (
                      <ul className="notes">
                        {sheet.procedure.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="block" id="deadlines">
                    <h4 className="block-title">
                      마감일
                      {urgentCount > 0 && <span className="count">긴급 {urgentCount}건</span>}
                    </h4>
                    <table className="tbl">
                      <caption className="skip">항목별 마감일</caption>
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: "34%" }}>
                            항목
                          </th>
                          <th scope="col">기한</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.deadlines.map((d, i) => (
                          <tr key={i} className={d.urgent ? "row-urgent" : ""}>
                            <th scope="row">
                              {d.urgent && <span className="badge badge-danger">긴급</span>}{" "}
                              {d.label}
                            </th>
                            <td className="td-sub">{d.when}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="block">
                    <h4 className="block-title">이번 진단·평가에 들어가는 검사</h4>
                    {sheet.detailNote && (
                      <p className="detail-line">
                        <strong>상세 유형 · 특성</strong> {sheet.detailNote}
                        <span className="hint" style={{ marginTop: 4 }}>
                          담당자가 입력한 참고 정보입니다. 검사 선택이나 판정에는 쓰이지 않습니다.
                        </span>
                      </p>
                    )}
                    {sheet.disability.tests.length === 0 ? (
                      <p className="hint" style={{ marginTop: 0 }}>
                        이 영역의 검사 도구는 아직 등록되지 않았습니다. 소속 교육청 지침에서
                        확인하세요.
                      </p>
                    ) : (
                    <table className="tbl">
                      <caption className="skip">장애영역별 검사 도구</caption>
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: 68 }}>
                            구분
                          </th>
                          <th scope="col" style={{ width: "28%" }}>
                            검사 영역
                          </th>
                          <th scope="col">검사 도구</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.disability.tests.map((t, i) => (
                          <tr key={i}>
                            <td>
                              <span className={`badge ${t.required ? "badge-req" : ""}`}>
                                {t.required ? "필수" : "선택"}
                              </span>
                            </td>
                            <th scope="row">{t.label}</th>
                            <td className="td-sub">{t.items}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    )}
                    {sheet.disability.note && (
                      <p className="hint">{sheet.disability.note}</p>
                    )}
                  </div>

                  <div className="block">
                    <h4 className="block-title">
                      확인해야 할 제도
                      <span className="count">{sheet.programs.length}건</span>
                    </h4>

                    <div className="controls">
                      <div className="seg" role="group" aria-label="보기 방식">
                        <button
                          type="button"
                          className={`seg-btn ${viewMode === "grouped" ? "seg-on" : ""}`}
                          aria-pressed={viewMode === "grouped"}
                          onClick={() => setViewMode("grouped")}
                        >
                          소관별로 보기
                        </button>
                        <button
                          type="button"
                          className={`seg-btn ${viewMode === "all" ? "seg-on" : ""}`}
                          aria-pressed={viewMode === "all"}
                          onClick={() => setViewMode("all")}
                        >
                          한꺼번에 보기
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`chip chip-filter ${trackFilter === "all" ? "chip-on" : ""}`}
                        onClick={() => setTrackFilter("all")}
                      >
                        전체 {sheet.programs.length}
                      </button>
                      {TRACK_ORDER.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`chip chip-filter ${trackFilter === t ? "chip-on" : ""}`}
                          onClick={() => setTrackFilter(t)}
                          disabled={counts[t] === 0}
                        >
                          {TRACK_LABEL[t]} {counts[t]}
                        </button>
                      ))}
                    </div>

                    {trackFilter === "all" && viewMode === "all" && (
                      <p className="hint" style={{ marginBottom: 16 }}>
                        교육청·복지부·의료가 섞여 있습니다. 이 목록이 한 화면에 있다는 것이 이 도구의
                        핵심입니다.
                      </p>
                    )}

                    {viewMode === "all"
                      ? visiblePrograms.map((p) => <ProgramItem key={p.id} program={p} />)
                      : TRACK_ORDER.filter((t) => trackFilter === "all" || t === trackFilter).map(
                          (t) => {
                            const list = visiblePrograms.filter((p) => p.track === t);
                            if (list.length === 0) return null;
                            return (
                              <div key={t} className="group">
                                <div className="group-head">
                                  <span
                                    className={`badge ${t === "education" ? "badge-primary" : ""}`}
                                  >
                                    {TRACK_LABEL[t]}
                                  </span>
                                  <span className="b-sm subtle">{TRACK_DESC[t]}</span>
                                  <span className="group-count">{list.length}건</span>
                                </div>
                                {list.map((p) => (
                                  <ProgramItem key={p.id} program={p} />
                                ))}
                              </div>
                            );
                          }
                        )}

                    {visiblePrograms.length === 0 && (
                      <p className="hint">이 조건에 해당하는 제도가 없습니다.</p>
                    )}

                    {sheet.excludedByAge.length > 0 && (
                      <details className="fold">
                        <summary>
                          나이 조건으로 목록에서 빠진 제도 {sheet.excludedByAge.length}건
                        </summary>
                        <ul className="notes">
                          {sheet.excludedByAge.map((x, i) => (
                            <li key={i}>
                              {x.name} — {x.reason} (만 {sheet.age}세, {sheet.ageBasis})
                            </li>
                          ))}
                        </ul>
                        <p className="hint">
                          나이 상한에는 재학 중 연장 같은 예외 규정이 있습니다. 해당 연도 사업안내를
                          확인하세요.
                        </p>
                      </details>
                    )}

                    {!sheet.hasLocalPrograms && (
                      <div className="fold-static">
                        <p className="h-xs">{sheet.region.name} 자체사업 0건</p>
                        <p className="hint" style={{ marginTop: 4 }}>
                          위 목록은 전국 공통 제도입니다. 지자체·교육청 자체사업은 아직 등록되지
                          않았습니다.
                          {sheet.localSources.length > 0 && " 조사할 곳: "}
                          {sheet.localSources.join(" · ")}
                        </p>
                      </div>
                    )}

                    {/* 빈칸을 AI가 웹에서 찾아본다 */}
                    <div className="fold-static">
                      <p className="h-xs">이 지역 정보를 AI가 찾아봅니다</p>
                      <p className="hint" style={{ marginTop: 4, marginBottom: 12 }}>
                        우리 데이터에 없는 칸입니다. 제미나이가 웹을 검색해 후보를 찾고 출처를
                        함께 보여줍니다. <strong>확정이 아니므로 담당자가 확인해야 합니다.</strong>
                      </p>

                      <div className="chip-row" style={{ marginBottom: 12 }}>
                        {LOOKUP_TARGETS.map((t) => {
                          const cacheKey = `${regionId}:${t.id}`;
                          const done = Boolean(lookupCache[cacheKey]);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className="chip chip-filter"
                              onClick={() => runLookup(t.id)}
                              disabled={Boolean(lookupBusy) || done}
                              title={t.hint}
                            >
                              {lookupBusy === t.id
                                ? "찾고 있습니다…"
                                : done
                                  ? `${t.label} ✓`
                                  : t.label}
                            </button>
                          );
                        })}
                      </div>

                      {lookupError && <p className="ai-error">{lookupError}</p>}

                      {LOOKUP_TARGETS.map((t) => {
                        const r = lookupCache[`${regionId}:${t.id}`];
                        if (!r) return null;
                        return (
                          <div key={t.id} className="lookup-result">
                            <p className="lookup-head">
                              <span className="badge badge-danger">AI가 찾음 · 확인 필요</span>{" "}
                              {t.label}
                            </p>
                            {r.answer ? (
                              <p className="lookup-answer">{r.answer}</p>
                            ) : (
                              <p className="hint" style={{ marginTop: 0 }}>
                                {r.note ?? "찾지 못했습니다."}
                              </p>
                            )}
                            {r.sources.length > 0 && (
                              <ul className="lookup-sources">
                                {r.sources.map((src, i) => (
                                  <li key={i}>
                                    <a href={src.uri} target="_blank" rel="noreferrer">
                                      {src.title || src.uri}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {r.queries.length > 0 && (
                              <p className="hint" style={{ marginTop: 4 }}>
                                검색어: {r.queries.join(" · ")}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <span className="alert-tag">유의</span>
                    <p className="alert-detail" style={{ marginTop: 0 }}>
                      이 시트는 자격을 판정하지 않습니다. 확인해야 할 항목과 근거만 제시하며, 최종
                      판단은 담당자가 합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── 학부모용 ── */}
              <section className="panel letter" id="step3">
                <div className="panel-head">
                  <h3 className="h-sm">3. 학부모용 안내문</h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm right"
                    onClick={copyLetter}
                  >
                    {copied ? "복사했습니다" : "복사하기"}
                  </button>
                </div>
                <div className="panel-body">
                  <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
                    출력해서 건네거나 문자로 보냅니다. 필터와 무관하게 항상 전체가 들어갑니다.
                  </p>

                  <div className="ai-bar">
                    <span className={`badge ${aiLetter ? "badge-primary" : ""}`}>
                      {aiLetter ? "AI가 다시 씀" : "기본 서식"}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={rewriteWithAi}
                      disabled={aiStatus === "loading"}
                    >
                      {aiStatus === "loading"
                        ? "쓰고 있습니다…"
                        : aiLetter
                          ? "AI로 다시 쓰기"
                          : "AI로 쉽게 다시 쓰기"}
                    </button>
                    {aiLetter && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setAiCache((prev) => {
                            const next = { ...prev };
                            delete next[aiKey];
                            return next;
                          })
                        }
                      >
                        기본 서식으로
                      </button>
                    )}
                  </div>

                  {aiStatus === "error" && (
                    <p className="ai-error">
                      {aiError} 아래 기본 서식은 그대로 쓸 수 있습니다.
                    </p>
                  )}

                  <p className="hint" style={{ marginTop: 0 }}>
                    AI로 보낼 때 <strong>생년월일과 상세 메모는 보내지 않습니다.</strong> 지역·장애영역·학교급과
                    규칙이 계산한 결과만 보냅니다.
                  </p>

                  <pre className="letter-body">{shownLetter}</pre>
                </div>
              </section>
            </div>
          </div>
        </section>

        {/* ═══════ 참고 자료 ═══════ */}
        <section className="section wrap" id="reference">
          <div className="section-head rel">
            <h2 className="h-lg">참고 자료</h2>
            <span className="b-sm subtle right">이 도구가 필요한 이유</span>
            <DemoKey top={48} right={0}>
              {`카드 이름 6개 = 지역마다 다름
강원·경남 절차는 동일
→ 확장은 개발이 아니라 데이터 교체`}
            </DemoKey>
          </div>

          <h3 className="h-sm" style={{ marginBottom: 12 }}>
            같은 지원인데 시도마다 이름이 다릅니다
          </h3>
          <p className="b-sm subtle" style={{ marginBottom: 16 }}>
            치료비와 방과후활동비를 지급하는 교육청 바우처 카드입니다. 제도의 실질은 같은데 명칭이
            전부 다릅니다. 이사하면 이전 지역에서 쓰던 이름은 통하지 않습니다.
          </p>
          <table className="tbl">
            <caption className="skip">시도별 교육청 바우처 카드 명칭</caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: "22%" }}>
                  시도
                </th>
                <th scope="col" style={{ width: "26%" }}>
                  카드 명칭
                </th>
                <th scope="col">진단·평가 의뢰서 서식</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((r) => (
                <tr key={r.id} className={r.id === regionId ? "row-urgent" : ""}>
                  <th scope="row">{r.name}</th>
                  <td>
                    <strong>{r.cardName}</strong>{" "}
                    {!r.cardVerified && <span className="badge">출처 확인 필요</span>}
                  </td>
                  <td className="td-sub">{r.requestFormNo}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="alert alert-danger" style={{ marginTop: 32 }}>
            <span className="alert-tag">중요</span>
            <p className="alert-title">
              2019년에 폐지된 용어가 2025년 지침에 열네 번 남아 있습니다
            </p>
            <p className="alert-detail">
              장애등급제가 폐지되어 「장애등급」은 「장애정도」로 바뀌었습니다. 그런데 경상남도교육청
              2025년 지침은 제출 서류로 「장애등급 결정서」를 반복해 요구합니다. 그대로 안내하면
              보호자는 존재하지 않는 서류를 떼러 갑니다. (강원 1회 · 경남 14회 — 두 지침 원문 대조,
              2026.08)
            </p>
          </div>

          <div className="btn-row">
            <a href={REPO_DOCS} target="_blank" rel="noreferrer" className="btn btn-outline">
              기획서 전문 보기
            </a>
          </div>
        </section>
      </main>

      {/* ═══════ 푸터 ═══════ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <div>
              <h3>이름에 대하여</h3>
              <p>
                강원특별자치도교육청이 담당자에게 배포하는 「특수교육대상자 선정·배치 업무
                길잡이」에서 가져왔습니다. 담당자와 학부모가 같은 한 장을 본다는 뜻으로
                「너도나도」를 붙였습니다.
              </p>
            </div>
            <div>
              <h3>데이터에 대하여</h3>
              <p>
                절차·기한·카드 명칭·검사 도구는 강원·경남 교육청 지침 원문에서 확인한 내용입니다. 그
                밖의 금액과 세부 절차는 화면 구성을 보여주기 위한 예시이며, 화면에 「예시」 표시가
                붙습니다.
              </p>
            </div>
            <div>
              <h3>개인정보</h3>
              <p>
                이름·연락처를 받지 않습니다. 입력값은 화면 계산에만 쓰이고 서버로 전송되거나
                저장되지 않습니다. 아동 명단을 보관하는 기능이 없습니다.
              </p>
            </div>
          </div>
          <div className="footer-legal">
            <p>
              멋쟁이사자처럼 Campus AX-Ton 강원대 · 팀 멋쟁이 밤티들 ·{" "}
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <br />이 화면은 학습용 시연입니다. 실제 행정 기관의 서비스가 아닙니다.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function alertClass(kind: string) {
  if (kind === "term") return "alert-danger";
  if (kind === "overlap" || kind === "easyToMiss" || kind === "unregistered")
    return "alert-warning";
  return "alert-info";
}

function alertTag(kind: string) {
  if (kind === "term") return "중요";
  if (kind === "overlap") return "중복 확인";
  if (kind === "easyToMiss") return "놓치기 쉬움";
  if (kind === "unregistered") return "미등록 영역";
  return "안내";
}

/** 제도 한 건 — 접었다 펼 수 있는 항목 */
function ProgramItem({ program: p }: { program: ResolvedProgram }) {
  return (
    <details className="program" open={p.id === "selection"}>
      <summary>
        <span className={`badge ${p.track === "education" ? "badge-primary" : ""}`}>
          {TRACK_LABEL[p.track]}
        </span>
        <span className="program-name">{p.resolvedName}</span>
        {!p.verified && <span className="badge">예시</span>}
      </summary>
      <div className="program-body">
        <p className="program-summary">{p.summary}</p>
        <table className="tbl">
          <caption className="skip">{p.name} 상세</caption>
          <tbody>
            <tr>
              <th scope="row" style={{ width: "24%" }}>
                신청처
              </th>
              <td>{p.resolvedApplyTo}</td>
            </tr>
            <tr>
              <th scope="row">준비 서류</th>
              <td>
                <ul className="docs">
                  {p.resolvedDocuments.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr>
              <th scope="row">기한</th>
              <td>{p.deadline}</td>
            </tr>
            <tr>
              <th scope="row">근거</th>
              <td className="td-sub">{p.legalBasis}</td>
            </tr>
            <tr>
              <th scope="row">출처</th>
              <td className="td-sub">
                {p.verified ? "확인함 — " : "데모용 예시 — "}
                {p.source}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
