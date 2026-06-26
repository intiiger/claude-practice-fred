# RTM: FRED Macroeconomic Dashboard

## Metadata
- Created: 2026-06-26
- Last Updated: 2026-06-26
- Version: 1.0.0
- Status: ✅ Verified / PASS (JUDGE 확정) — 13/13 REQ PASS, 27/27 GREEN

## Traceability Matrix

| REQ-ID | Requirement | Priority | Unit TC | Integration TC | E2E TC | Impl Location | Result | Review | Status |
|--------|-------------|----------|---------|----------------|--------|---------------|--------|--------|--------|
| REQ-001 | 프록시 `GET /api/series/:id` 정규화 JSON 반환 | P1 | UT-FRED-1,2,3,4 | IT-API-3 | E2E-DASH-2 | `src/server.js` (route), `src/fred.js` (fetchSeries/normalize) | PASS | - | Verified (P7) |
| REQ-002 | FRED_API_KEY 서버측 주입, 클라이언트 미노출 | P1 | UT-FRED-4 | IT-API-3 | - | `src/fred.js` (api_key 주입), `src/server.js` (createApp apiKey), `src/config.js` | PASS | - | Verified (P7) |
| REQ-003 | series_id allowlist(8개) 프록시 제한 | P1 | UT-SER-1,2,3 | IT-API-1 | - | `src/series.js` (isAllowed/SERIES), `src/server.js` (route guard) | PASS | - | Verified (P7) |
| REQ-004 | 대시보드 `GET /` 5개 카테고리 카드 렌더 | P1 | UT-SER-4 | IT-API-2 | E2E-DASH-1 | `src/server.js` (static + /api/meta), `src/series.js` (CATEGORIES), `public/index.html`, `public/app.js` | PASS | - | Verified (P7) |
| REQ-005 | 금리 차트 FEDFUNDS·DGS10 | P1 | UT-SER-5 | - | E2E-DASH-2 | `src/series.js` (CATEGORIES[금리]), `public/app.js` | PASS | ✓ P8-1 해소 | Verified |
| REQ-006 | 물가 차트 CPIAUCSL | P1 | UT-SER-6 | - | E2E-DASH-2 | `src/series.js` (CATEGORIES[물가]), `public/app.js` | PASS | ✓ P8-1 해소 | Verified |
| REQ-007 | 고용 차트 UNRATE | P1 | UT-SER-7 | - | E2E-DASH-2 | `src/series.js` (CATEGORIES[고용]), `public/app.js` | PASS | ✓ P8-1 해소 | Verified |
| REQ-008 | 성장 차트 GDPC1·INDPRO | P1 | UT-SER-8 | - | E2E-DASH-2 | `src/series.js` (CATEGORIES[성장]), `public/app.js` | PASS | ✓ P8-1 해소 | Verified |
| REQ-009 | 시장 차트 SP500·DTWEXBGS | P1 | UT-SER-9 | - | E2E-DASH-2 | `src/series.js` (CATEGORIES[시장]), `public/app.js` | PASS | ✓ P8-1 해소 | Verified |
| REQ-010 | 오류/결측 카드 단위 노출, 대시보드 무중단 | P2 | UT-FRED-5,6 | IT-API-4 | E2E-DASH-3 | `src/server.js` (502 structured error), `src/fred.js` (throw), `public/app.js` (카드별 에러) | PASS | ✓ P8-2 해소 | Verified |
| NFR-001 | API 키 환경변수 전용·클라이언트 미전송 | P1 | UT-CFG-1,4 | IT-API-3 | - | `src/config.js` (getApiKey), `src/server.js` (서버측 보관) | PASS | - | Verified (P7) |
| NFR-002 | 키 미설정 시 명확한 fail-fast (키 미노출) | P1 | UT-CFG-2,3,4 | - | - | `src/config.js` (throw, 값 미노출), `src/server.js` (createApp 기동 시) | PASS | - | Verified (P7) |
| NFR-003 | FRED 결측 `"."` 정규화 제외 | P1 | UT-FRED-2 | - | - | `src/fred.js` (normalizeObservations 필터) | PASS | - | Verified (P7) |

