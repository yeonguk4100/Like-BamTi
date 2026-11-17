// 복지그루 해커톤 발표 v2 — 서비스 소개 → 문제 제기 → 해결 → 시연 → 추후 방향 → 팀 → Q&A
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
// 테마 색을 PPT 안에 써 넣는 도구 — Claude 의 pptx 스킬에 들어 있다. SKILL 이 없으면 건너뛰고(색은 Office 기본), 경고만 낸다
const applyTheme = process.env.SKILL
  ? require(process.env.SKILL + "/scripts/apply_theme.js").applyTheme
  : async () => console.warn("SKILL 경로가 없어 테마 색을 적용하지 않았습니다 (README 참고)");

const CAP = path.join(__dirname, "..", "caps");
const SIZES = JSON.parse(fs.readFileSync(path.join(__dirname, "sizes.json"), "utf8"));
const OUT = process.argv[2];

const THEME = {
  name: "Bokjigru",
  headFontFace: "맑은 고딕",
  bodyFontFace: "맑은 고딕",
  colors: {
    dk1: "1C232B", lt1: "FFFFFF", dk2: "10315C", lt2: "F3F5F8",
    accent1: "1256A0", accent2: "D9971E", accent3: "B8321F", accent4: "6F7A87",
    accent5: "DDE3EA", accent6: "E9F0F8", hlink: "1256A0", folHlink: "6F7A87",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "복지그루 — 해커톤 발표";
pres.author = "어영부영";
const C = pres.SchemeColor;
const NAVY = C.text2, AMBER = C.accent2, RED = C.accent3, MUTED = C.accent4;

pres.defineSlideMaster({
  title: "DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.2, w: 11.7, h: 1.7, fontSize: 40, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.05, w: 11.7, h: 1.6, fontSize: 20, color: "CADCF5", valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontSize: 30, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.4, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: "6F7A87" },
});

/* ── 도우미 ── */
const T = (s, o) => s.addText(o.text, { isTextBox: true, margin: 0, ...o, text: undefined });
const fit = (name, maxW, maxH) => {
  const [pw, ph] = SIZES[name];
  let w = maxW, h = (maxW * ph) / pw;
  if (h > maxH) { h = maxH; w = (maxH * pw) / ph; }
  return { w, h };
};
// 그림자 있는 흰 틀
function frame(s, x, y, w, h, nm) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: C.background1 }, line: { color: "DDE3EA", width: 1 },
    shadow: { type: "outer", color: "10315C", opacity: 0.14, blur: 8, offset: 2, angle: 90 }, objectName: nm,
  });
}
/** 출처 링크를 연 화면 — 주소창이 달린 브라우저 틀 */
function browser(s, name, url, x, y, maxW, maxH) {
  const BAR = 0.34;
  const { w, h } = fit(name, maxW, maxH - BAR);
  frame(s, x, y, w, h + BAR, "browser-" + name);
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: BAR, fill: { color: "E8EDF3" }, line: { type: "none" } });
  ["E5534B", "E3B341", "57AB5A"].forEach((c, i) =>
    s.addShape(pres.shapes.OVAL, { x: x + 0.12 + i * 0.15, y: y + 0.12, w: 0.1, h: 0.1, fill: { color: c }, line: { type: "none" } })
  );
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.62, y: y + 0.06, w: w - 0.74, h: BAR - 0.12, rectRadius: 0.08, fill: { color: C.background1 }, line: { type: "none" } });
  const short = url.replace(/^https?:\/\//, "");
  const maxc = Math.floor((w - 1.0) / 0.075);
  T(s, { text: (short.length > maxc ? short.slice(0, maxc - 1) + "…" : short), x: x + 0.72, y: y + 0.06, w: w - 0.9, h: BAR - 0.12, fontSize: 9, color: "4D5763", valign: "middle", fontFace: "Arial" });
  s.addImage({ path: path.join(CAP, name + ".png"), x, y: y + BAR, w, h, altText: "출처 페이지 " + url, objectName: "page-" + name });
  return { w, h: h + BAR };
}
/** 원문 해당 부분 — 형광펜을 칠한 발췌 */
function excerpt(s, name, x, y, maxW, maxH, label) {
  const { w, h } = fit(name, maxW, maxH);
  frame(s, x - 0.06, y - 0.06, w + 0.12, h + 0.12, "excerpt-" + name);
  s.addImage({ path: path.join(CAP, name + ".png"), x, y, w, h, altText: label || name, objectName: "excerpt-img-" + name });
  if (label) T(s, { text: label, x, y: y + h + 0.1, w: Math.max(w, 4.5), h: 0.28, fontSize: 11, color: MUTED });
  return { w, h };
}
function tag(s, text, x, y, fill, color) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.25, h: 0.3, rectRadius: 0.06, fill: { color: fill }, line: { type: "none" } });
  T(s, { text, x, y, w: 1.25, h: 0.3, fontSize: 10, bold: true, color, align: "center", valign: "middle" });
}
function stat(s, num, label, sub, x, y, w, color, size = 64) {
  T(s, { text: num, x, y, w, h: 1.15, fontSize: size, bold: true, color: color || NAVY, valign: "bottom" });
  T(s, { text: label, x, y: y + 1.2, w, h: 0.5, fontSize: 18, bold: true, color: C.text1 });
  if (sub) T(s, { text: sub, x, y: y + 1.68, w, h: 0.45, fontSize: 13, color: MUTED });
}
function who(s, text) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.78, w: 0.62, h: 0.32, rectRadius: 0.06, fill: { color: C.background2 }, line: { color: "DDE3EA", width: 0.75 } });
  T(s, { text: "대상", x: 0.6, y: 6.78, w: 0.62, h: 0.32, fontSize: 10, bold: true, color: NAVY, align: "center", valign: "middle" });
  T(s, { text, x: 1.35, y: 6.78, w: 10.9, h: 0.32, fontSize: 11, color: MUTED, valign: "middle" });
}
function content(title, section) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
}
/** 출처 — 아래 한 줄. 누르면 원문으로 */
function src(s, text, url) {
  const short = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s.addText([
    { text: "출처  ", options: { bold: true, color: "6F7A87" } },
    { text: text + "   ", options: { color: "6F7A87" } },
    { text: short.length > 48 ? short.slice(0, 47) + "…" : short, options: { color: "1256A0", hyperlink: { url } } },
  ], { x: 0.6, y: 6.42, w: 12.1, h: 0.3, fontSize: 10, isTextBox: true, margin: 0, valign: "middle" });
}
/** 통계 한 장 — 왼쪽 숫자, 오른쪽 원문을 크게 */
function statSlide({ title, stats, ex, exH = 4.6, srcText, url, whoText, notes }) {
  const s = content(title, "문제 제기");
  stats.forEach((st, i) => stat(s, st[0], st[1], st[2], 0.6, 1.5 + i * 2.45, 4.3, st[3]));
  const box = fit(ex, 7.4, exH);
  const y = 1.5 + Math.max(0, (4.75 - box.h) / 2);
  excerpt(s, ex, 5.3, y, 7.4, exH);
  src(s, srcText, url);
  who(s, whoText);
  s.addNotes(notes);
  return s;
}

