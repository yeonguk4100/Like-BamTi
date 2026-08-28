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
  formSource,
  NEEDS_OTHER_OFFICE,
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
  /** 안내문 맨 끝에 들어가는 발신 정보. 담당자 본인 정보이며 저장하지 않는다 */
  sender?: { org?: string; name?: string; tel?: string };
};

export type Warning = {
  kind: "term" | "overlap" | "crossTrack" | "easyToMiss" | "unregistered" | "age9Cross" | "noticeGap";
  title: string;
  detail: string;
  /**
   * 근거를 확인한 경고인지. false 면 1면에 올리지 않고 「자세히 보기」로 내린다.
   *
   * 1면은 담당자가 읽는 유일한 곳이라 **확실한 것만** 있어야 한다. 「공식 목록에는
   * 없지만 겹칠 수 있다」 수준을 1면에 올리면 담당자가 그 숫자를 안 보게 된다.
   */
  verified?: boolean;
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

/**
 * 제도의 대상 조건을 담당자가 읽을 문장으로 바꾼다.
 *
 * 수원교육지원청 지원센터 담당자가 「지원별로 대상 조건을 명확하게 표시해 달라」고
 * 요청한 칸이다. appliesTo 는 규칙이 제도를 고르는 데 쓰던 값인데, 담당자에게는
 * 보여주지 않고 있었다 — 왜 이 제도가 떴는지, 어디까지가 대상인지 알 수 없었다.
 *
 * **여기서 새 사실을 만들지 않는다.** 이미 데이터에 있는 조건을 말로 옮기기만 한다.
 * 조건이 비어 있으면 「전국 공통」처럼 단정하지 않고 빈 배열을 돌려준다 —
 * 조건을 적어 두지 않은 것과 조건이 없는 것은 다르다.
 */
export function eligibilityLines(p: Program): string[] {
  const out: string[] = [];

  // 교육청 지원제도는 선정이 전제다. 새로 만든 사실이 아니라 selection 제도의
  // summary 에 이미 적혀 있는 것을 옮긴 것이다 — 「특수교육대상자로 선정되어야
  // 아래 교육청 지원제도를 신청할 수 있습니다」. 선정·배치 자체는 그 출발점이라 빼둔다.
  if (p.track === "education" && p.id !== "selection") {
    out.push("특수교육대상자로 선정된 아동");
  }

  const a = p.appliesTo;
  if (!a) return out;

  if (a.ageMin !== undefined && a.ageMax !== undefined) {
    out.push(`만 ${a.ageMin}세 ~ 만 ${a.ageMax}세`);
  } else if (a.ageMin !== undefined) {
    out.push(`만 ${a.ageMin}세부터`);
  } else if (a.ageMax !== undefined) {
    out.push(`만 ${a.ageMax}세까지`);
  }

  if (a.disabilities?.length) {
    const names = a.disabilities.map((id) => DISABILITIES.find((d) => d.id === id)?.name ?? id);
    out.push(`장애영역 — ${names.join(" · ")}`);
  }
  if (a.levels?.length) {
    const names = a.levels.map((id) => LEVELS.find((l) => l.id === id)?.name ?? id);
    out.push(`학교급 — ${names.join(" · ")}`);
  }
  if (a.regions?.length) {
    const names = a.regions.map((id) => REGIONS.find((r) => r.id === id)?.name ?? id);
    out.push(`지역 — ${names.join(" · ")}`);
  }

  return out;
}

/**
 * 전화 상담 중에 그대로 읽어 줄 문장 한 벌.
 *
 * 담당자가 안내문을 건넨 뒤에도 학부모는 전화로 다시 묻는다 — 수원 지원센터 담당자가
 * 「같은 것을 여러 번 설명한다」고 한 부분이다. 그때 지침 책자나 표를 눈으로 훑으며
 * 옮겨 말하지 않도록, 말할 순서대로 미리 늘어놓는다.
 *
 * **여기서 새 사실을 만들지 않는다.** 규칙이 이미 고른 값(resolved*)을 말차례로
 * 옮기기만 한다. 판정하는 문장은 넣지 않는다 (설계 원칙 1번).
 * 표현 규칙에 따라 「받을 수 있습니다」를 쓰지 않고 「신청할 수 있습니다」로 쓴다.
 */
/**
 * 소리 내 읽을 글자로 다듬는다.
 *
 * data.ts 의 summary 에는 강조하려고 넣은 마크다운 `**` 이 글자 그대로 들어 있다.
 * 표에서는 눈으로 넘길 수 있지만 읽어 주는 화면에서는 「별표별표」가 되어 버린다.
 * 뜻을 바꾸지 않고 기호만 걷어낸다.
 */
function spoken(text: string): string {
  return text.replace(/\*\*/g, "");
}

export type ReadAloudLine = {
  q: string;
  a: string;
  /** 누를 수 있는 주소. tel: 이면 전화, http 면 새 창 */
  href?: string;
  /** 링크 아래에 함께 보여줄 줄 — 기관 이름이나 주소 원문 */
  sub?: string;
  caution?: boolean;
};

export function readAloudBlock(p: ResolvedProgram): {
  name: string;
  track: Track;
  verified: boolean;
  lines: ReadAloudLine[];
} {
  const lines: ReadAloudLine[] = [{ q: "어떤 제도인가요", a: spoken(p.summary) }];

  lines.push({ q: "어디에 신청하나요", a: p.resolvedApplyTo });

  lines.push(
    p.resolvedDocuments.length > 0
      ? { q: "무엇을 준비하나요", a: p.resolvedDocuments.join(" · ") }
      : {
          q: "무엇을 준비하나요",
          a: "준비 서류를 확인하지 못했습니다. 신청처에 확인이 필요합니다",
          caution: true,
        }
  );

  lines.push({ q: "언제까지인가요", a: p.deadline });

  /* 전화번호와 주소는 학부모에게 그대로 넘겨 주는 값이다. 담당자가 옮겨 적다가
     틀리지 않게, 그리고 상담 중에 바로 걸거나 열 수 있게 누를 수 있는 값으로 넘긴다. */
  if (p.contactTel) {
    lines.push({
      q: "어디로 문의하나요",
      a: p.contactTel,
      href: `tel:${p.contactTel}`,
      sub: p.contactTelLabel,
    });
  }
  if (p.officialUrl) {
    lines.push({
      q: "직접 열어 볼 곳",
      a: p.officialUrlLabel ?? p.officialUrl,
      href: p.officialUrl,
      /* 라벨만 보여주면 학부모에게 알려 줄 주소가 화면에 없다. 주소도 함께 낸다 */
      sub: p.officialUrlLabel ? p.officialUrl : undefined,
    });
  }

  /* 확인하지 못한 항목은 읽어 주기 전에 담당자가 알아야 한다. 설계 원칙 3번 */
  if (!p.verified) {
    lines.push({
      q: "확인 필요",
      a: "아직 근거를 확인하지 못한 예시입니다. 이 항목은 신청처에 다시 확인해 주세요",
      caution: true,
    });
  }

  return { name: p.resolvedName, track: p.track, verified: p.verified, lines };
}

/** 읽어 줄 내용 전체를 붙여쓰기용 글자로 바꾼다. 화면과 같은 함수를 쓴다 */
export function readAloudText(programs: ResolvedProgram[]): string {
  const out: string[] = [`전화로 확인해 드릴 제도 ${programs.length}건입니다.`, ""];
  programs.forEach((p, i) => {
    const b = readAloudBlock(p);
    out.push(`${i + 1}. ${b.name} (${TRACK_LABEL[b.track]})`);
    b.lines.forEach((l) => out.push(`   - ${l.q} : ${l.a}${l.sub ? ` — ${l.sub}` : ""}`));
    out.push("");
  });
  out.push("자격은 신청처에서 최종 확인합니다. 위 내용은 확인해야 할 항목입니다.");
  return out.join("\n");
}

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
function ageAtBase(birthDate: string): number | null {
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
    const src = formSource(input.regionId, key);
    return {
      key,
      label: FORM_LABEL[key],
      formNo: no ?? "서식 번호 미확인",
      /** 어디서 떼는가. 이 칸이 비어 있어서 미비 접수가 생겼다 */
      where: src.where,
      whereVerified: src.verified,
      /** 다른 기관에 먼저 가야 하는 서류 — 빠지면 접수가 되돌아간다 */
      fromOtherOffice: src.sources.some((x) => NEEDS_OTHER_OFFICE.includes(x)),
      /** 보호자가 준비할 서류가 아닌 것 (담당자·학교 취합) */
      staffOnly: src.sources.includes("staff"),
    };
  });

  /** 학부모가 먼저 다른 기관에서 갖춰 와야 하는 것. 안내문 맨 위에 온다 */
  const documentsFirst = documents.filter((d) => d.fromOtherOffice);
  /** 신청처에서 받아 작성하는 서식 */
  const documentsAtOffice = documents.filter((d) => !d.fromOtherOffice && !d.staffOnly);
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

  /* 취학 마감일은 아직 배치되지 않은 아동에게만 해당한다.
     전학·재배치와 재취학은 이미 학교에 다니는 상황이라 붙이지 않는다.
     신규 선정은 취학 예정일 수도, 재학 중 처음 선정받는 것일 수도 있어
     판정하지 않고 「취학 예정이라면」이라는 조건을 문장에 남긴다. */
  const alreadyPlaced = input.procedureId === "reassign" || input.procedureId === "reenroll";
  if (input.levelId === "elementary" && !alreadyPlaced) {
    deadlines.unshift({
      label: "취학 전 진단·평가 의뢰",
      when:
        "취학 예정이라면 취학 전년도에 신청해야 3월 1일 배치에 맞습니다 " +
        "(시기는 교육지원청 공고 확인). 이미 재학 중이면 해당하지 않습니다",
      urgent: true,
    });
  }
  if (input.levelId === "kinder" || input.levelId === "daycare") {
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

  /* 담당자 인터뷰 Q2 — 지침에는 없지만 실제 대기 기간을 좌우하는 사실.
     「특수교육운영위원회를 거치게 되어있음. 한달에 한번. 회의 끝나고 바로 신청 들어오면
     한달 걸리시는거고 회의임박해서 신청하신 분들은 바로 결과나옴」 */
  deadlines.push({
    label: "특수교육운영위원회 심사",
    when:
      `${level.committee}가 월 1회 열립니다 — 회의 직후에 신청하면 다음 회의까지 최대 한 달을 ` +
      "기다리고, 회의 직전에 신청하면 바로 심의됩니다. 다음 회의 날짜를 확인해 안내하세요",
  });

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

  /* 담당자 인터뷰 Q4 — 「부처가 갈려서 정보가 안 흐른다」의 살아 있는 사례.
     유치원·초·중은 공문이 가서 놓치는 일이 거의 없지만, 어린이집은 교육청 소속이 아니라
     공문을 보낼 수 없고 행정복지센터를 거쳐야 해서 누락이 많다. */
  if (input.levelId === "daycare") {
    warnings.push({
      kind: "noticeGap",
      title: "어린이집 아동에게는 교육청 공문이 가지 않습니다 — 신청 시기를 직접 안내하세요",
      detail:
        "유치원·초·중학교에는 공문을 보내기 때문에 신청 시기를 놓치는 일이 거의 없습니다. " +
        "그런데 어린이집은 교육청 소속이 아니어서 공문을 보낼 수 없고 행정복지센터를 거쳐야 해서 " +
        "누락이 많습니다. 취학 직전이 가장 중요한 시기인데 그 시기 아동 상당수가 어린이집에 있습니다. " +
        "보호자에게 다음 운영위원회 날짜와 신청 마감을 직접 알려 주세요. " +
        "놓치면 특수학급 정원(TO)이 남아 있는지에 따라 달라지고, 정원이 없으면 대응이 지역마다 다릅니다.",
    });
  }

  /* 소관이 갈려 있어서 아무도 알려주지 않는 것.
     교육청 쪽 발달지체 종료와 복지부 쪽 발달재활서비스 종료가 같은 시점이다.
     (사회서비스 전자바우처 「발달재활서비스」 — 장애 등록이 없으면 만 9세가 되는 달까지) */
  if (age9) {
    warnings.push({
      kind: "age9Cross",
      title: `만 9세에 두 부처의 지원이 같이 끝납니다 — ${age9}`,
      detail:
        "교육청 쪽은 발달지체 특수교육대상자 지위가 이 날까지 유지된 뒤 종료됩니다. " +
        "복지부 쪽은 장애 등록 없이 발달재활서비스를 받고 있다면 만 9세가 되는 달까지만 지원됩니다. " +
        "소관이 달라 어느 쪽도 다른 쪽을 알려주지 않습니다. " +
        "그 전에 ① 재진단·재선정과 ② 장애 등록 여부를 함께 확인하도록 보호자에게 안내하세요.",
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
      verified: rule.verified,
    });
  }

  /* ── 3-1. 경고를 두 갈래로 가른다 ──
     담당자가 검수할 항목이 많으면 이 도구가 시간을 줄이지 못한다.
     1면에는 담당자가 모를 수 있는 것과 이 아동에 대한 판단만 남기고,
     조건과 무관하게 늘 뜨는 일반 안내는 「자세히 보기」로 내린다. */
  const onFrontPage = (w: Warning) =>
    (w.kind === "term" ||
      w.kind === "overlap" ||
      w.kind === "unregistered" ||
      w.kind === "age9Cross" ||
      w.kind === "noticeGap") &&
    // 근거를 확인하지 못한 것은 1면에 올리지 않는다. verified 를 안 쓰는 종류는 통과
    w.verified !== false;

  const keyWarnings = warnings.filter(onFrontPage);
  const generalNotes = warnings.filter((w) => !onFrontPage(w));

  /* ── 4. 학부모용 안내문 ── */
  const parentLetter = buildParentLetter({
    region,
    disability,
    disabilityLabel,
    procedure,
    documentsFirst,
    documentsAtOffice,
    level,
    programs,
    deadlines,
    age9,
    sender: input.sender,
  });

  /* 조사되지 않은 지역 자체사업 — 무엇이 비었는지 화면에 그대로 보여준다 */
  const localSources = LOCAL_SOURCES[input.regionId] ?? [];
  const hasLocalPrograms = programs.some((p) => p.local);

  return {
    region,
    disability,
    disabilityLabel,
    detailNote,
    procedure,
    documents,
    documentsFirst,
    documentsAtOffice,
    level,
    /** 기준일 시점의 만 나이. 오늘 날짜를 쓰지 않는다 */
    age,
    ageBasis: AGE_BASIS,
    excludedByAge,
    localSources,
    hasLocalPrograms,
    age9,
    programs,
    deadlines,
    warnings,
    keyWarnings,
    generalNotes,
    parentLetter,
  };
}

