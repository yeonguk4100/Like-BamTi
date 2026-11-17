#!/usr/bin/env bash
# 발표 PPT 를 다시 만든다 — build-deck.js → 폴더 항목 정리 → 발표자 노트(발표-대본-최종.md) → docs/발표/ 로 복사
# 쓰는 법:  cd scripts/발표/deck && npm install && bash build.sh
#   SKILL=<pptx 스킬 폴더>  를 주면 테마 색까지 들어간다 (README 참고)
set -euo pipefail
cd "$(dirname "$0")"
OUT="$PWD/deck.pptx"
NODE_PATH="$PWD/node_modules" node build-deck.js "$OUT"
python - "$OUT" <<'PY'
import sys, zipfile, shutil
src = sys.argv[1]
z = zipfile.ZipFile(src); o = zipfile.ZipFile(src + ".tmp", "w", zipfile.ZIP_DEFLATED)
for i in z.infolist():
    if not i.filename.endswith("/"):
        o.writestr(i, z.read(i.filename))
o.close(); z.close(); shutil.move(src + ".tmp", src)
PY
PYTHONIOENCODING=utf-8 python apply_notes.py "$OUT"
cp "$OUT" "../../../docs/발표/복지그루-해커톤-발표.pptx"
echo "→ docs/발표/복지그루-해커톤-발표.pptx"