/* ═════════ 1. 표지 — 서비스를 먼저 ═════════ */
pres.addSection({ title: "서비스 소개" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "서비스 소개" });
  T(s, { text: "어영부영", x: 0.8, y: 1.45, w: 6, h: 0.5, fontSize: 18, bold: true, color: AMBER });
  s.addText("복지그루", { placeholder: "title" });
  s.addText("사람은 더 뽑을 수 없고, 예산은 제자리입니다.\n담당자를 늘리지 않고, 담당자의 시간을 늘리는 도구", { placeholder: "body" });
  s.addNotes(
    "안녕하십니까, 어영부영의 복지그루입니다.\n" +
    "복지그루는 특수교육 상담 담당자가 아이의 조건만 넣으면, 학부모에게 그대로 건넬 수 있는 한 장이 나오는 상담 도구입니다."
  );
}

/* ═════════ 2. 복지그루는 ═════════ */
{
  const s = content("복지그루는 — 어디에 · 무엇을 들고 · 언제까지를 한 장으로", "서비스 소개");
  const { w, h } = fit("app_landing", 7.2, 4.9);
  frame(s, 0.6, 1.55, w, h, "landing-frame");
  s.addImage({ path: path.join(CAP, "app_landing.png"), x: 0.6, y: 1.55, w, h, altText: "복지그루 랜딩페이지", objectName: "landing" });
  const rows = [
    ["누가 쓰나", "특수교육지원센터 · 교육지원청 상담 담당자"],
    ["무엇을 넣나", "지역 · 장애영역 · 학교급 · 신청 상황 — 상담 중 어차피 묻는 것만"],
    ["무엇이 나오나", "안내 전 확인사항 · 학부모 안내문(□ 체크) · 접수할 때 누락 확인"],
    ["무엇을 하지 않나", "판정하지 않고, 아이 정보를 저장하지 않는다"],
  ];
  rows.forEach(([h2, d], i) => {
    const y = 1.6 + i * 1.2;
    s.addShape(pres.shapes.OVAL, { x: 8.2, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: i === 3 ? C.accent2 : C.accent1 }, line: { type: "none" } });
    T(s, { text: String(i + 1), x: 8.2, y: y + 0.05, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
    T(s, { text: h2, x: 8.8, y, w: 3.9, h: 0.4, fontSize: 17, bold: true, color: NAVY });
    T(s, { text: d, x: 8.8, y: y + 0.42, w: 3.9, h: 0.65, fontSize: 13, color: C.text1, valign: "top" });
  });
  T(s, { text: "like-bam-ti.vercel.app", x: 0.6, y: 6.6, w: 7.2, h: 0.3, fontSize: 12, color: MUTED });
  s.addNotes(
    "담당자는 상담 중에 어차피 묻는 네 가지 — 지역, 장애영역, 학교급, 신청 상황 — 만 넣습니다.\n" +
    "그러면 담당자가 안내 전에 짚을 것, 학부모에게 건넬 체크리스트 안내문, 서류를 받을 때 빠진 것을 찾는 화면이 나옵니다.\n" +
    "판정하지 않고, 아이 정보를 저장하지 않습니다. 이 도구가 왜 필요한지부터 말씀드리겠습니다."
  );
}

/* ═════════ 문제 제기 — 통계 ═════════ */
pres.addSection({ title: "문제 제기" });
const HR = "https://www.humanrights.go.kr/base/board/read?boardManagementNo=17&boardNo=7610717&menuNo=115";
statSlide({
  title: "교원이 꼽은 스트레스 1위는 학부모 민원입니다",
  stats: [["83%", "심리적 스트레스 원인 1위", "「보호자(학부모 등)에 대한 민원 대응」", RED]],
  ex: "p_hr_stress2", exH: 3.2,
  srcText: "국가인권위원회 「교원 인권상황 실태조사」(2024) 보고서 92쪽", url: HR,
  whoText: "교원 10,888명 비확률 온라인 설문 (인권위 연구용역 2024) · 3개까지 선택 — 특수교사만의 값이 아닙니다",
  notes: "상담 담당자는 소관이 다른 학부모 민원까지 받습니다. 그 부담이 어느 정도인지 숫자로 보겠습니다. 모든 숫자는 정부기관 원문 페이지에서 가져왔습니다.\n" +
    "국가인권위원회 조사에서 교원이 꼽은 심리적 스트레스 원인 1위는 학부모 민원 대응, 83%였습니다.",
});
{
  const s = content("한국 교사의 학부모 민원 스트레스는 OECD 상위권입니다", "문제 제기");
  s.addChart(pres.charts.BAR, [{ name: "학부모 민원이 스트레스 원인", labels: ["OECD 평균", "한국", "포르투갈 (1위)"], values: [41.6, 56.9, 60.6] }], {
    x: 0.6, y: 1.35, w: 7.4, h: 3.05, barDir: "bar", chartColors: ["B4BDC8", "B8321F", "6F7A87"], varyColors: true,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0.0"%"', dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelColor: "1C232B",
    dataLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 14, catAxisLabelColor: "1C232B", valAxisHidden: true, valAxisMaxVal: 72, valAxisMinVal: 0,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "학부모 민원을 스트레스 원인으로 꼽은 중학교 교사", titleFontSize: 13, titleColor: "4D5763", titleFontFace: "+mn-lt",
  });
  T(s, { text: "조사 대상국 중", x: 8.4, y: 1.9, w: 4.3, h: 0.5, fontSize: 20, bold: true, color: C.text1 });
  T(s, { text: "2위", x: 8.4, y: 2.35, w: 4.3, h: 1.3, fontSize: 80, bold: true, color: RED, valign: "middle" });
  T(s, { text: "한국 56.9% · OECD 평균 41.6%", x: 8.4, y: 3.7, w: 4.3, h: 0.4, fontSize: 15, color: MUTED });
  excerpt(s, "h_kedi3", 0.66, 4.6, 12.0, 1.65);
  src(s, "한국교육개발원 「TALIS 2024 결과 발표」 보도자료 (2025-10-10)", "https://www.kedi.re.kr/khome/main/announce/selectBroadAnnounceForm.do?selectTp=0&board_sq_no=3&article_sq_no=36149");
  who(s, "중학교 교사 (OECD 교수·학습 국제조사 TALIS 2024)");
  s.addNotes(
    "국제적으로 봐도 그렇습니다. OECD 국제조사 TALIS에서 학부모 민원을 스트레스 원인으로 꼽은 한국 중학교 교사는 56.9%로,\n" +
    "조사 대상국 가운데 포르투갈 다음으로 두 번째, 상위권입니다. OECD 평균은 41.6%입니다."
  );
}
{
  const s = content("악성 · 고질 민원 1위는 「같은 요구의 반복」입니다", "문제 제기");
  stat(s, "70.9%", "특이민원 유형 1위", "상습 · 반복적인 민원 청구", 0.6, 1.5, 4.3, RED);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.85, w: 4.3, h: 2.45, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: "DDE3EA", width: 1 }, objectName: "def-card" });
  T(s, { text: "특이민원이란?", x: 0.85, y: 4.0, w: 3.9, h: 0.45, fontSize: 17, bold: true, color: NAVY });
  T(s, { text: "처리 결과에 승복하지 않고 같은 민원을 반복하거나, 폭언 · 고소 등으로 정상 업무를 크게 방해하는 민원", x: 0.85, y: 4.5, w: 3.85, h: 1.2, fontSize: 13.5, color: C.text1, valign: "top" });
  T(s, { text: "흔히 「악성민원」 「고질민원」", x: 0.85, y: 5.75, w: 3.9, h: 0.4, fontSize: 14, bold: true, color: RED });
  excerpt(s, "h_acrc3", 5.3, 1.5, 7.4, 4.75);
  src(s, "국민권익위원회 「2025년 특이민원 실태조사 결과」 브리핑 (2025-09-10)", "https://www.korea.kr/briefing/policyBriefingView.do?newsId=156721832");
  who(s, "393개 공공기관 민원 담당자 1,097명 · 최근 3년 특이민원 경험 86% (국민권익위원회 2025)");
  s.addNotes(
    "민원 담당자 쪽도 같습니다. 국민권익위원회는 처리 결과에 승복하지 않고 반복하거나 폭언 · 고소 등으로 정상 업무를 방해하는 민원을 특이민원, 흔히 말하는 악성 · 고질 민원이라고 부릅니다.\n" +
    "민원 담당자의 86%가 최근 3년 안에 이런 민원을 겪었고, 그 유형 1위가 상습적이고 반복적인 민원 청구, 70.9%였습니다. 같은 사람이 같은 것을 다시 묻는 것이 가장 흔합니다."
  );
}
statSlide({
  title: "교원 둘 중 한 명이 이직을 고려합니다",
  stats: [["46.3%", "교원 이직 고려율", "이직을 고려한 적이 있다 — 5,041명 / 10,888명", RED]],
  ex: "p_hr_leave2", exH: 4.3,
  srcText: "국가인권위원회 「교원 인권상황 실태조사」(2024) 표 3-16 · 보고서 70쪽", url: HR,
  whoText: "교원 10,888명 (인권위 연구용역 2024) — 「이직률」이 아니라 「이직을 고려한 적이 있는 비율」입니다",
  notes: "[6번 A안 — 이직] 그 결과는 이직으로 이어집니다. 교원의 이직 고려율이 46.3%, 둘 중 한 명이 이직을 고려한 적이 있습니다.\n" +
    "(질문이 나오면: 특수교사 이직률 공식 통계는 없습니다. 이 숫자는 교원 전체가 이직을 고려한 비율입니다.)",
});
statSlide({
  title: "특수교사 열 명 중 일곱은 다른 직업이 나았다고 생각합니다",
  stats: [["68.8%", "다른 직업을 택하는 게 좋았을 것", "특수학교 교원", RED], ["20.6%", "다시 선택해도 교사를 하겠다", "다섯 명 중 한 명", NAVY]],
  ex: "p_hr_313", exH: 4.3,
  srcText: "국가인권위원회 「교원 인권상황 실태조사」(2024) 표 3-13 · 보고서 67쪽", url: HR,
  whoText: "특수학교 교원 응답자 602명 (인권위 연구용역 2024) · 교원 전체로는 46.3%가 이직을 고려한 적이 있다 (표 3-16)",
  notes: "[6번 B안 — 후회] 그 결과, 특수학교 교원 열 명 중 일곱은 다른 직업을 택하는 게 좋았을 거라고 답했습니다. 다시 선택해도 교사를 하겠다는 사람은 다섯 명 중 한 명, 20.6%입니다.\n" +
    "교원 전체로 보면 둘 중 한 명, 46.3%가 이직을 고려한 적이 있습니다.\n" +
    "(대상: 인권위 설문에 응답한 특수학교 교원 602명. 특수교사 전체의 값은 아닙니다.)",
});
const ANNUAL = "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=316&boardSeq=107157&lev=0&searchType=null&statusYN=W&page=1&s=moe&m=0302&opType=N";
const CHART_BASE = {
  dataLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt",
  catAxisLabelColor: "6F7A87", valAxisLabelColor: "6F7A87", catAxisLabelFontSize: 11, valAxisLabelFontSize: 10,
  dataLabelFontSize: 10, dataLabelColor: "1C232B", showValue: true,
  valGridLine: { color: "EBEEF2", size: 0.75 }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, titleFontSize: 13, titleColor: "4D5763",
};
const YRS = ["'16", "'17", "'18", "'19", "'20", "'21", "'22", "'23", "'24", "'25", "'26"];
/* 7. 대상자도 늘고 일도 는다 — 세로축을 8만부터 잘라 변화가 보이게 */
{
  const s = content("특수교육대상자는 늘고, 일도 늘어납니다", "문제 제기");
  stat(s, "+41%", "특수교육대상자 10년 증가", "87,950명('16) → 124,195명('26)", 0.6, 1.6, 4.0, RED);
  T(s, { text: "최근 5년 동안 가파르게", x: 0.6, y: 3.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: NAVY });
  T(s, { text: "98,154명('21) → 124,195명('26)\n5년 동안 +26%", x: 0.6, y: 4.4, w: 4.0, h: 0.9, fontSize: 14, color: MUTED, valign: "top" });
  s.addChart(pres.charts.BAR, [{ name: "특수교육대상자", labels: YRS, values: [87950, 89353, 90780, 92958, 95420, 98154, 103695, 109703, 115610, 120735, 124195] }], {
    ...CHART_BASE, x: 4.8, y: 1.35, w: 7.9, h: 4.95, barDir: "col", chartColors: ["1256A0"], barGapWidthPct: 35,
    dataLabelPosition: "outEnd", dataLabelFormatCode: '#,##0', dataLabelFontSize: 10, catAxisLabelFontSize: 12,
    valAxisMinVal: 80000, valAxisMaxVal: 130000, valAxisMajorUnit: 10000, valAxisLabelFormatCode: '#,##0',
    title: "특수교육대상자 수 (명) — 세로축 80,000부터",
  });
  src(s, "교육부 「2026 특수교육 연차보고서」 표 1·2 (15쪽) — 그래프는 표 값으로 그림", ANNUAL);
  who(s, "특수교육대상자 전체 (각 연도 4월 1일 기준)");
  s.addNotes(
    "그런데 특수교육대상자는 계속 늘고 있습니다. 10년 전 8만 8천 명이던 대상자가 올해 12만 4천 명으로 41% 늘었습니다. 특히 최근 5년 동안 가파르게 늘었습니다.\n" +
    "대상자를 선정하는 특수교육지원센터에는 한 해 5만 2천 건의 신청이 들어옵니다. 대상자가 늘수록 문의와 신청도 함께 늘어납니다.\n" +
    "(그래프 세로축은 8만 명부터 시작합니다 — 변화가 보이도록 아래를 잘랐습니다.)"
  );
}
/* 8. 법정 기준으로 계산하면 교사가 모자란다 + 과밀 · 사고 */
{
  const s = content("법정 기준으로 계산하면, 교사가 모자랍니다", "문제 제기");
  // 왼쪽 — 단순 계산
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.45, w: 5.5, h: 4.85, rectRadius: 0.14, fill: { color: C.background2 }, line: { color: "DDE3EA", width: 1 }, objectName: "calc-card" });
  T(s, { text: "법정 기준 — 학생 4명마다 교사 1명", x: 0.9, y: 1.65, w: 5.0, h: 0.45, fontSize: 16, bold: true, color: NAVY });
  T(s, { text: "특수교육법 시행령 제22조 · 학급은 초·중 6명, 고 7명까지 (법 제27조)", x: 0.9, y: 2.08, w: 5.0, h: 0.35, fontSize: 11, color: MUTED });
  s.addText([
    { text: "104,777명", options: { bold: true, color: "1C232B" } },
    { text: "  ÷ 4  =  ", options: { color: "6F7A87" } },
    { text: "26,194", options: { bold: true, color: "1C232B" } },
    { text: " … 1", options: { color: "6F7A87" } },
  ], { x: 0.9, y: 2.6, w: 5.0, h: 0.55, fontSize: 22, isTextBox: true, margin: 0, valign: "middle" });
  T(s, { text: "특수학교 · 특수학급 학생 ÷ 4  →  법정 교사 26,195명", x: 0.9, y: 3.15, w: 5.0, h: 0.35, fontSize: 12, color: MUTED });
  T(s, { text: "그런데 교육부 올해 목표는 그중 일부만 채우는 것 (확보율 82%)", x: 0.9, y: 3.6, w: 5.0, h: 0.5, fontSize: 12, color: "1C232B", valign: "top" });
  T(s, { text: "약 4,700명", x: 0.9, y: 4.2, w: 5.0, h: 1.0, fontSize: 54, bold: true, color: RED, valign: "middle" });
  T(s, { text: "목표를 채워도 모자라는 교사 (단순 계산)", x: 0.9, y: 5.25, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: "1C232B" });
  T(s, { text: "교육부: 특수교사 부족을 기간제로 메우는 중", x: 0.9, y: 5.68, w: 5.0, h: 0.4, fontSize: 11.5, color: MUTED });
  // 오른쪽 — 인천 원문만 크게
  T(s, { text: "2024 인천 — 과밀 특수학급을 맡던 특수교사 사망", x: 6.5, y: 1.55, w: 6.2, h: 0.45, fontSize: 18, bold: true, color: RED });
  T(s, { text: "교육청이 「과밀 특수학급」의 특수교육법 위반 여부를 감사원에 감사 청구 (2025.8)", x: 6.5, y: 2.05, w: 6.2, h: 0.4, fontSize: 12.5, color: MUTED });
  excerpt(s, "h_ice3", 6.56, 2.75, 6.1, 3.5);
  src(s, "특수교육법 시행령 제22조 · 2026 특수교육 연차보고서 표 1·2 · 인천광역시교육청 보도자료(2025-08-13)", "https://ice.go.kr/ice/na/ntt/selectNttInfo.do?mi=&nttSn=3337033");
  who(s, "특수학교 31,993 + 특수학급 72,784명 (2026) — 4,700명은 법정 기준 26,195명에 교육부 목표 확보율 82%를 곱해 뺀 단순 계산");
  s.addNotes(
    "그런데 사람은 기준만큼 늘지 못합니다. 법은 특수교사를 학생 4명마다 1명 두라고 정해 두었습니다.\n" +
    "특수학교와 특수학급 학생 10만 4,777명을 4로 나누면 26,194, 나머지 1 — 교사 26,195명이 필요합니다. 그런데 교육부의 올해 목표는 그 82%입니다. 목표를 다 채워도 약 4,700명이 모자랍니다.\n" +
        "그리고 2024년 인천에서 과밀 특수학급을 맡던 특수교사가 세상을 떠났습니다. 교육청은 과밀 특수학급이 특수교육법을 어겼는지 감사원에 감사를 청구했습니다.\n" +
    "(질문이 나오면: 과밀은 2025년 3.8%로 줄었지만, 교육부는 이를 기간제 교원으로 메웠다고 밝혔습니다. 교원 수 자체는 늘었습니다.)"
  );
}
/* 9. 돈도 제자리 */
{
  const s = content("돈도 제자리 — 1인당 특수교육비는 줄었습니다", "문제 제기");
  stat(s, "−899,000원", "학생 1인당 특수교육비, 전년보다 감소", "2026년 1인당 33,063,000원", 0.6, 1.5, 4.6, RED, 46);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.85, w: 4.4, h: 2.45, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: "DDE3EA", width: 1 }, objectName: "why-card" });
  T(s, { text: "왜 줄었나", x: 0.85, y: 4.0, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: NAVY });
  s.addText([
    { text: "예산  ", options: { color: "6F7A87" } }, { text: "+0.1%", options: { bold: true, color: "1C232B", breakLine: true } },
    { text: "학생  ", options: { color: "6F7A87" } }, { text: "+2.9%", options: { bold: true, color: "B8321F" } },
  ], { x: 0.85, y: 4.45, w: 4.0, h: 0.9, fontSize: 22, isTextBox: true, margin: 0, valign: "top" });
  T(s, { text: "학생은 느는데 예산은 그대로라 한 명 몫이 줄었다. 쓰고 남은 돈이 아니라 처음 편성한 예산이다", x: 0.85, y: 5.4, w: 4.0, h: 0.8, fontSize: 12, color: C.text1, valign: "top" });
  s.addChart(pres.charts.LINE, [{ name: "1인당 특수교육비", labels: YRS, values: [27016000, 29697000, 30398000, 32105000, 32845000, 32487000, 31878000, 33538000, 32296000, 33962000, 33063000] }], {
    ...CHART_BASE, x: 5.3, y: 1.35, w: 7.4, h: 4.95, chartColors: ["B8321F"], lineSize: 3.5, lineDataSymbol: "circle", lineDataSymbolSize: 8,
    dataLabelPosition: "t", dataLabelFormatCode: '#,##0', dataLabelFontSize: 10, catAxisLabelFontSize: 12, valAxisMinVal: 25000000, valAxisMaxVal: 36000000, valAxisMajorUnit: 2500000, valAxisLabelFormatCode: '#,##0',
    title: "학생 1인당 특수교육비 (원) — 세로축 2,500만부터",
  });
  src(s, "교육부 「2026 특수교육 연차보고서」 73쪽 표 3·38 — 그래프는 표 값(천 원 → 원)으로 그림", ANNUAL);
  who(s, "편성 예산(시도교육청 + 국립) ÷ 수혜학생 수 · 물가 미반영 명목 금액 — 「쓰고 남은 돈」이 아니라 편성액");
  s.addNotes(
    "돈도 제자리입니다. 올해 특수교육 예산은 4조 1천억 원으로 1년 전보다 0.1% 늘었는데, 같은 기간 대상자는 2.9% 늘었습니다.\n" +
    "그래서 학생 한 명에게 쓰는 특수교육비는 3천3백6만 3천 원으로, 오히려 89만 9천 원 줄었습니다. 2019년 이후 사실상 제자리입니다.\n" +
    "대상자도 일도 늘었는데, 사람은 기준에 못 미치고 돈은 그대로입니다. 그 사이를 담당자가 메우고 있습니다."
  );
}

