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

export type ViewMode = "all" | "grouped";
export type TrackFilter = Track | "all";

export const TRACK_ORDER: Track[] = ["education", "welfare", "medical"];

export const TRACK_DESC: Record<Track, string> = {
  education: "특수교육대상자로 선정되어야 받을 수 있습니다",
  welfare: "읍면동 행정복지센터에 따로 신청해야 합니다",
  medical: "병원에서 먼저 받아야 합니다",
};

export const STEPS = [
  { no: 1, title: "조건 입력", desc: "상담 중 아동 조건을 입력합니다", href: "#step1" },
  { no: 2, title: "결과 확인", desc: "확인할 제도·마감일·서류가 정리됩니다", href: "#step2" },
  { no: 3, title: "안내문 전달", desc: "학부모용 안내문을 출력해 전달합니다", href: "#step3" },
];

export const FIGURES = [
  { key: "특수교육대상자", value: "120,735", unit: "명", note: "2025년 기준 · 10년간 37% 증가" },
  { key: "일반학교 배치", value: "74.1", unit: "%", note: "특수교육대상자 중 74.1%가 일반학교에 배치" },
  { key: "날짜가 있는 마감", value: "12", unit: "개", note: "교육 분야 기준" },
  { key: "시도별 카드 명칭", value: "6", unit: "종", note: "지역별로 다른 지원 명칭" },
];


export const QUICK = [
  { href: "#step1", icon: "doc", label: "상담 시작", desc: "조건 입력" },
  { href: "#step2", icon: "sheet", label: "확인 시트", desc: "담당자용" },
  { href: "#step3", icon: "mail", label: "안내문 만들기", desc: "학부모용" },
  { href: "#deadlines", icon: "calendar", label: "마감일 보기", desc: "재선정·기한" },
  { href: "#reference", icon: "compare", label: "지역별 명칭", desc: "카드 대조표" },
  { href: "#forms", icon: "folder", label: "서식 자료실", desc: "제출 서류" },
  { href: "#faq", icon: "help", label: "자주 묻는 질문", desc: "상담 FAQ" },
  { href: "#notice-board", icon: "bell", label: "공지사항", desc: "지침 개정" },
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
