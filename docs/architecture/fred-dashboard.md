# Architecture: FRED Macroeconomic Dashboard

## 1. Design Overview

3-tier 단순 구조:

```
Browser (Chart.js)  ──HTTP──▶  Express server  ──HTTPS──▶  FRED API
  public/index.html              src/server.js             api.stlouisfed.org
  public/app.js                  src/fred.js               (api_key 서버측 주입)
                                 src/series.js (allowlist)
```

핵심 제약(P1 검증): FRED는 CORS 미지원 → 브라우저 직접 호출 불가. 따라서 Express가
프록시. API 키는 서버 환경변수에만 존재하고 클라이언트로 절대 전송하지 않는다.

데이터 흐름: 브라우저가 `/api/series/:id` 호출 → 서버가 allowlist 확인 → FRED 호출(키 주입)
→ observations 정규화 → JSON 반환 → 프론트가 Chart.js로 렌더.

## 2. File Structure

```
src/
├── server.js        # Express app: 라우트(/, /api/series/:id), 정적 서빙. createApp() export (테스트용)
├── fred.js          # FRED 호출 + 정규화 (fetchSeries, normalizeObservations)
├── series.js        # allowlist + 카테고리 메타 (SERIES, CATEGORIES, isAllowed)
└── config.js        # 환경변수 로드 (getApiKey — 미설정 시 throw)

public/
├── index.html       # 5개 카테고리 카드 + Chart.js CDN + 카드별 <canvas>
└── app.js           # fetch 프록시 → Chart.js line chart 렌더, 카드별 에러 상태

tests/
├── unit/
│   ├── fred.test.js     # normalizeObservations, fetchSeries(fetch mock)
│   ├── series.test.js   # allowlist/isAllowed, CATEGORIES 구성
│   └── config.test.js   # getApiKey (env 유무)
├── integration/
│   └── api.test.js      # supertest로 createApp() — /api/series/:id 실서버(실 FRED) + allowlist 거부
└── e2e/
    └── dashboard.spec.js # Playwright 실브라우저: 5 카드, 차트 캔버스 렌더, 에러 상태

.env                 # FRED_API_KEY=... (gitignored)
.env.example         # FRED_API_KEY=  (커밋, 사용법 안내)
package.json         # express, scripts; devDeps: jest, supertest, @playwright/test
playwright.config.js
```

## 3. Interface Contract  (P4·P5가 이 시그니처를 따른다)

### src/series.js
```js
// 8개 대표 지표. 단일 출처 — 프론트/백 공유 개념.
// SERIES[id] = { id, label, category, units }
const SERIES = {
  FEDFUNDS: { id:'FEDFUNDS', label:'기준금리',   category:'금리', units:'%' },
  DGS10:    { id:'DGS10',    label:'국채금리(10Y)', category:'금리', units:'%' },
  CPIAUCSL: { id:'CPIAUCSL', label:'소비자물가 CPI', category:'물가', units:'Index' },
  UNRATE:   { id:'UNRATE',   label:'실업률',     category:'고용', units:'%' },
  GDPC1:    { id:'GDPC1',    label:'실질 GDP',   category:'성장', units:'Bil$' },
  INDPRO:   { id:'INDPRO',   label:'산업생산',   category:'성장', units:'Index' },
  SP500:    { id:'SP500',    label:'S&P 500',    category:'시장', units:'Index' },
  DTWEXBGS: { id:'DTWEXBGS', label:'달러지수',   category:'시장', units:'Index' },
};
// CATEGORIES: 렌더 순서 보장 배열 [{ name:'금리', ids:['FEDFUNDS','DGS10'] }, ...]
const CATEGORIES = [...];
function isAllowed(id) // → boolean  (id in SERIES)
module.exports = { SERIES, CATEGORIES, isAllowed };
```

### src/config.js
```js
function getApiKey()
// → string. process.env.FRED_API_KEY 반환.
// 미설정/빈문자 → throw Error('FRED_API_KEY is not set') (NFR-002, EDGE-003). 키 값은 메시지에 미포함.
module.exports = { getApiKey };
```