/* ═════════ 9. 접근 — 학부모용에서 담당자용으로 ═════════ */
pres.addSection({ title: "해결 방안" });
{
  const s = content("처음엔 학부모용이었습니다 — 인터뷰로 방향을 바꿨습니다", "해결 방안");
  const card = (x, fill, line, head, headColor, lines, color) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 5.2, h: 3.3, rectRadius: 0.14, fill: { color: fill }, line: { color: line, width: 1 } });
    T(s, { text: head, x: x + 0.35, y: 1.85, w: 4.5, h: 0.6, fontSize: 22, bold: true, color: headColor });
    s.addText(lines.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < lines.length - 1 } })), {
      x: x + 0.35, y: 2.6, w: 4.6, h: 2.1, fontSize: 15, color, paraSpaceAfter: 10, valign: "top", isTextBox: true, margin: 0,
    });
  };
  card(0.6, C.background2, "DDE3EA", "학부모가 직접 찾는 앱", NAVY, [
    "학부모는 소관을 모르고 한 곳에 다 묻는다",
    "혼자 찾다가 틀린 안내를 받기도 한다",
    "결국 다시 담당자에게 전화가 온다",
  ], C.text1);
  T(s, { text: "→", x: 5.85, y: 2.75, w: 1.6, h: 0.9, fontSize: 44, bold: true, color: AMBER, align: "center" });
  card(7.5, C.text2, C.text2, "담당자가 쓰는 도구", C.background1, [
    "질문이 모이는 곳은 담당자 책상",
    "담당자가 조건을 넣고",
    "학부모는 담당자가 건네는 한 장을 받는다",
  ], C.background1);
  T(s, { text: "학부모에게 앱을 주면 다시 전화가 옵니다. 담당자에게 도구를 주면 학부모는 한 번에 갖춰 옵니다.", x: 0.6, y: 5.25, w: 12.1, h: 0.45, fontSize: 17, bold: true, color: NAVY });
  T(s, { text: "「정보 부족하면 재요청 드리고 담임 선생님께 여쭤봄」 — 담당자 인터뷰 ①", x: 0.6, y: 5.85, w: 12.1, h: 0.4, fontSize: 13, italic: true, color: MUTED });
  who(s, "교육청 · 특수학교 등 약 20곳 문의 · 심층 인터뷰 2곳 (수원교육지원청 특수교육지원센터 등)");
  s.addNotes(
    "저희도 처음에는 학부모가 직접 찾아보는 서비스를 생각했습니다.\n" +
    "그런데 교육청과 특수학교 등 20곳 정도에 묻고 두 곳을 깊이 인터뷰해 보니, 학부모는 소관을 모르고 한 곳에 다 묻고,\n" +
    "혼자 찾으면 틀린 안내를 받기도 하고, 결국 담당자에게 다시 전화가 옵니다. 질문이 모이는 곳은 담당자 책상이었습니다.\n" +
    "그래서 도구는 담당자가 쓰고, 학부모는 담당자가 건네는 한 장을 받도록 바꿨습니다."
  );
}

