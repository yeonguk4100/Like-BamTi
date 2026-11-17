# 발표 PPT 만들기

[docs/발표/복지그루-해커톤-발표.pptx](../../docs/발표/복지그루-해커톤-발표.pptx)는 여기 스크립트로 만든다.
**슬라이드를 PowerPoint에서 직접 고치면 다음에 다시 만들 때 덮어써진다** — 고칠 것은 `deck/build-deck.js`에서 고친다.
발표자 노트는 [docs/발표/발표-대본-최종.md](../../docs/발표/발표-대본-최종.md)에서 가져온다 (대본은 그 한 벌).

## 다시 만들기

```bash
cd scripts/발표/deck
```

```bash
npm install
```

```bash
bash build.sh
```

- `npm install` 은 이 폴더(`pptxgenjs` · `puppeteer-core`)에만 깐다. 앱 의존성과 따로다
- 노트를 넣는 데 `python-pptx` 가 필요하다 (`pip install python-pptx`)
- **테마 색**은 Claude pptx 스킬의 `apply_theme.js` 로 넣는다. `SKILL=<pptx 스킬 폴더>` 를 주면 적용되고, 없으면 경고만 내고 Office 기본 색으로 나온다

## 파일

| 파일 | 하는 일 |
|---|---|
| `deck/build-deck.js` | 슬라이드 20여 장 전체. 6번은 A안(이직) · B안(후회) 두 장 |
| `deck/apply_notes.py` | 최종 대본을 발표자 노트로 |
| `deck/cap.js` | 출처 웹 페이지에서 문장을 찾아 형광펜을 칠해 찍는다 (`node cap.js jobs/jobsN.json`) |
| `deck/pdfcap.py` | 보고서 PDF에서 쪽을 찾아 형광펜 · 잘라내기 (`PAGE=쪽 python pdfcap.py <pdf> <이름> <힌트> <문구>…`) |
| `deck/app.js` · `deck/pages.js` | 배포 사이트 화면 · 출처 첫 화면 찍기 |
| `deck/sizes.json` | 캡처 이미지 크기 (비율 맞춤용). 캡처를 새로 만들면 다시 잰다 |
| `caps/` | 슬라이드에 들어가는 캡처 원본 |

크롬 위치가 다르면 `CHROME=<chrome 실행 파일>` 을 준다.
보고서 PDF 원본(인권위 · 연차보고서 · 고용개발원 · 고용노동부)은 용량이 커서 넣지 않았다 — 링크는 [발표-대본.md](../../docs/발표/발표-대본.md) 출처 표.

## 렌더링 확인

글자 넘침 · 겹침은 그림으로 뽑아 본다. 이 PC에서는 PowerPoint로 `Slide.Export` (PowerShell COM), PowerPoint가 없는 곳에서는 LibreOffice `soffice --headless --convert-to pdf` 를 쓴다.
