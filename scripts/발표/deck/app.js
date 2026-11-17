// 배포된 복지그루 화면을 찍는다 — 랜딩 · 상담 결과
const puppeteer = require("puppeteer-core");
const path = require("path");
const OUT = path.join(__dirname, "..", "caps");
const BASE = process.argv[2] || "https://like-bam-ti.vercel.app";

(async () => {
  const b = await puppeteer.launch({
    executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));
  console.log("landing title:", await p.title());
  await p.screenshot({ path: path.join(OUT, "app_landing.png") });

  await p.goto(BASE + "/consult", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  await p.screenshot({ path: path.join(OUT, "app_input.png") });
  // 버튼 글자로 조건을 고른다
  const clickText = async (t) =>
    p.evaluate((t) => {
      const el = [...document.querySelectorAll("button,label")].find(
        (e) => e.textContent.trim() === t && !e.disabled
      );
      if (el) { el.click(); return true; }
      return false;
    }, t);
  for (const t of process.argv.slice(3)) console.log(t, await clickText(t));
  const go = await p.evaluate(() => {
    const el = [...document.querySelectorAll("button")].find((e) => e.textContent.includes("결과 확인"));
    if (el) { el.click(); return true; }
    return false;
  });
  console.log("result button", go);
  await new Promise((r) => setTimeout(r, 3500));
  for (const id of ["brief", "step3", "intake"]) {
    const ok = await p.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const d = el.querySelector("details");
      if (d) d.open = true;
      el.scrollIntoView();
      return true;
    }, id);
    await new Promise((r) => setTimeout(r, 800));
    if (ok) await p.screenshot({ path: path.join(OUT, "app_" + id + ".png") });
    console.log(id, ok);
  }
  await b.close();
})();