/* ═════════ 10. 한 장 ═════════ */
{
  const s = content("조건을 넣으면, 학부모가 한 번에 갖춰 오게 하는 한 장", "해결 방안");
  const a = fit("app_brief_c", 5.95, 3.9), b2 = fit("app_step3_c", 5.9, 3.9);
  frame(s, 0.6, 1.5, a.w, a.h, "brief-frame");
  s.addImage({ path: path.join(CAP, "app_brief_c.png"), x: 0.6, y: 1.5, w: a.w, h: a.h, altText: "안내 전 확인사항 화면" });
  frame(s, 6.8, 1.5, b2.w, b2.h, "letter-frame");
  s.addImage({ path: path.join(CAP, "app_step3_c.png"), x: 6.8, y: 1.5, w: b2.w, h: b2.h, altText: "학부모 안내문 화면" });
  const lab = (x, n, h, d) => {
    s.addShape(pres.shapes.OVAL, { x, y: 5.75, w: 0.42, h: 0.42, fill: { color: C.accent1 }, line: { type: "none" } });
    T(s, { text: n, x, y: 5.75, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
    T(s, { text: h, x: x + 0.55, y: 5.7, w: 3.4, h: 0.32, fontSize: 15, bold: true, color: NAVY });
    T(s, { text: d, x: x + 0.55, y: 6.05, w: 3.4, h: 0.5, fontSize: 12, color: MUTED });
  };
  lab(0.6, "1", "안내 전 확인사항", "담당자가 짚을 것만 몇 줄 — 서류 · 기한");
  lab(4.75, "2", "학부모 안내문", "어디에 · 무엇을 들고 · 언제까지 □ 체크");
  lab(8.9, "3", "접수할 때 누락 확인", "빠진 서류와 발급처를 바로 안내");
  s.addNotes(
    "조건을 넣으면 첫째, 담당자가 안내 전에 짚을 것만 몇 줄로 보여 주고,\n" +
    "둘째, 학부모에게 그대로 건넬 안내문을 체크리스트로 만들고, 셋째, 서류를 받을 때 빠진 서류를 바로 찾아 줍니다.\n" +
    "판정하지 않습니다. 확인 목록을 드리고, 최종 판단은 담당자가 합니다."
  );
}

/* ═════════ 12. 시간 · 예산 · 누가 사나 ═════════ */
{
  const s = content("사람을 더 뽑지 않고 담당자의 시간을 돌려줍니다", "해결 방안");
  const parts = [["반송 · 재문의", "줄어든 건수"], ["×", ""], ["1건 처리 시간", "현장 실측"], ["×", ""], ["인건비", "담당자 시급"], ["=", ""], ["돌아오는 예산", "시범 운영에서 측정"]];
  let x = 0.6;
  parts.forEach(([h, d]) => {
    if (!d) { T(s, { text: h, x, y: 1.85, w: 0.5, h: 0.9, fontSize: 28, bold: true, color: MUTED, align: "center", valign: "middle" }); x += 0.5; return; }
    const last = h === "돌아오는 예산";
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w: 2.55, h: 1.1, rectRadius: 0.1, fill: { color: last ? C.accent2 : C.background2 }, line: { type: "none" } });
    T(s, { text: h, x: x + 0.15, y: 1.85, w: 2.25, h: 0.5, fontSize: 17, bold: true, color: last ? C.background1 : NAVY, align: "center" });
    T(s, { text: d, x: x + 0.15, y: 2.33, w: 2.25, h: 0.4, fontSize: 12, color: last ? C.background1 : MUTED, align: "center" });
    x += 2.55;
  });
  T(s, { text: "누가 사나", x: 0.6, y: 3.4, w: 6, h: 0.5, fontSize: 20, bold: true, color: NAVY });
  [["시도교육청", "구매 — 1곳이 도입하면"], ["교육지원청 · 특수교육지원센터", "산하 전부가 사용"], ["학부모 · 학생", "무료 — 안내문으로 도달"]].forEach(([h, d], i) => {
    const y = 4.05 + i * 0.95;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 6.1, h: 0.75, rectRadius: 0.08, fill: { color: i === 0 ? C.text2 : C.background2 }, line: { type: "none" } });
    T(s, { text: h, x: 0.85, y, w: 3.6, h: 0.75, fontSize: 15, bold: true, color: i === 0 ? C.background1 : NAVY, valign: "middle" });
    T(s, { text: d, x: 4.4, y, w: 2.2, h: 0.75, fontSize: 12, color: i === 0 ? "CADCF5" : MUTED, valign: "middle" });
  });
  T(s, { text: "도입 장벽이 낮은 이유", x: 7.2, y: 3.4, w: 5.5, h: 0.5, fontSize: 20, bold: true, color: NAVY });
  s.addText([
    { text: "아동 정보를 저장하지 않아 개인정보 부담이 적다", options: { bullet: true, breakLine: true } },
    { text: "로그인 · 설치 없이 브라우저에서 바로", options: { bullet: true, breakLine: true } },
    { text: "교육지원청 1곳, 한 달 시범부터", options: { bullet: true, breakLine: true } },
    { text: "시범 지표: 반송 건수 · 재문의 건수 · 확인 시간", options: { bullet: true } },
  ], { x: 7.2, y: 4.05, w: 5.5, h: 2.6, fontSize: 15, color: C.text1, paraSpaceAfter: 10, valign: "top", isTextBox: true, margin: 0 });
  s.addNotes(
    "줄어든 반송과 재문의 건수에 1건 처리 시간과 인건비를 곱하면, 그만큼이 돌아오는 예산입니다. 이 숫자는 미리 부풀리지 않고 시범 운영에서 직접 재겠습니다.\n" +
    "구매자는 시도교육청입니다. 교육청 한 곳이 도입하면 산하 교육지원청 전부가 씁니다.\n" +
    "아동 정보를 저장하지 않아 개인정보 부담이 적고, 로그인 없이 바로 쓸 수 있어 교육지원청 한 곳 한 달 시범으로 시작할 수 있습니다.\n" +
    "이 구조가 어떻게 돌아가는지 말씀드리겠습니다."
  );
}

