"""규칙 점검 — 모든 조건 조합을 /api/sheet 에 넣고 불변식을 확인한다.

특정 사례가 아니라 「어떤 입력에도 틀린 안내가 안 나오는가」를 본다. 규칙(build-sheet.ts)이나
데이터(data.ts)를 고친 뒤 돌린다. 표준 라이브러리만 쓴다.

    npm run dev  (다른 창)
    python scripts/check-rules.py                 # http://localhost:3000
    python scripts/check-rules.py https://like-bam-ti.vercel.app

「문제 없음」이 나와야 한다. 지역을 새로 열면 REGIONS 에 더한다.
"""
import json, re, sys, urllib.request, itertools, collections

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
BASE_DATE = "2026-03-01"
REGIONS = ["gangwon", "gyeongnam"]
DIS = ["autism", "intellectual", "developmentalDelay", "other"]
LEVELS = ["daycare", "kinder", "elementary", "middle", "high"]
PROCS = ["new", "advance", "reassign", "deferral", "reenroll"]
BIRTHS = ["", "2024-06-15", "2022-01-10", "2020-05-10", "2019-12-31", "2017-02-15", "2017-03-01",
          "2016-01-15", "2014-02-20", "2011-08-08", "2008-03-03"]

# 지침 원문 「제출서류」 표 (강원 2026 길잡이 6~7쪽 · 경남 2026 지침 13~14 · 42~56쪽)
EXPECTED_DOCS = {
    "gangwon": {
        "new": ["applicantList", "requestForm", "basicSurvey", "privacyConsent", "residentCopy",
                "disabilityProof", "medicalRecords", "graduationCert"],
        "advance": ["advanceList", "advanceRequest", "privacyConsent", "residentCopy", "principalOpinionHigh", "iepMinutes"],
        "reassign": ["reassignRequest", "privacyConsent", "iepMinutes", "placementResultCopy", "residentCopy"],
        "deferral": ["deferralRequest", "iepMinutes", "deferralProof"],
        "reenroll": ["reenrollRequest", "residentCopy", "placementResultCopy", "privacyConsent"],
    },
    "gyeongnam": {
        "new": ["applicantList", "requestForm", "basicSurvey", "placementRequest", "principalOpinion", "privacyConsent"],
        "advance": ["advanceList", "advanceRequest", "privacyConsent", "placementResultCopy"],
        "reassign": ["reassignList", "reassignRequest", "privacyConsent", "placementResultCopy", "iepMinutes", "residentCopy"],
        "deferral": ["deferralList", "deferralRequest", "privacyConsent", "iepMinutes", "placementResultCopy", "deferralProof"],
        "reenroll": ["reenrollList", "reenrollRequest", "privacyConsent", "placementResultCopy", "residentCopy"],
    },
}