/** 규칙이 계산한 결과 한 벌. API 응답 타입이기도 하다 */
export type Sheet = ReturnType<typeof buildSheet>;

function buildParentLetter(args: {
  region: (typeof REGIONS)[number];
  disability: (typeof DISABILITIES)[number];
  disabilityLabel: string;
  procedure: (typeof PROCEDURES)[number];
  documentsFirst: { label: string; formNo: string; where: string }[];
  documentsAtOffice: { label: string; formNo: string; where: string }[];
  level: (typeof LEVELS)[number];
  programs: ResolvedProgram[];
  deadlines: Deadline[];
  age9: string | null;
  sender?: { org?: string; name?: string; tel?: string };
}) {
  const {
    region,
    disability,
    disabilityLabel,
    procedure,
    documentsFirst,
    documentsAtOffice,
    level,
    programs,
    deadlines,
    age9,
    sender,
  } = args;

  const eduPrograms = programs.filter((p) => p.track === "education");
  const otherPrograms = programs.filter((p) => p.track !== "education");
  const urgent = deadlines.filter((d) => d.urgent);

  const lines: string[] = [];

  lines.push(`${region.name}에 사는 ${level.name} 아동의 보호자께 드리는 안내입니다.`);
  lines.push(`이 안내는 「${procedure.name}」 기준입니다. (${procedure.when})`);
  lines.push("");
  if (documentsFirst.length > 0) {
    lines.push("■ 1단계 — 먼저 준비할 서류");
    lines.push("  서류가 누락된 경우 보완 제출이 필요할 수 있습니다.");
    for (const d of documentsFirst) {
      lines.push(`· ${d.label}`);
      lines.push(`   → ${d.where}`);
    }
    lines.push("");
  }
  lines.push(`■ ${documentsFirst.length > 0 ? "2단계 — " : ""}${level.submitTo}에서 작성할 서류`);
  for (const d of documentsAtOffice) {
    lines.push(`· ${d.label} [${d.formNo}]`);
  }
  lines.push("");
  lines.push("■ 서류 작성 시 유의사항");
  lines.push("  행동특성과 발달사항은 구체적으로 작성해 주세요.");
  lines.push("  「발달이 느림」처럼 짧게 작성하면 추가 확인이 필요할 수 있습니다.");
  lines.push("  · 언제부터 나타났는지 (예: 두 돌 무렵부터)");
  lines.push("  · 어떤 상황에서 나타나는지 (예: 낯선 사람이 많은 곳에서)");
  lines.push("  · 어떻게 나타나는지 (예: 눈을 맞추지 않고 같은 말을 반복합니다)");
  lines.push("  구체적으로 작성하면 추가 확인을 줄일 수 있습니다.");
  lines.push("");
  lines.push("■ 신청 이후 절차");
  lines.push(`1. ${level.submitTo}에 서류를 제출합니다.`);
  lines.push(
    disability.tests.length > 0
      ? `2. 신청하면 ${region.officeName} 특수교육지원센터가 30일 안에 검사를 진행합니다. ${disabilityLabel} 검사가 포함됩니다.`
      : `2. 신청하면 ${region.officeName} 특수교육지원센터가 30일 안에 검사를 진행합니다. 어떤 검사를 하는지는 담당자에게 확인하세요.`
  );
  lines.push(
    `3. 검사 결과가 나오면 ${level.committee}가 심사하고, 2주 안에 ${level.decider}이(가) 결과를 통보합니다.`
  );
  lines.push("");
  lines.push("■ 선정 후 신청 가능한 교육청 지원");
  for (const p of eduPrograms) {
    if (p.id === "selection") continue;
    lines.push(`· ${p.resolvedName} — ${p.resolvedApplyTo}`);
  }
  lines.push("");
  lines.push("■ 별도 신청이 필요한 지원 (복지·의료)");
  // 확인 주체를 담당자가 아니라 해당 기관으로 넘긴다. 판정하지 않으면서
  // 담당자에게 검수 숙제를 남기지 않는 유일한 방법이다.
  lines.push("  교육청 소관이 아닙니다. 지원 대상 여부와 신청 방법은 아래 기관에서 확인해 주세요.");
  for (const p of otherPrograms) {
    lines.push(`· ${p.name} — ${p.applyTo}`);
  }
  lines.push("");
  lines.push("  ※ 장애인 등록이 되어 있어도 특수교육대상자로 자동 선정되지 않습니다.");
  lines.push("     반대로 특수교육대상자로 선정되어도 복지 지원은 별도로 신청해야 합니다.");

  if (urgent.length > 0) {
    lines.push("");
    lines.push("■ 주요 신청 일정");
    for (const d of urgent) lines.push(`· ${d.label} — ${d.when}`);
  }

  if (age9) {
    lines.push("");
    lines.push(`  ※ 만 9세가 되면 두 가지가 같이 끝납니다. ${age9}까지입니다.`);
    lines.push("     · 교육청 — 발달지체 특수교육대상자 지위가 종료됩니다. 그 전에 다시 검사를 받아야 이어집니다.");
    lines.push("     · 읍면동 — 장애 등록 없이 발달재활서비스를 받고 계시면 그때 지원이 끝납니다.");
    lines.push("       장애 등록을 하시면 만 18세 미만까지 이어집니다. 읍면동에서 확인하세요.");
  }

  lines.push("");
  lines.push(...officialLinkLines(programs));

  lines.push("");
  lines.push(...contactLines(region.officeName, sender));

  return lines.join("\n");
}