/* ═════════ 11. 데이터 · 규칙 · AI ═════════ */
{
  const s = content("정보는 공식 원문에서, 제도는 규칙이 고르고, AI는 문장만", "해결 방안");
  const src = [["복지로", "중앙부처 복지서비스 API"], ["정부24", "공공서비스(혜택) API"], ["지자체", "지자체 복지서비스 API"], ["교육청 지침", "강원 · 경남 원문 대조"]];
  src.forEach(([h, d], i) => {
    const y = 1.6 + i * 1.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 3.0, h: 0.82, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: "DDE3EA", width: 1 } });
    T(s, { text: h, x: 0.8, y: y + 0.07, w: 2.7, h: 0.38, fontSize: 15, bold: true, color: NAVY });
    T(s, { text: d, x: 0.8, y: y + 0.44, w: 2.7, h: 0.3, fontSize: 11, color: MUTED });
  });
  const arrow = (x) => T(s, { text: "→", x, y: 2.95, w: 0.5, h: 0.7, fontSize: 30, bold: true, color: MUTED, align: "center" });
  const box = (x, head, body, fill, hc, bc) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w: 2.4, h: 3.05, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" } });
    T(s, { text: head, x: x + 0.2, y: 1.95, w: 2.05, h: 0.6, fontSize: 18, bold: true, color: hc });
    T(s, { text: body, x: x + 0.2, y: 2.65, w: 2.05, h: 2.0, fontSize: 13, color: bc, valign: "top", paraSpaceAfter: 4 });
  };
  arrow(3.62);
  box(4.15, "하루 2번 확인", "12시 · 18시\n공식 원문을 받아\n바뀐 곳을 찾고\n사람이 확인한 뒤 반영", C.accent6, NAVY, C.text1);
  arrow(6.6);
  box(7.2, "규칙이 고른다", "같은 조건이면\n같은 결과\n조합 2,200개 전부 점검\n모든 항목에 출처", C.text2, C.background1, "CADCF5");
  arrow(9.65);
  box(10.25, "한 장", "안내문 · 확인사항\n누락 확인\n출처 링크가 붙어 나간다", C.background2, NAVY, C.text1);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.75, w: 12.1, h: 0.9, rectRadius: 0.1, fill: { color: "FDF6E8" }, line: { color: "E3D1A8", width: 1 } });
  T(s, { text: "AI 활용", x: 0.85, y: 5.75, w: 1.2, h: 0.9, fontSize: 15, bold: true, color: "8A5A06", valign: "middle" });
  s.addText([
    { text: "만들 때  ", options: { bold: true } },
    { text: "Claude(Claude Code) — 개발 · 공식 원문 대조 · 근거 조사   |   GPT — 아이디어 검토 · 문장 다듬기", options: { breakLine: true } },
    { text: "서비스 안  ", options: { bold: true } },
    { text: "Gemini — 안내문을 쉬운 문장으로 · 빈칸 찾기(출처 URL이 없으면 답하지 않음)" },
  ], { x: 2.1, y: 5.75, w: 10.4, h: 0.9, fontSize: 12.5, color: C.text1, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    "정보가 틀리면 어떻게 하느냐 — 가장 먼저 받는 질문입니다.\n" +
    "복지그루는 복지로, 정부24, 지자체 복지서비스 공식 API와 교육청 지침 원문에서 가져오고, 하루 두 번 원문이 바뀌었는지 확인해 사람이 확인한 뒤 반영합니다.\n" +
    "어떤 제도를 안내할지는 AI가 아니라 규칙이 고릅니다. 같은 조건이면 같은 결과가 나오고, 2,200개 조합을 전부 점검합니다.\n" +
    "AI는 만들 때 Claude와 GPT를 썼고, 서비스 안에서는 Gemini가 안내문을 쉬운 문장으로 다듬는 일만 합니다.\n" +
    "이제 실제로 어떻게 쓰는지 보여 드리겠습니다."
  );
}