### src/fred.js
```js
// 결측 '.' 제외, value를 Number로. 날짜 오름차순 유지.
function normalizeObservations(fredJson)
// → [{ date:'YYYY-MM-DD', value:Number }]   (EDGE-001, NFR-003)

// FRED 실호출. 키는 인자로 주입(테스트 격리). fetch 사용.
async function fetchSeries(id, apiKey, { observationStart } = {})
// → { series_id:id, observations:[{date,value}] }
// FRED 4xx/5xx·네트워크 오류 → throw Error (키 미포함 메시지) (EDGE-004, EDGE-005)
module.exports = { normalizeObservations, fetchSeries };
```

### src/server.js
```js
function createApp({ apiKey, fetchSeriesFn } = {})
// → express app. fetchSeriesFn 주입 가능(IT/단위 격리), 기본은 fred.fetchSeries.
// 라우트:
//   GET /               → public/index.html (정적)
//   GET /api/series/:id → isAllowed(id) 아니면 400 {error}; 맞으면 fetchSeriesFn 호출
//                         성공 200 {series_id, observations}; 실패 502 {error} (키 미노출)
// apiKey 미주입 시 getApiKey()로 로드(없으면 throw → 기동 실패, NFR-002)
module.exports = { createApp };

// server.js가 직접 실행되면(require.main) createApp().listen(PORT)
```

### public/app.js (브라우저)
```js
// 페이지 로드시: CATEGORIES 각 카테고리 카드의 ids를 /api/series/:id로 병렬 fetch
// → Chart.js new Chart(canvas, { type:'line', data:{datasets:[...]} })
// fetch 실패/에러 응답 → 해당 카드에 .error 텍스트 표시, 다른 카드는 진행 (REQ-010)
// CATEGORIES 메타는 /api/meta 또는 인라인 정적 데이터로 제공 (서버가 /api/meta로 SERIES/CATEGORIES 노출)
```

### src/server.js 추가 라우트
```js
//   GET /api/meta → { categories: CATEGORIES, series: SERIES }  (프론트 렌더 메타, 키 무관)
```

## 4. Data Flow

```
1. GET /                → index.html + app.js + Chart.js(CDN) 로드
2. app.js → GET /api/meta → 카테고리/시리즈 구성 수신, 카드 DOM 생성
3. 각 카드 → GET /api/series/:id (병렬)
4. server → isAllowed? → fred.fetchSeries(id, apiKey) → FRED HTTPS (api_key 주입)
5. FRED JSON → normalizeObservations → {series_id, observations}
6. app.js → Chart.js line chart 렌더 / 실패 시 카드 에러 상태
```

## 5. Integration Points

- **FRED API** (`api.stlouisfed.org/fred/series/observations`): 실 HTTPS, `series_id`·`api_key`·`file_type=json`.
  IT/E2E에서 실호출 (Real E2E, no mock). 단위테스트에서만 fetch mock 허용(Level 0).
- **환경변수 `FRED_API_KEY`**: `.env`(dotenv) 또는 셸 env. config.js 단일 경유.
- **Chart.js**: CDN `<script>` (브라우저). 서버 무관.
- **테스트 주입 경계**: `createApp({fetchSeriesFn})` 로 IT에서 실 FRED 또는 제어된 함수 주입 가능.
  단, P6 IT는 실 FRED를 사용(최소 mock 원칙) — fetchSeriesFn 주입은 allowlist/에러경로 격리에만.

## 6. Security Notes (NFR-001)
- API 키는 `config.js`만 접근. 라우트/응답/정적자산 어디에도 키 미포함.
- allowlist(REQ-003)로 오픈 프록시·SSRF 차단 — `:id`를 그대로 FRED에 흘리지 않고 SERIES 키만 허용.
- 에러 메시지에 키·내부 URL 미포함.
