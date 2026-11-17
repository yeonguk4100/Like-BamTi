// 공식 출처 페이지에서 수치 문장을 찾아 형광펜을 칠하고 그 부근만 잘라 저장한다
const puppeteer = require("puppeteer-core");
const path = require("path");
const OUT = path.join(__dirname, "..", "caps");
const JOBS = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--lang=ko-KR"],
  });
  for (const job of JOBS) {
    const page = await browser.newPage();
    await page.setViewport({ width: job.vw || 1280, height: 900, deviceScaleFactor: job.dsf || 2 });
    try {
      await page.goto(job.url, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 1500));
      const box = await page.evaluate((phrases) => {
        const marks = [];
        for (const ph of phrases) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walker.nextNode())) {
            const i = n.data.indexOf(ph);
            if (i < 0) continue;
            const r = document.createRange();
            r.setStart(n, i);
            r.setEnd(n, i + ph.length);
            // 숨은 요소(요약 · 메타)에 든 같은 글은 건너뛴다
            const rr = r.getBoundingClientRect();
            if (rr.width < 2 || rr.height < 2) continue;
            const m = document.createElement("mark");
            m.style.cssText = "background:#ffe14d;color:inherit;padding:1px 2px;border-radius:2px";
            r.surroundContents(m);
            marks.push(m);
            break;
          }
        }
        if (!marks.length) return null;
        const rs = marks.map((m) => m.getBoundingClientRect());
        const sy = window.scrollY;
        // 그 문단이 들어 있는 본문 칸 너비를 쓴다
        let col = marks[0].parentElement;
        while (col && col.getBoundingClientRect().width < 500) col = col.parentElement;
        const cr = col ? col.getBoundingClientRect() : { left: 0, width: 1280 };
        return {
          found: marks.length,
          top: Math.min(...rs.map((r) => r.top)) + sy,
          bottom: Math.max(...rs.map((r) => r.bottom)) + sy,
          left: Math.max(0, cr.left - 16),
          width: Math.min(1280, cr.width + 32),
        };
      }, job.phrases);
      if (!box) {
        console.log(job.name, "NOT FOUND");
        await page.screenshot({ path: path.join(OUT, job.name + "_full.png"), fullPage: false });
      } else {
        const pad = job.pad ?? 120;
        const y = Math.max(0, box.top - pad);
        const h = Math.min(job.maxH ?? 900, box.bottom - box.top + pad * 2);
        await page.screenshot({
          path: path.join(OUT, job.name + ".png"),
          clip: { x: box.left, y, width: box.width, height: h },
          captureBeyondViewport: true,
        });
        console.log(job.name, "found", box.found, "/", job.phrases.length);
      }
    } catch (e) {
      console.log(job.name, "ERR", e.message.slice(0, 80));
    }
    await page.close();
  }
  await browser.close();
})();