/* ═════════ 13. 시연 ═════════ */
pres.addSection({ title: "시연" });
{
  const s = content("시연 — 랜딩페이지부터 상담까지", "시연");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.5, w: 8.6, h: 4.85, rectRadius: 0.12, fill: { color: C.text2 }, line: { type: "none" }, objectName: "video-slot" });
  T(s, { text: "▶", x: 0.6, y: 2.95, w: 8.6, h: 1.0, fontSize: 54, color: C.background1, align: "center" });
  T(s, { text: "시연 영상 (2~3분) — 이 자리에 넣습니다", x: 0.6, y: 4.1, w: 8.6, h: 0.5, fontSize: 16, color: "CADCF5", align: "center" });
  const flow = ["랜딩페이지", "상담 시작하기", "조건 4가지 선택", "결과 확인 (2초)", "안내 전 확인사항", "학부모 안내문 · 복사", "접수할 때 누락 확인"];
  flow.forEach((f, i) => {
    const y = 1.55 + i * 0.68;
    s.addShape(pres.shapes.OVAL, { x: 9.6, y: y + 0.04, w: 0.4, h: 0.4, fill: { color: i === 0 ? C.accent2 : C.accent1 }, line: { type: "none" } });
    T(s, { text: String(i + 1), x: 9.6, y: y + 0.04, w: 0.4, h: 0.4, fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle" });
    T(s, { text: f, x: 10.15, y, w: 2.6, h: 0.48, fontSize: 14, bold: i === 0, color: C.text1, valign: "middle" });
  });
  s.addNotes("[시연 영상 재생 — 말을 얹지 않는다] 영상이 끝나면: 「실제 조건 하나로 30초 안에 한 장이 나옵니다.」");
}

/* ═════════ 추후 발전 방향 — 기업용 버전 ═════════ */
pres.addSection({ title: "추후 발전 방향" });
{
  const s = content("추후 발전 방향 — 학교 안에서 기업까지", "추후 발전 방향");
  [["1", "지역 넓히기", "강원 · 경남 → 나머지 시도\n절차는 같고 이름 · 서식만 다르다"],
   ["2", "기한 알림 · 체크", "연락처를 저장하지 않고\n안내문 QR → 학부모 휴대폰 캘린더"]].forEach(([n, h, d], i) => {
    const y = 1.6 + i * 2.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 4.2, h: 2.15, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: "DDE3EA", width: 1 } });
    s.addShape(pres.shapes.OVAL, { x: 0.9, y: y + 0.3, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { type: "none" } });
    T(s, { text: n, x: 0.9, y: y + 0.3, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
    T(s, { text: h, x: 1.55, y: y + 0.3, w: 3.1, h: 0.5, fontSize: 18, bold: true, color: NAVY, valign: "middle" });
    T(s, { text: d, x: 0.9, y: y + 1.0, w: 3.7, h: 0.9, fontSize: 13.5, color: C.text1, valign: "top" });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 1.6, w: 7.6, h: 4.55, rectRadius: 0.16, fill: { color: C.text2 }, line: { type: "none" }, objectName: "biz-card" });
  s.addShape(pres.shapes.OVAL, { x: 5.5, y: 1.95, w: 0.6, h: 0.6, fill: { color: C.accent2 }, line: { type: "none" } });
  T(s, { text: "3", x: 5.5, y: 1.95, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: C.background1, align: "center", valign: "middle" });
  T(s, { text: "기업용 복지그루", x: 6.3, y: 1.95, w: 6.0, h: 0.6, fontSize: 28, bold: true, color: C.background1, valign: "middle" });
  T(s, { text: "장애인을 고용하는 기업 인사담당자에게도 같은 한 장", x: 5.5, y: 2.8, w: 6.9, h: 0.5, fontSize: 17, bold: true, color: "F2C46B" });
  s.addText([
    { text: "기업도 장애인 고용 제도와 공문을 매번 확인해야 한다", options: { bullet: true, breakLine: true } },
    { text: "장려금 · 부담금이 해마다 새로 생기고 바뀐다", options: { bullet: true, breakLine: true } },
    { text: "학교에서 만난 아이를 졸업 뒤 일터까지 같은 방식으로", options: { bullet: true } },
  ], { x: 5.5, y: 3.5, w: 6.9, h: 2.3, fontSize: 16, color: C.background1, paraSpaceAfter: 14, valign: "top", isTextBox: true, margin: 0 });
  s.addNotes(
    "앞으로의 방향은 세 가지입니다. 첫째, 강원과 경남에서 나머지 시도로 넓힙니다. 둘째, 연락처를 저장하지 않는 기한 알림을 붙입니다.\n" +
    "그리고 저희가 가장 크게 보는 것이 셋째, 기업용 복지그루입니다. 장애인을 고용하는 기업도 관련 제도와 공문을 매번 확인해야 합니다."
  );
}
{
  const s = content("기업도 바뀌는 제도를 매번 확인해야 합니다", "추후 발전 방향");
  T(s, { text: "올해부터", x: 0.6, y: 1.5, w: 4.3, h: 1.0, fontSize: 48, bold: true, color: RED, valign: "bottom" });
  T(s, { text: "새 장려금이 생겼고", x: 0.6, y: 2.55, w: 4.3, h: 0.45, fontSize: 18, bold: true, color: C.text1 });
  T(s, { text: "50~99인 기업 · 중증장애인 신규 채용 시 고용개선 장려금", x: 0.6, y: 3.0, w: 4.3, h: 0.7, fontSize: 13, color: MUTED, valign: "top" });
  T(s, { text: "강화 계획", x: 0.6, y: 3.85, w: 4.3, h: 1.0, fontSize: 48, bold: true, color: NAVY, valign: "bottom" });
  T(s, { text: "부담금도 바뀝니다", x: 0.6, y: 4.9, w: 4.3, h: 0.45, fontSize: 18, bold: true, color: C.text1 });
  T(s, { text: "반복 · 고의로 고용 의무를 회피하는 기업 대상", x: 0.6, y: 5.35, w: 4.3, h: 0.6, fontSize: 13, color: MUTED, valign: "top" });
  excerpt(s, "h_moel_change", 5.3, 2.2, 7.4, 3.2);
  src(s, "고용노동부 보도자료 「민간기업, 제도 시행 35년 만에 장애인 의무고용률(3.1%) 첫 달성」 (2026-04-29) 3쪽", "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19323");
  who(s, "의무고용 대상: 국가 · 지자체, 상시근로자 50명 이상 사업체 33,452개소 (고용노동부 2026-04-29)");
  s.addNotes(
    "실제로 올해 고용노동부 발표를 보면, 50~99인 기업에는 올해부터 새 장려금이 생겼고, 고용 의무를 회피하는 기업의 부담금은 강화할 계획이라고 합니다.\n" +
    "의무고용 대상 사업체만 3만 3천여 곳입니다. 이 기업 담당자들도 바뀌는 제도를 매번 찾아 확인해야 합니다."
  );
}
{
  const s = content("그 기업으로 우리 학생들이 갑니다", "추후 발전 방향");
  stat(s, "23.1%", "장애인 노동자 중 지적 · 자폐 · 정신", "처음으로 20%를 크게 넘었다", 0.6, 1.5, 4.3, NAVY);
  stat(s, "73.8%", "장애인을 고용하지 않은 기업", "「수행할 만한 직무를 찾기 힘들다」", 0.6, 3.95, 4.3, RED);
  excerpt(s, "h_moel_231", 5.3, 1.6, 7.4, 2.0);
  excerpt(s, "p_kead_738", 5.3, 3.95, 7.4, 2.2);
  src(s, "고용노동부 보도자료 (2026-04-29) 3쪽 · 고용개발원 「2025 기업체장애인고용실태조사」 163쪽", "https://edi.kead.or.kr/BoardType01.do?bid=21&mid=49&cmd=_view&idx=38369");
  who(s, "장애인 노동자 전체 (고용노동부 2026) · 장애인 미고용 기업체 (고용개발원 2025, 2024.12.31 기준)");
  s.addNotes(
    "그리고 그 기업으로 우리 학생들이 갑니다. 장애인 노동자 가운데 지적 · 자폐 · 정신 장애 비중이 23.1%로 처음 20%를 크게 넘었습니다.\n" +
    "반대로 장애인을 고용하지 않은 기업의 73.8%는 시킬 직무를 찾기 힘들다고 답했습니다. 학교에서 쌓은 정보가 졸업과 함께 끊기지 않게, 기업 쪽에도 같은 한 장이 필요합니다."
  );
}
{
  const s = content("기업용 복지그루 — 지금 구조를 그대로", "추후 발전 방향");
  [["넣는다", "상시근로자 수 · 업종\n장애인 근로자 현황", C.background2, NAVY, C.text1],
   ["고른다", "해당 장려금 · 지원 제도는\n규칙이 고르고\n공문은 하루 2번 확인", C.text2, C.background1, "CADCF5"],
   ["받는다", "신청할 제도 · 서류 · 기한\n이번에 바뀐 공문만 따로", C.accent2, C.background1, C.background1]].forEach(([h, d, fill, hc, bc], i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.8, w: 3.85, h: 3.2, rectRadius: 0.14, fill: { color: fill }, line: { type: "none" } });
    T(s, { text: h, x: x + 0.35, y: 2.1, w: 3.2, h: 0.8, fontSize: 32, bold: true, color: hc });
    T(s, { text: d, x: x + 0.35, y: 3.05, w: 3.2, h: 1.7, fontSize: 17, color: bc, valign: "top" });
    if (i < 2) T(s, { text: "→", x: x + 3.82, y: 3.0, w: 0.3, h: 0.6, fontSize: 22, bold: true, color: MUTED, align: "center" });
  });
  T(s, { text: "판정하지 않고 · 회사와 직원 정보를 저장하지 않고 · 출처를 붙인다 — 다음 단계: 기업 인사담당자 인터뷰", x: 0.6, y: 5.5, w: 12.1, h: 0.45, fontSize: 15, color: MUTED });
  s.addNotes(
    "기업용 복지그루는 지금 구조를 그대로 씁니다. 인사담당자가 회사 조건을 넣으면, 규칙이 해당 장려금과 지원 제도를 고르고,\n" +
    "공문과 지침을 하루 두 번 확인해 바뀐 것만 따로 보여 줍니다. 다음 단계로 기업 인사담당자 인터뷰를 해서 니즈를 확인하겠습니다."
  );
}