## Coverage Summary
- Total requirements: 13 (REQ ×10 + NFR ×3 추적)
- TC mapped: 13 (100%) — Unit + IT/E2E TC (P6 완료)
- Implementation complete: 13 (100%) — src 4파일 + public 2파일
- Tests passing: 27/27 (100%) — Unit 20 + Integration 4 + E2E 3 (LOOPBACK#1 보강 후)
- E2E 품질게이트: PASS — 실서버(`node src/server.js`)·실 FRED·no-mock (Playwright webServer)
- LOOPBACK: 1회 (P6 ×1) — P8 MAJOR ×2 테스트 보강. 상한(총5/phase2) 이내.

## P8 Review Findings (×3 review, 80%+ confidence)
P7는 26/26 GREEN이었으나 리뷰어 2명이 독립적으로 **테스트 검증 공백(false-GREEN)** 을 지적 → JUDGE LOOPBACK#1(P6) → 테스트 보강으로 **MAJOR ×2 해소**.

- **P8-1 (MAJOR) — ✓ 해소**: ~~E2E-DASH-2가 `canvas` 존재만 확인(에러 카드도 통과)~~ → E2E-DASH-2를 카드 `data-state='loaded'` 강제 + `Chart.getChart(canvas)` 인스턴스 존재 + 카테고리별 dataset 개수 검증으로 교체. 이제 차트가 실제로 그려져야만 통과.
- **P8-2 (MAJOR) — ✓ 해소**: ~~REQ-010이 IT-API-1(=REQ-003)로 오매핑, 502/격리 경로 미실행~~ → IT-API-4 신규(`createApp({fetchSeriesFn})`로 FRED 실패 주입 → 502 structured + 정상 series 격리) + E2E-DASH-3을 DGS10 실패 주입으로 강화(금리 카드 error 격리·물가 loaded·5카드 무중단). RTM REQ-010 매핑을 IT-API-4로 교정.
- **minor (잔류, 비차단)**: observation_start 미배선(요구 §6/계약과 불일치) · `public/app.js` 라벨조회 DRY · `src/fred.js:61` `res.json()` try/catch 밖 · `public/index.html` CDN SRI 부재. → 차기 정리 항목. (보안 핵심 NFR-001/002·REQ-002/003은 직접 검증 결과 clean.)

근본원인은 **테스트 산출물(P6)** 이며 요구사항 변경 아님 — LOOPBACK 불변식 준수.

## TC ID Index
- `tests/unit/series.test.js` → UT-SER-1 allowlist 8개 true / UT-SER-2 allowlist 거부 / UT-SER-3 SERIES 8개 / UT-SER-4 CATEGORIES 5개 순서 / UT-SER-5~9 카테고리별 지표 매핑
- `tests/unit/config.test.js` → UT-CFG-1 키 반환 / UT-CFG-2 미설정 throw / UT-CFG-3 빈값 throw / UT-CFG-4 키 미노출
- `tests/unit/fred.test.js` → UT-FRED-1 정규화 / UT-FRED-2 결측 '.' 제외 / UT-FRED-3 빈 배열 / UT-FRED-4 키·id 주입 / UT-FRED-5 non-ok throw(키 미노출) / UT-FRED-6 네트워크 에러
- `tests/integration/api.test.js` → IT-API-1 allowlist 거부(400, no-FRED-call) / IT-API-2 /api/meta 5카테고리·8시리즈 / IT-API-3 실 FRED 200 정규화·키 미노출 (FRED_API_KEY 미설정 시 skip) / IT-API-4 FRED 실패 주입→502 structured error + 정상 series 격리(REQ-010)
- `tests/e2e/dashboard.spec.js` → E2E-DASH-1 5카드 순서 렌더 / E2E-DASH-2 카드 loaded 강제 + Chart 인스턴스·카테고리별 dataset 개수(금리/성장/시장=2, 물가/고용=1) 검증 / E2E-DASH-3 DGS10 실패 주입→금리 카드 error 격리·물가 loaded·5카드 무중단(REQ-010)

## Update History
| Date | Phase | Changes |
|------|-------|---------|
| 2026-06-26 | P1 | RTM 초기화 — REQ-001~010 + NFR-001~003 등록 (13개) |
| 2026-06-26 | P4 | Unit TC 매핑 (UT-SER/UT-CFG/UT-FRED) — RED 확인(3 suites fail, 모듈 미구현). Status → Unit TC Mapped |
| 2026-06-26 | P5 | 구현 완료 (src/config·fred·series·server.js + public/index.html·app.js). 유닛 20/20 GREEN. Impl Location 매핑, Status → Implemented |
| 2026-06-26 | P6 | 통합(tests/integration/api.test.js) + E2E(tests/e2e/dashboard.spec.js, no-mock) 작성. IT-API-1~3 / E2E-DASH-1~3 RTM 매핑. Status → IT/E2E TC Mapped |
| 2026-06-26 | P7 | 전 피라미드 실행 — Unit 20 + IT 3(실 FRED) + E2E 3(실브라우저·실서버·no-mock) = 26/26 PASS. E2E 품질게이트 통과. 모든 REQ Result → PASS, Status → Verified |
| 2026-06-26 | P8 | 리뷰 ×3(품질/버그/보안). MAJOR ×2(P8-1 REQ-005~009 차트렌더 false-GREEN / P8-2 REQ-010 에러경로 미검증·오매핑) + minor ×4. Review 컬럼 반영. → JUDGE |
| 2026-06-26 | JUDGE | verdict=LOOPBACK, target=P6, root cause=Test Design. 요구사항 변경 아님 확인. LOOPBACK 1/5, P6 1/2. |
| 2026-06-26 | P6′ (LOOPBACK#1) | 테스트 보강: E2E-DASH-2(loaded 강제+Chart dataset 개수) · IT-API-4 신규(502+격리) · E2E-DASH-3(실패 주입 격리). REQ-010 매핑 IT-API-1→IT-API-4 교정. |
| 2026-06-26 | P7′ | 재실행 — Unit 20 + IT 4 + E2E 3 = 27/27 PASS. MAJOR ×2 해소. minor ×4 잔류(비차단). |
| 2026-06-26 | JUDGE′ | verdict=PASS. MAJOR ×2 해소 확인, minor 비차단. → P9. |
| 2026-06-26 | P9 | 최종 리포트(`docs/reports/fred-dashboard-final.md`). Status → ✅ Verified/PASS. minor ×4 백로그 등재. |
