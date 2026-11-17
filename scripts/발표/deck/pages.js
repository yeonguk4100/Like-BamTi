// 출처 링크를 실제로 열어 첫 화면(제목 · 게시 기관 · 날짜)을 찍는다
const puppeteer = require("puppeteer-core");
const path = require("path");
const OUT = path.join(__dirname, "..", "caps");
const JOBS = [
  ["pg_moel", "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19323", "의무고용현황"],
  ["pg_hr", "https://www.humanrights.go.kr/base/board/read?boardManagementNo=17&boardNo=7610717&menuNo=115", "교원 인권상황 실태조사"],
  ["pg_kedi", "https://www.kedi.re.kr/khome/main/announce/selectBroadAnnounceForm.do?selectTp=0&board_sq_no=3&article_sq_no=36149", "TALIS"],
  ["pg_acrc", "https://www.korea.kr/briefing/policyBriefingView.do?newsId=156721832", "특이민원 실태조사"],
  ["pg_moe_annual", "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=316&boardSeq=107157&lev=0&searchType=null&statusYN=W&page=1&s=moe&m=0302&opType=N", "연차보고서"],
  ["pg_kead", "https://edi.kead.or.kr/BoardType01.do?bid=21&mid=49&cmd=_view&idx=38369", "기업체"],
];

(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--lang=ko-KR"] });
  for (const [name, url, key] of JOBS) {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    try {
      await p.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 1500));
      // 제목 글자가 있는 곳까지 내려서 그 위아래를 찍는다
      const top = await p.evaluate((key) => {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          if (n.data.includes(key)) {
            const el = n.parentElement;
            const r = el.getBoundingClientRect();
            if (r.height > 0 && r.top + window.scrollY > 100) {
              const m = document.createElement("mark");
              el.style.outline = "4px solid #f2b705";
              el.style.outlineOffset = "4px";
              return r.top + window.scrollY;
            }
          }
        }
        return null;
      }, key);
      const y = top === null ? 0 : Math.max(0, top - 260);
      await p.screenshot({ path: path.join(OUT, name + ".png"), clip: { x: 0, y, width: 1280, height: 620 }, captureBeyondViewport: true });
      console.log(name, top === null ? "title not found" : "ok", Math.round(y));
    } catch (e) {
      console.log(name, "ERR", e.message.slice(0, 80));
    }
    await p.close();
  }
  await b.close();
})();
