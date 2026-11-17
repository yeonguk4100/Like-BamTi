"""발표-대본-최종.md 의 슬라이드별 원고를 PPT 발표자 노트에 그대로 넣는다 (대본은 한 벌만).
md 의 6번은 A안 — PPT 에는 6A · 6B 두 장이 있어 7번부터 한 칸씩 밀린다. 6B 노트는 그대로 둔다."""
import os, re, sys
from pptx import Presentation

MD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "docs", "발표", "발표-대본-최종.md")
deck = sys.argv[1]
text = open(MD, encoding="utf-8").read()
body = text.split("## 예상 질문")[0]
secs = {}
for m in re.finditer(r"^### (\d+) · [^\n]*\n(.*?)(?=^### |\Z)", body, re.S | re.M):
    n = int(m.group(1))
    t = m.group(2).replace("---", "").strip()
    t = t.replace("**", "").replace(" / ", " ")
    secs[n] = re.sub(r"\n{3,}", "\n\n", t)

p = Presentation(deck)
slides = list(p.slides)
for n, t in secs.items():
    idx = n if n <= 6 else n + 1          # 1-based PPT 번호
    if len(slides) == 20:                  # 6B 를 지운 뒤라면 밀리지 않는다
        idx = n
    s = slides[idx - 1]
    s.notes_slide.notes_text_frame.text = t
p.save(deck)
print("notes", len(secs), "slides", len(slides))