def post(body):
    req = urllib.request.Request(BASE + "/api/sheet", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for v in o.values():
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


DATE = re.compile(r"(\d{4})년 (\d{1,2})월 (\d{1,2})일")
problems = collections.defaultdict(list)
front = collections.Counter()
n = 0
for region, dis, level, proc, birth in itertools.product(REGIONS, DIS, LEVELS, PROCS, BIRTHS):
    body = dict(regionId=region, disabilityId=dis, levelId=level, procedureId=proc, birthDate=birth)
    if dis == "other":
        body["otherDisabilityLabel"] = "건강장애"
    code, d = post(body)
    n += 1
    tag = f"{region}/{dis}/{level}/{proc}/{birth or '생일없음'}"
    if code != 200:
        problems["HTTP 오류"].append(f"{tag} → {code} {str(d)[:120]}")
        continue
    s = d["sheet"]
    allstr = list(strings(s))
    for t in allstr:
        for bad in ("{{", "undefined", "NaN", "[object"):
            if bad in t:
                problems[f"깨진 문자열 {bad}"].append(f"{tag}: …{t[max(0, t.find(bad) - 30):t.find(bad) + 30]}…")
    L = s["parentLetter"]
    if "미확인" in L:
        problems["안내문에 「미확인」"].append(tag)
    # 지난 날짜를 앞으로 할 일처럼
    # 장애등급제 폐지일(2019-07-01) 같은 과거 사실은 빼고, 기한과 만 9세 안내만 본다
    for src in [*(x["when"] for x in s["deadlines"]), *(w["title"] + w["detail"] for w in s["warnings"] if w["kind"] == "age9Cross"),
                *(ln for ln in L.splitlines() if "만 9세" in ln or "까지" in ln)]:
        for m in DATE.finditer(src):
            iso = f"{m[1]}-{int(m[2]):02d}-{int(m[3]):02d}"
            if iso < BASE_DATE and not any(w in src for w in ("지났", "지나", "지난")):
                problems["지난 날짜를 앞으로 할 일처럼"].append(f"{tag}: {m[0]}")
    # 서류
    keys = [x["key"] for x in s["documents"]]
    if len(keys) != len(set(keys)):
        problems["서류 중복"].append(f"{tag}: {keys}")
    for x in s["documents"]:
        if not x["where"].strip():
            problems["발급처 빈칸"].append(f"{tag}: {x['label']}")
        if "미확인" in x["formNo"] and not x["staffOnly"]:
            problems["서식 번호 미확인 (화면)"].append(f"{region}/{proc}: {x['label']}")
    if not [x for x in s["documents"] if not x["staffOnly"]]:
        problems["보호자 서류 0개"].append(tag)
    # 취학유예 중 학교 전제 제도
    if proc == "deferral":
        names = [p["name"] for p in s["programs"]]
        for bad in ("방과후학교", "지원인력", "통학", "특기적성"):
            if any(bad in nm for nm in names):
                problems["유예 중 학교 전제 제도"].append(f"{tag}: {bad}")
    # 발달지체 · 만 9세
    if dis == "developmentalDelay" and s["age"] is not None and s["age"] >= 10 and not s.get("age9Passed"):
        problems["만 10세 이상 발달지체인데 종료로 안 봄"].append(tag)
    RANGE = {"daycare": (0, 7), "kinder": (2, 7), "elementary": (5, 14), "middle": (11, 17), "high": (14, 21)}
    lo, hi = RANGE[level]
    flagged = any(w["kind"] == "inputCheck" for w in s["keyWarnings"])
    if s["age"] is not None and not (lo <= s["age"] <= hi) and not flagged:
        problems["나이·학교급 불일치인데 알림 없음"].append(tag)
    if (s["age"] is None or lo <= s["age"] <= hi) and flagged:
        problems["맞는 입력에 불일치 알림"].append(tag)
    # ── 원문과 맞는가 (강원 2026 길잡이 · 경남 2026 지침 · 행안부 공공서비스 원문, 2026-10-19 대조) ──
    got = sorted(x["key"] for x in s["documents"])
    if got != sorted(EXPECTED_DOCS[region][proc]):
        problems["제출 서류가 지침 원문과 다름"].append(f"{region}/{proc}: {got}")
    names = [p["name"] for p in s["programs"]]
    if level == "daycare":
        for bad in ("치료지원", "지원인력", "통학비", "방과후학교", "특기적성"):
            if any(bad in nm for nm in names):
                problems["어린이집 아동에게 교육청 서비스"].append(f"{tag}: {bad}")
    if dis == "developmentalDelay" and birth:
        y, m = int(birth[:4]) + 9, int(birth[5:7])
        if region == "gyeongnam":
            ey, em = (y + 1 if m >= 3 else y), 2
        else:
            ey, em = y, m
        import calendar
        want = f"{ey}년 {em}월 {calendar.monthrange(ey, em)[1]}일"
        if s["age9"] != want:
            problems["만 9세 종료일이 지역 규칙과 다름"].append(f"{tag}: {s['age9']} ≠ {want}")
    committee = next((x["when"] for x in s["deadlines"] if x["label"] == "특수교육운영위원회 심사"), "")
    if region == "gyeongnam" and level == "high" and "10월 15일" not in committee:
        problems["경남 고등 운영위원회 일정 빠짐"].append(tag)
    if "월 1회 열립니다" in committee:
        problems["운영위원회 주기를 단정"].append(tag)
    kinder = next((x["when"] for x in s["deadlines"] if "처음학교로" in x["label"]), "")
    if region == "gyeongnam" and "10월 말" in kinder:
        problems["경남에 강원 처음학교로 날짜"].append(tag)
    if level == "kinder" and "교육지원청" not in s["level"]["submitTo"]:
        problems["유치원 신청처"].append(tag)
    if s["programs"] == []:
        problems["제도 0개"].append(tag)
    front[len(s["keyWarnings"])] += 1
    if len(L) > 4000:
        problems["안내문 4000자 넘음"].append(f"{tag}: {len(L)}")

print(f"조합 {n}개 · 1면 경고 분포 {dict(sorted(front.items()))}")
if not problems:
    print("문제 없음")
for k, v in problems.items():
    uniq = sorted(set(v))
    print(f"\n■ {k} — {len(v)}건 (고유 {len(uniq)})")
    for x in uniq[:8]:
        print("   ", x)
