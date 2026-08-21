# 백엔드 API

> 「규칙이 고르고, AI는 못 하는 것만 한다」를 코드 구조로 옮긴 것이다.
> 제도를 고르는 일은 전부 `app/lib/build-sheet.ts` 한 곳에서 일어나고, AI 라우트는 그 결과를 받아 쓴다.

## 왜 이렇게 나눴나

| 층 | 파일 | 하는 일 |
|---|---|---|
| 데이터 | `app/lib/data.ts` | 지역 · 장애영역 · 학교급 · 신청 상황 · 서식 · 제도. `verified`와 `source`가 붙어 있다 |
| 규칙 | `app/lib/build-sheet.ts` | 조건 → 제도·마감일·서류·경고·안내문. 순수 함수. **여기가 유일한 판단 지점** |
| 검증 | `app/lib/validate.ts` | 요청 본문 검사. 모르는 id는 통과시키지 않는다 |
| API | `app/api/*/route.ts` | 위 세 층을 HTTP로 노출 |
| 화면 | `app/page.tsx` | 규칙 모듈을 브라우저에서 직접 부른다 |

**화면과 API가 같은 규칙 모듈을 쓴다.** 그래서 화면에 뜬 시트와 `/api/sheet` 응답이 어긋날 수 없다.
화면이 규칙을 브라우저에서 돌리는 이유는 두 가지다 — 조건을 바꿀 때마다 왕복이 없어 즉시 다시 그려지고,
아동 조건이 서버로 나가지 않는다.

`/api/sheet`는 **교육청 내부 시스템이 붙는 자리**다. 화면 없이 조건만 넣어 시트를 받아 갈 수 있다.

## 규칙 라우트 (AI 없음 · 키 없이 동작)

### `POST /api/sheet`

조건을 받아 확인 시트 한 벌을 돌려준다.

```bash
curl -X POST http://localhost:3000/api/sheet \
  -H "Content-Type: application/json" \
  -d '{"regionId":"gangwon","disabilityId":"developmentalDelay","levelId":"elementary","procedureId":"new","birthDate":"2019-03-14","currentServices":["localChildCenter"]}'
```

| 필드 | 필수 | 값 |
|---|---|---|
| `regionId` | ⭕ | `gangwon` `gyeongnam` `chungnam` `gyeonggi` `incheon` `seoul` |
| `disabilityId` | ⭕ | `autism` `intellectual` `developmentalDelay` `other` |
| `levelId` | ⭕ | `kinder` `elementary` `middle` `high` |
| `birthDate` | ⭕ | `yyyy-mm-dd`. 마감일 계산에만 쓴다 |
| `procedureId` | | `new` `advance` `reassign` `deferral` `reenroll` (기본 `new`) |
| `currentServices` | | `localChildCenter` `togetherCare` `schoolCare` `rehabVoucher` |
| `otherDisabilityLabel` | | 「기타」를 골랐을 때 적는 영역명 (80자까지) |
| `detailNote` | | 상세 메모 (500자까지). 참고용이며 판정에 쓰지 않는다 |
| `sender` | | `{ org, name, tel }` — 안내문 맨 끝 문의처 |

응답 `sheet`의 주요 칸:

| 칸 | 내용 |
|---|---|
| `programs` | 확인해야 할 제도. `track`이 `education`/`welfare`/`medical` |
| `deadlines` | 마감일. `urgent`가 붙은 줄이 상담에서 먼저 짚을 줄 |
| `warnings` | 확인이 필요한 항목 (폐지 용어 · 중복 이용 · 놓치기 쉬움 등) |
| `documents` | 제출 서류와 **그 지역의 서식 번호** |
| `excludedByAge` | 나이 조건으로 목록에서 빠진 제도. 숨기지 않고 이름과 이유를 알려 준다 |
| `age` / `ageBasis` | 만 나이와 그 기준일 |
| `parentLetter` | 규칙이 만든 학부모용 안내문 (AI 없이) |

오류: `400` 본문을 읽지 못함 · `422` 값이 목록에 없음 · `405` GET

### `GET /api/options`

`/api/sheet`에 넣을 수 있는 id 목록. 밖에서 붙일 때 먼저 이걸 읽는다.

### `GET /api/reference`

지역마다 다른 것들의 대조표 — 바우처 카드 명칭, 서식 번호. `null`은 **아직 확인하지 못한 칸**이며 추측으로 채우지 않았다.

### `GET /api/notices`

알림 마당 · 서식 자료실 · FAQ. 공지와 파일 목록은 화면 구성용 가상 데이터이고, 응답에 그렇게 적혀 있다.

### `GET /api/health`

배포 확인용. AI 키가 설정됐는지 `true`/`false`로만 알린다. **키 값은 응답에 넣지 않는다.**

## AI 라우트 (`GEMINI_API_KEY` 필요)

### `POST /api/letter` — 안내문 문장화

`/api/sheet`와 **같은 조건 형식**을 받는다. 서버가 규칙을 먼저 돌리고, 그 결과만 제미나이에 넘긴다.

- 클라이언트가 보낸 문장을 AI에 그대로 넘기지 않는다. 화면을 우회해도 안내문에 아무 내용이나 넣을 수 없다
- **생년월일 · 상세 메모 · 담당자 발신 정보는 제미나이에 보내지 않는다.** 서버에서 잘라낸다
- 문의처 줄은 규칙이 만들어 응답 뒤에 붙인다. AI가 기관명·번호를 고치게 두지 않는다
- Google Search를 쓰지 않는다. 규칙이 정확한 데이터를 넘겼으므로 검색은 오염원이다
- 실패하면 실패를 알린다. 화면은 규칙이 만든 템플릿 안내문을 그대로 유지한다

### `POST /api/lookup` — 우리 데이터에 없는 칸 찾기

```json
{ "target": "guide" | "card" | "local", "regionId": "gangwon" }
```

- Google Search grounding을 쓴다. 검색이 필요한 유일한 자리다
- **출처 URL이 없으면 답을 내지 않는다.** 응답의 `verified`는 항상 `false`
- 데이터베이스를 덮지 않는다. 화면에 후보로만 띄운다
- 지역 이름을 클라이언트에서 받지 않는다. `regionId`만 받아 서버가 `REGIONS`에서 꺼낸다 —
  프롬프트에 임의의 문장이 섞일 자리를 없앴다

## 지키는 것

| 원칙 | 코드에서 어떻게 |
|---|---|
| 판정하지 않는다 | 응답에 자격 여부가 없다. `programs`는 「확인할 목록」이다 |
| 개인정보를 저장하지 않는다 | 데이터베이스가 없다. 라우트가 요청 내용을 로그로 남기지 않는다. 모든 응답이 `Cache-Control: no-store` |
| 근거를 붙인다 | 제도마다 `legalBasis`·`verified`·`source`. `verified: false`는 데모용 예시라는 뜻 |
| 재현성 | 나이를 오늘 날짜가 아니라 `BASE_DATE`(학년도 시작)로 센다. 같은 조건 → 같은 결과 |
| AI가 제도를 고르지 않는다 | AI 라우트는 규칙 결과를 입력으로만 받는다 |
