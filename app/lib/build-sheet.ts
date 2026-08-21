// 입력값으로 담당자용 확인 시트와 학부모용 안내문을 만든다.
//
// 설계 원칙 (기획서 4.2 / 4.3)
//  - 판정하지 않는다. "확인하세요"까지만 말한다.
//  - 입력값을 어디에도 저장하지 않는다. 이 함수는 순수 계산만 한다.

import {
  APPEAL_DEADLINES,
  BASE_DATE,
  BASE_SCHOOL_YEAR,
  CURRENT_SERVICES,
  DISABILITIES,
  FORM_LABEL,
  FORM_NO,
  LEVELS,
  LOCAL_PROGRAMS,
  LOCAL_SOURCES,
  OVERLAP_RULES,
  PROCEDURES,
  PROGRAMS,
  REGIONS,
  type CurrentServiceId,
  type DisabilityId,
  type LevelId,
  type ProcedureId,
  type Program,
  type RegionId,
  type Track,
} from "./data";

export type Input = {
  regionId: RegionId;
  disabilityId: DisabilityId;
  levelId: LevelId;
  /** yyyy-mm-dd. 마감일 계산에만 쓰고 저장하지 않는다 */
  birthDate: string;
  currentServices: CurrentServiceId[];
  /** 신청 상황. 상황이 바뀌면 제출 서류가 통째로 바뀐다 */
  procedureId: ProcedureId;
  /** 장애영역을 「기타」로 골랐을 때 담당자가 적은 영역 이름 */
  otherDisabilityLabel?: string;
  /** 상세 유형·원인 질환·지연 영역 등. 참고용이며 판정에 쓰지 않는다 */
  detailNote?: string;
};

export type Warning = {
  kind: "term" | "overlap" | "crossTrack" | "easyToMiss" | "unregistered";
  title: string;
  detail: string;
};

export type Deadline = {
  label: string;
  when: string;
  urgent?: boolean;
};

export type ResolvedProgram = Program & {
  resolvedName: string;
  resolvedApplyTo: string;
  resolvedDocuments: string[];
};

export const TRACK_LABEL: Record<Track, string> = {
  education: "교육청",
  welfare: "복지부",
  medical: "의료",
};