/* ═════════ 15. 팀원 소개 ═════════ */
pres.addSection({ title: "팀 소개" });
{
  const s = content("팀원 소개 — 어영부영", "팀 소개");
  const team = [
    ["어영욱", "기획 · 현장 인터뷰 · 개발 총괄", ["문제 정의와 서비스 방향", "교육청 · 특수학교 문의와 인터뷰", "발표"], C.text2, C.background1, "CADCF5", "사람"],
    ["Claude", "개발 · 공식 원문 대조 · 근거 조사", ["Claude Code로 화면 · 규칙 · API 개발", "지침 원문과 데이터 대조", "통계 출처 확인"], C.background2, NAVY, "1C232B", "AI"],
    ["GPT", "아이디어 검토 · 문장 다듬기", ["기획 아이디어 검토", "질문지 · 문서 문장 다듬기", ""], C.background2, NAVY, "1C232B", "AI"],
  ];
  team.forEach(([name, role, items, fill, hc, bc, kind], i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 3.85, h: 4.6, rectRadius: 0.16, fill: { color: fill }, line: { type: "none" }, objectName: "member-" + i });
    s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: 1.95, w: 1.1, h: 1.1, fill: { color: i === 0 ? C.accent2 : C.accent1 }, line: { type: "none" } });
    T(s, { text: name.slice(0, 1), x: x + 0.35, y: 1.95, w: 1.1, h: 1.1, fontSize: 30, bold: true, color: C.background1, align: "center", valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 1.75, y: 2.15, w: 1.8, h: 0.7, rectRadius: 0.12, fill: { color: i === 0 ? C.accent2 : C.accent6 }, line: { type: "none" } });
    T(s, { text: kind, x: x + 1.75, y: 2.15, w: 1.8, h: 0.7, fontSize: 24, bold: true, color: i === 0 ? C.background1 : NAVY, align: "center", valign: "middle" });
    T(s, { text: name, x: x + 0.35, y: 3.25, w: 3.2, h: 0.55, fontSize: 24, bold: true, color: hc });
    T(s, { text: role, x: x + 0.35, y: 3.85, w: 3.2, h: 0.45, fontSize: 14, bold: true, color: i === 0 ? "F2C46B" : "1256A0" });
    const its = items.filter(Boolean);
    s.addText(its.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < its.length - 1 } })), {
      x: x + 0.35, y: 4.45, w: 3.2, h: 1.6, fontSize: 13, color: bc, paraSpaceAfter: 6, valign: "top", isTextBox: true, margin: 0,
    });
  });
  T(s, { text: "인간 어영욱 · AI Claude · AI GPT — 판단과 현장은 사람이, 반복과 대조는 AI가", x: 0.6, y: 6.45, w: 12.1, h: 0.4, fontSize: 15, bold: true, color: NAVY });
  s.addNotes(
    "저희 팀 어영부영은 인간 어영욱, 그리고 AI Claude와 GPT가 함께했습니다. 저 어영욱이 기획과 현장 인터뷰, 발표를 맡았고,\n" +
    "Claude가 Claude Code로 개발과 공식 원문 대조, 근거 조사를, GPT가 아이디어 검토와 문장 다듬기를 맡았습니다.\n" +
    "복지그루가 담당자에게 하려는 일과 같습니다 — 판단과 현장은 사람이, 반복과 대조는 AI가."
  );
}

/* ═════════ 16. Q&A ═════════ */
pres.addSection({ title: "Q&A" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Q&A" });
  s.addText("Q & A", { placeholder: "title" });
  s.addText("반복 확인을 줄여, 학부모와 직접 상담할 시간을 늘립니다\n복지그루 · like-bam-ti.vercel.app", { placeholder: "body" });
  s.addNotes(
    "[예상 질문]\n" +
    "Q. 정보가 틀리면? — 공식 API와 지침 원문에서 가져오고 항목마다 출처 링크를 붙입니다. 하루 두 번 원문 변경을 확인해 사람이 확인한 뒤 반영합니다. 제도는 AI가 아니라 규칙이 고릅니다.\n" +
    "Q. UI는 어떤 기준으로? — 정부24 · 복지로 같은 기존 공공 서비스 화면을 참고했습니다. 담당자가 쓰는 순서대로 확인사항 → 안내문 → 접수 확인을 배치했습니다.\n" +
    "Q. 이직률 통계가 있나? — 특수교사 이직률 공식 통계는 없습니다. 그래서 「이직을 고려한 비율」 46.3%를 썼습니다."
  );
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