/**
 * 안내문 맨 끝의 공식 안내 페이지 목록.
 *
 * contactLines 와 같은 이유로 별도 함수다 — 이 줄들은 규칙이 만들어 붙인다.
 * 주소를 AI 에 넘기면 고치거나 지어낼 수 있어서, AI 가 다시 쓴 안내문에도
 * 서버가 이 목록을 그대로 뒤에 붙인다.
 *
 * 링크가 붙는 것은 담당자 소관 밖(복지·의료) 제도뿐이다. 교육청 담당자가
 * 설명할 수 없는 것들이고, 그래서 학부모가 직접 찾아가야 하는 것들이다.
 */
export function officialLinkLines(
  programs: {
    officialUrl?: string;
    officialUrlLabel?: string;
    contactTel?: string;
    contactTelLabel?: string;
    name: string;
  }[]
): string[] {
  const linked = programs.filter((p) => p.officialUrl || p.contactTel);
  if (linked.length === 0) return [];

  const lines = ["■ 직접 확인하실 수 있는 곳"];
  for (const p of linked) {
    lines.push(`· ${p.name}`);
    if (p.contactTel) {
      lines.push(`  전화 ${p.contactTel} ${p.contactTelLabel ?? ""}`.trimEnd());
    }
    if (p.officialUrl) {
      lines.push(`  ${p.officialUrlLabel ?? ""} ${p.officialUrl}`.trim());
    }
  }
  lines.push("  ※ 교육청 소관이 아닌 제도입니다. 위로 직접 확인하실 수 있습니다.");
  return lines;
}

/**
 * 안내문 맨 끝의 문의 안내.
 *
 * 별도 함수로 뺀 이유 — 담당자 발신 정보는 제미나이에 보내지 않는다.
 * 그래서 AI 가 다시 쓴 안내문에는 이 줄이 없고, 서버가 규칙으로 만든 이 줄을
 * 뒤에 붙인다. 기관명·이름·번호를 AI 가 고치게 두지 않는다.
 */
export function contactLines(
  officeName: string,
  sender?: { org?: string; name?: string; tel?: string }
): string[] {
  const lines = ["궁금한 점은 아래로 연락 주세요."];
  lines.push(sender?.org?.trim() || `${officeName} 특수교육지원센터`);
  if (sender?.name?.trim()) lines.push(`담당자 ${sender.name.trim()}`);
  if (sender?.tel?.trim()) lines.push(sender.tel.trim());
  return lines;
}
