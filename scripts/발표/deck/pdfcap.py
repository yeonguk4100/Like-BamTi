"""PDF 보고서에서 수치를 찾아 형광펜을 칠하고 그 부근을 잘라 PNG로 저장한다.
사용: python pdfcap.py <pdf> <out_name> <쪽 힌트 키워드> <강조할 문구>...
쪽 힌트 키워드가 들어 있고 강조 문구가 가장 많이 들어 있는 쪽을 고른다."""
import sys, fitz, os

pdf, name, hint, *phrases = sys.argv[1:]
OUT = os.path.join(os.path.dirname(__file__), "..", "caps")
doc = fitz.open(pdf)
best = None
PAGES = [int(os.environ["PAGE"]) - 1] if os.environ.get("PAGE") else range(len(doc))
for pno in PAGES:
    pg = doc[pno]
    txt = pg.get_text()
    if hint not in txt:
        continue
    hits = [(ph, pg.search_for(ph)) for ph in phrases]
    score = sum(1 for _, r in hits if r)
    if best is None or score > best[0]:
        best = (score, pno, hits)
if not best:
    print(name, "NO PAGE"); sys.exit()
score, pno, hits = best
pg = doc[pno]
rects = []
for ph, rs in hits:
    for r in rs[:1]:
        a = pg.add_highlight_annot(r)
        a.set_colors(stroke=(1, 0.88, 0.3)); a.update()
        rects.append(r)
hr = [r for r in pg.search_for(hint)][:1]
allr = rects + hr
if allr:
    x0 = pg.rect.x0 + 20; x1 = pg.rect.x1 - 20
    y0 = max(pg.rect.y0, min(r.y0 for r in allr) - 40)
    y1 = min(pg.rect.y1, max(r.y1 for r in allr) + 40)
    clip = fitz.Rect(x0, y0, x1, y1)
else:
    clip = pg.rect
pix = pg.get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip)
pix.save(os.path.join(OUT, name + ".png"))
print(name, "page", pno + 1, "hits", score, "/", len(phrases), "clip", [round(v) for v in clip])
