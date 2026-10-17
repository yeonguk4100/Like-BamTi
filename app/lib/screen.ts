// 화면이 쓰는 상수와 표현용 헬퍼.
//
// 제도 데이터(data.ts)나 규칙(build-sheet.ts)이 아니라 「화면에 어떻게 보일지」에
// 딸린 값들이다. page.tsx 가 1700줄을 넘겨서 떼어냈다.

import type { Track } from "./data";

export const REPO = "https://github.com/yeonguk4100/Like-BamTi";
export const REPO_DOCS = `${REPO}/tree/main/docs`;

/** 이 도구가 정리한 나이 구간. 밖이면 화면이 안내한다 */
export const SCOPE_AGE_MIN = 5;
export const SCOPE_AGE_MAX = 8;

/**
 * 생년월일 칸에 친 글자를 yyyy-mm-dd 모양으로 맞춘다.
 * 숫자만 남겨 8자리로 자르고, 치는 도중에도 하이픈을 넣어 보여준다 (2019 → 2019, 201903 → 2019-03).
 * 상담 중에는 달력을 넘기는 것보다 숫자 8개를 치는 편이 빠르다.
 */
export function formatBirthInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

/**
 * 복지로 서비스 상세 페이지 — 학부모가 직접 열어 볼 공식 주소.
 * 주소 모양은 「활용가이드_중앙부처복지서비스(v2.2)」 목록 응답의 servDtlLink 예시를 따른다.
 */
export function bokjiroPageUrl(servId: string): string {
  return (
    "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do" +
    `?wlfareInfoId=${encodeURIComponent(servId)}&wlfareInfoReldBztpCd=01`
  );
}

/** 복지로 신청 경로 목록 이름 → 화면에 쓸 단계 이름. 순서도 이 표를 따른다 */
export const APPLY_FLOW_STEPS: [string, string][] = [
  ["신청기관연락처목록", "신청"],
  ["조사기관연락처목록", "조사"],
  ["결정기관연락처목록", "결정"],
  ["지급기관연락처목록", "지급"],
  ["사후관리기관목록", "사후관리"],
  ["이의신청접수기관연락처목록", "이의신청"],
];

/** 제도 목록 보기 방식. readaloud 는 전화 상담 중에 그대로 읽어 주는 화면이다 */
export type ViewMode = "all" | "grouped" | "readaloud";
export type TrackFilter = Track | "all";

export const TRACK_ORDER: Track[] = ["education", "welfare", "medical"];

export const TRACK_DESC: Record<Track, string> = {
  education: "특수교육대상자로 선정되어야 신청할 수 있습니다",
  welfare: "읍면동 행정복지센터에 따로 신청해야 합니다",
  medical: "병원에서 먼저 받아야 합니다",
};

export const STEPS = [
  { no: 1, title: "조건 입력", desc: "상담 중 아동 조건을 입력합니다", href: "#step1" },
  { no: 2, title: "결과 확인", desc: "확인할 제도·마감일·서류가 정리됩니다", href: "#step2" },
  { no: 3, title: "안내문 전달", desc: "학부모용 안내문을 출력해 전달합니다", href: "#step3" },
];

/* 출처: 교육부 「2026 특수교육통계」(2026.4.1 기준) 3~4쪽. 2016년 87,950명 대비 +41.2%.
   일반학교 91,986명 ÷ 124,195명 = 74.1% */
export const FIGURES = [
  { key: "특수교육대상자", value: "124,195", unit: "명", note: "2026년 기준 · 10년간 41% 증가" },
  { key: "일반학교 배치", value: "74.1", unit: "%", note: "2026년 기준 · 91,986명이 일반학교에 배치" },
  { key: "날짜가 있는 마감", value: "12", unit: "개", note: "교육 분야 기준" },
  { key: "시도별 카드 명칭", value: "6", unit: "종", note: "지역별로 다른 지원 명칭" },
];



export const LOOKUP_TARGETS = [
  { id: "guide", label: "선정·배치 지침 문서", hint: "이 교육청 지침이 어디 있는지" },
  { id: "card", label: "바우처 카드 안내", hint: "치료지원·방과후 카드 공식 페이지" },
  { id: "local", label: "지역 자체 지원사업", hint: "그 지역에만 있는 사업" },
] as const;

export type LookupResult = {
  answer: string | null;
  sources: { uri: string; title: string }[];
  queries: string[];
  note?: string;
};

/* ─── 확인이 필요한 항목의 색과 라벨 ─── */

export function alertClass(kind: string) {
  if (kind === "term" || kind === "age9Cross" || kind === "noticeGap") return "alert-danger";
  if (kind === "overlap" || kind === "easyToMiss" || kind === "unregistered")
    return "alert-warning";
  return "alert-info";
}

export function alertTag(kind: string) {
  if (kind === "age9Cross") return "만 9세 마감";
  if (kind === "noticeGap") return "공문 안 감";
  if (kind === "term") return "중요";
  if (kind === "overlap") return "중복 확인";
  if (kind === "easyToMiss") return "놓치기 쉬움";
  if (kind === "unregistered") return "미등록 영역";
  return "안내";
}