/** 만 9세가 되는 날이 속한 달의 말일 — 강원 지침의 계산 방식 */
export function age9EndOfMonth(birthDate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const year = Number(m[1]) + 9;
  const month = Number(m[2]);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}년 ${month}월 ${lastDay}일`;
}

/** 기준일(학년도 시작) 시점의 만 나이. 오늘 날짜를 쓰지 않아 렌더링이 어긋나지 않는다 */
export function ageAtBase(birthDate: string): number | null {
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(BASE_DATE);
  if (!b || !d) return null;
  const [by, bm, bd] = [Number(b[1]), Number(b[2]), Number(b[3])];
  const [ry, rm, rd] = [Number(d[1]), Number(d[2]), Number(d[3])];
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age -= 1;
  return age < 0 ? null : age;
}

export const AGE_BASIS = `${BASE_SCHOOL_YEAR}학년도 기준 (${BASE_DATE})`;

export function buildSheet(input: Input) {
  const region = REGIONS.find((r) => r.id === input.regionId)!;
  const disability = DISABILITIES.find((d) => d.id === input.disabilityId)!;
  const level = LEVELS.find((l) => l.id === input.levelId)!;
  const procedure = PROCEDURES.find((x) => x.id === input.procedureId)!;

  /* 서류 목록 — 서식 번호는 지역마다 다르다 */
  const formNos = FORM_NO[input.regionId];
  const documents = procedure.forms.map((key) => {
    const no = formNos[key];
    return { key, label: FORM_LABEL[key], formNo: no ?? "서식 번호 미확인" };
  });
  /* 「기타」를 골랐으면 담당자가 적은 이름을 쓴다 */
  const typed = input.otherDisabilityLabel?.trim();
  const disabilityLabel =
    disability.id === "other" ? (typed ? typed : "기타 (미입력)") : disability.name;
  const detailNote = input.detailNote?.trim() || undefined;

  /* ── 1. 확인해야 할 제도 ── */
  const age = ageAtBase(input.birthDate);

  /** 나이 조건에 걸려 목록에서 빠진 제도. 숨기지 않고 개수와 이름을 보여준다 */
  const excludedByAge: { name: string; reason: string }[] = [];

  const candidates = [...PROGRAMS, ...LOCAL_PROGRAMS].filter((p) => {
    const a = p.appliesTo;
    if (a?.levels && !a.levels.includes(input.levelId)) return false;
    if (a?.disabilities && !a.disabilities.includes(input.disabilityId)) return false;
    if (a?.regions && !a.regions.includes(input.regionId)) return false;

    if (age !== null) {
      if (a?.ageMin !== undefined && age < a.ageMin) {
        excludedByAge.push({ name: p.name, reason: `만 ${a.ageMin}세부터` });
        return false;
      }
      if (a?.ageMax !== undefined && age > a.ageMax) {
        excludedByAge.push({ name: p.name, reason: `만 ${a.ageMax}세까지` });
        return false;
      }
    }
    return true;
  });

  const programs: ResolvedProgram[] = candidates.map((p) => {
    const fill = (s: string) =>
      s
        .replace(/\{\{submitTo\}\}/g, level.submitTo)
        .replace(/\{\{requestFormNo\}\}/g, region.requestFormNo)
        .replace(/\{\{basicSurveyName\}\}/g, region.basicSurveyName);

    return {
      ...p,
      resolvedName: p.usesRegionCard ? `${p.name} — ${region.cardName}` : p.name,
      resolvedApplyTo: fill(p.applyTo),
      resolvedDocuments: p.documents.map(fill),
    };
  });

  /* ── 2. 마감일 — 상황별 기한이 먼저 온다 ── */
  const deadlines: Deadline[] = procedure.deadlines.map((d) => ({ ...d }));

  if (input.levelId === "elementary") {
    deadlines.unshift({
      label: "취학 전 진단·평가 의뢰",
      when: "취학 전년도에 신청해야 3월 1일 배치에 맞습니다 (시기는 교육지원청 공고 확인)",
      urgent: true,
    });
  }
  if (input.levelId === "kinder") {
    deadlines.unshift({
      label: "유치원 배치 (처음학교로)",
      when: "10월 말까지 선배치자 입력 · 11월 시행계획 안내",
      urgent: true,
    });
  }
  if (input.levelId === "high") {
    deadlines.push({
      label: "배치 희망교 작성",
      when: "3지망까지 작성해야 합니다 (미작성 시 운영위원회 임의 배치)",
      urgent: true,
    });
  }

  const age9 = disability.reselection === "age9" ? age9EndOfMonth(input.birthDate) : null;
  if (age9) {
    deadlines.unshift({
      label: "발달지체 재선정 마감",
      when: `${age9}까지 유지 후 종료 — 그 전에 재진단·재선정을 해야 방과후 교육활동·치료지원이 끊기지 않습니다`,
      urgent: true,
    });
  }

  deadlines.push(...APPEAL_DEADLINES.map((d) => ({ ...d })));

  /* ── 3. 확인이 필요한 항목 ── */
  const warnings: Warning[] = [];

  if (disability.id === "other") {
    warnings.push({
      kind: "unregistered",
      title: typed
        ? `「${typed}」의 검사 도구는 이 도구에 등록돼 있지 않습니다`
        : "장애영역을 직접 입력해 주세요",
      detail:
        "선정 절차와 기한, 제출 서류는 장애영역과 무관하게 같습니다. " +
        "다만 진단·평가에 들어가는 검사 도구는 영역마다 달라, 소속 교육청 지침에서 확인해야 합니다.",
    });
  }

  if (region.legacyTermInGuide) {
    warnings.push({
      kind: "term",
      title: "「장애등급 결정서」라는 서류는 더 이상 없습니다",
      detail:
        `${region.officeName} 지침에는 제출 서류로 「장애등급 결정서」가 적혀 있습니다. ` +
        "그러나 2019년 7월 1일 장애등급제가 폐지되어, 그 이후 등록한 보호자에게는 해당 서류가 없습니다. " +
        "「장애정도」(심한 / 심하지 않은) 표기로 안내하세요.",
    });
  }

  warnings.push({
    kind: "crossTrack",
    title: "복지부 장애인 등록과 교육청 선정은 별개 절차입니다",
    detail:
      "이미 장애인 등록이 되어 있어도 특수교육대상자로 자동 선정되지 않습니다. " +
      "반대로 특수교육대상자로 선정돼도 복지부 제도는 따로 신청해야 합니다. 보호자에게 두 번 안내하세요.",
  });

  if (input.levelId === "elementary" || input.levelId === "middle") {
    warnings.push({
      kind: "easyToMiss",
      title: "배치 희망교는 3지망까지 작성해야 합니다",
      detail:
        "특수학급 배치를 희망하는 경우 거주지에서 가까운 특수학급 설치교를 1~3지망까지 적습니다. " +
        "미작성 시 특수교육운영위원회 심사에 따라 임의 배치될 수 있습니다.",
    });
  }

  const serviceName = (id: CurrentServiceId) =>
    CURRENT_SERVICES.find((s) => s.id === id)?.name ?? id;

  for (const rule of OVERLAP_RULES) {
    if (!input.currentServices.includes(rule.withService)) continue;
    if (!programs.some((p) => p.id === rule.programId)) continue;
    const program = PROGRAMS.find((p) => p.id === rule.programId)!;
    warnings.push({
      kind: "overlap",
      title: `${program.name} ↔ ${serviceName(rule.withService)}`,
      detail: rule.message,
    });
  }

  /* ── 4. 학부모용 안내문 ── */
  const parentLetter = buildParentLetter({
    region,
    disability,
    disabilityLabel,
    procedure,
    documents,
    level,
    age,
    ageBasis: AGE_BASIS,
    excludedByAge,
    localSources: LOCAL_SOURCES[input.regionId] ?? [],
    hasLocalPrograms: programs.some((p) => p.local),
    programs,
    deadlines,
    age9,
  });

  return {
    region,
    disability,
    disabilityLabel,
    detailNote,
    procedure,
    documents,
    level,
    programs,
    deadlines,
    warnings,
    parentLetter,
  };
}

function buildParentLetter(args: {
  region: (typeof REGIONS)[number];
  disability: (typeof DISABILITIES)[number];
  disabilityLabel: string;
  procedure: (typeof PROCEDURES)[number];
  documents: { label: string; formNo: string }[];
  level: (typeof LEVELS)[number];
  programs: ResolvedProgram[];
  deadlines: Deadline[];
  age9: string | null;
}) {
  const { region, disability, disabilityLabel, procedure, documents, level, programs, deadlines, age9 } =
    args;

  const eduPrograms = programs.filter((p) => p.track === "education");
  const otherPrograms = programs.filter((p) => p.track !== "education");
  const urgent = deadlines.filter((d) => d.urgent);

  const lines: string[] = [];

  lines.push(`${region.name}에 사는 ${level.name} 아동의 보호자께 드리는 안내입니다.`);
  lines.push(`이 안내는 「${procedure.name}」 기준입니다. (${procedure.when})`);
  lines.push("");
  lines.push("■ 준비하실 서류");
  for (const d of documents) {
    lines.push(`· ${d.label} [${d.formNo}]`);
  }
  lines.push("");
  lines.push("■ 먼저 하실 일");
  lines.push(`1. ${level.submitTo}에 서류를 제출합니다.`);
  lines.push(
    disability.tests.length > 0
      ? `2. 신청하면 ${region.officeName} 특수교육지원센터가 30일 안에 검사를 진행합니다. ${disabilityLabel} 검사가 포함됩니다.`
      : `2. 신청하면 ${region.officeName} 특수교육지원센터가 30일 안에 검사를 진행합니다. 어떤 검사를 하는지는 담당자에게 확인하세요.`
  );
  lines.push(
    `3. 검사 결과가 나오면 ${level.committee}가 심사하고, 2주 안에 ${level.decider}이(가) 결과를 알려 드립니다.`
  );
  lines.push("");
  lines.push("■ 선정되면 신청할 수 있는 교육청 지원");
  for (const p of eduPrograms) {
    if (p.id === "selection") continue;
    lines.push(`· ${p.resolvedName} — ${p.resolvedApplyTo}`);
  }
  lines.push("");
  lines.push("■ 교육청과 따로 신청해야 하는 것 (복지·의료)");
  for (const p of otherPrograms) {
    lines.push(`· ${p.name} — ${p.applyTo}`);
  }
  lines.push("");
  lines.push("  ※ 장애인 등록이 되어 있어도 특수교육대상자로 자동 선정되지 않습니다.");
  lines.push("     반대로 특수교육대상자가 되어도 복지 지원은 따로 신청하셔야 합니다.");

  if (urgent.length > 0) {
    lines.push("");
    lines.push("■ 놓치면 안 되는 날짜");
    for (const d of urgent) lines.push(`· ${d.label} — ${d.when}`);
  }

  if (age9) {
    lines.push("");
    lines.push(
      `  ※ 발달지체는 만 9세가 되면 지원이 끝납니다. ${age9}까지이며, 그 전에 다시 검사를 받아야 지원이 이어집니다.`
    );
  }

  lines.push("");
  lines.push("궁금한 점은 아래로 연락 주세요.");
  lines.push(`${region.officeName} 특수교육지원센터 (담당자 연락처)`);

  return lines.join("\n");
}
