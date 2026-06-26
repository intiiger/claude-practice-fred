# Requirements: FRED Macroeconomic Dashboard

## Overview
FRED API를 사용해 5개 거시경제 카테고리를 카테고리별 대표 지표로 차트로 보여주는
웹 대시보드. FRED API는 CORS 미지원이므로 백엔드 프록시가 API 키를 서버에 보관한 채
FRED를 대신 호출한다. 프론트엔드는 프록시만 호출한다.

## Indicator → FRED Series Mapping (대표 지표)

| Category | 지표 | FRED series_id | Units |
|----------|------|----------------|-------|
| 금리 (Interest Rates) | 기준금리 (Federal Funds Rate) | `FEDFUNDS` | Percent |
| 금리 | 국채금리 (10-Year Treasury) | `DGS10` | Percent |
| 물가 (Prices) | 소비자물가 CPI | `CPIAUCSL` | Index 1982-84=100 |
| 고용 (Employment) | 실업률 (Unemployment Rate) | `UNRATE` | Percent |
| 성장 (Growth) | 실질 GDP | `GDPC1` | Bil. of Chained 2017 $ |
| 성장 | 산업생산 (Industrial Production) | `INDPRO` | Index 2017=100 |
| 시장 (Market) | 주가지수 (S&P 500) | `SP500` | Index |
| 시장 | 환율 (Broad USD Index) | `DTWEXBGS` | Index Jan 2006=100 |

총 8개 시리즈 / 5개 카테고리. 카테고리별로 1개 차트, 카테고리에 지표가 2개면 한 차트에
2개 선(line)으로 그린다.

## 1. Functional Requirements

| REQ-ID | Requirement | Priority | Acceptance Criteria |
|--------|-------------|----------|---------------------|
| REQ-001 | 백엔드가 `GET /api/series/:id` 프록시 엔드포인트를 제공하고 FRED observations를 정규화 JSON으로 반환한다 | P1 | 유효 series_id 요청 시 `{series_id, observations:[{date, value}]}` 형태 200 반환. value는 숫자(또는 결측은 제외). |
| REQ-002 | 서버가 FRED 호출 시 `FRED_API_KEY`를 서버측에서 주입한다 (클라이언트 자산·응답에 키 노출 금지) | P1 | 어떤 HTTP 응답·정적 자산에도 키 문자열이 포함되지 않는다. 네트워크 캡처로 확인 가능. |
| REQ-003 | series_id는 허용목록(allowlist)에 있는 8개만 프록시한다 (오픈 프록시/SSRF 방지) | P1 | 허용목록 밖 id → 400 구조화 에러. allowlist의 8개만 통과. |
| REQ-004 | 대시보드 페이지(`GET /`)가 5개 카테고리 카드(금리·물가·고용·성장·시장)를 렌더링한다 | P1 | 페이지에 5개 카테고리 섹션/카드가 존재. |
| REQ-005 | 금리 차트가 FEDFUNDS·DGS10 두 지표를 표시한다 | P1 | 금리 카드의 차트에 2개 데이터셋이 그려진다. |
| REQ-006 | 물가 차트가 CPIAUCSL을 표시한다 | P1 | 물가 카드 차트에 CPI 시계열이 그려진다. |
| REQ-007 | 고용 차트가 UNRATE를 표시한다 | P1 | 고용 카드 차트에 실업률 시계열이 그려진다. |
| REQ-008 | 성장 차트가 GDPC1·INDPRO 두 지표를 표시한다 | P1 | 성장 카드 차트에 2개 데이터셋이 그려진다. |
| REQ-009 | 시장 차트가 SP500·DTWEXBGS 두 지표를 표시한다 | P1 | 시장 카드 차트에 2개 데이터셋이 그려진다. |
| REQ-010 | FRED/네트워크 오류·결측을 카드 단위로 사용자에게 노출하고 대시보드는 중단되지 않는다 | P2 | 한 시리즈 실패 시 해당 카드에 에러 상태 표시, 나머지 카드는 정상. |

## 2. Non-Functional Requirements

| NFR-ID | Category | Requirement | Measurement |
|--------|----------|-------------|-------------|
| NFR-001 | Security | API 키는 환경변수(`FRED_API_KEY`, `.env`)에서만 로드, 클라이언트로 절대 전송 안 함 | 응답/번들 grep에 키 미존재 |
| NFR-002 | Robustness | `FRED_API_KEY` 미설정 시 서버가 명확한 메시지로 빠르게 실패(키 값 노출 없이) | 키 없이 기동 시 명시적 에러 |
| NFR-003 | Correctness | FRED 결측치 `"."` 는 정규화 단계에서 제외/처리 | 정규화 출력에 NaN/"." 없음 |
| NFR-004 | Performance | 단일 시리즈 프록시 응답이 FRED 왕복 + 정규화 수준 (불필요한 차단 없음) | 수동 관찰 |

## 3. Edge Cases

| EDGE-ID | Scenario | Expected Behavior | Related REQ |
|---------|----------|-------------------|-------------|
| EDGE-001 | FRED가 value `"."`(결측) 반환 | 정규화에서 해당 포인트 제외 | REQ-001, NFR-003 |
| EDGE-002 | 허용목록 밖 series_id 요청 | 400 구조화 에러, 프록시 안 함 | REQ-003 |
| EDGE-003 | `FRED_API_KEY` 환경변수 미설정 | 서버가 명확한 에러로 실패, 키 미노출 | NFR-001, NFR-002 |
| EDGE-004 | FRED API 다운/네트워크 오류 | 502 류 구조화 에러 반환, 프론트는 카드 에러 상태 | REQ-010 |
| EDGE-005 | FRED가 4xx(잘못된 series 등) 반환 | 상위로 구조화 에러 매핑, 키 미노출 | REQ-010 |

## 4. Constraints (Verified)

- **FRED API 도달성**: ✅ `https://api.stlouisfed.org/fred/series/observations` 실호출 확인.
  키 없이 호출 시 `400 — Variable api_key is not set` 반환 (엔드포인트·계약 확인됨).
- **CORS 미지원**: ✅ `Origin` 헤더 동반 응답에 `Access-Control-Allow-Origin` 부재 확인.
  → 브라우저 직접 호출 불가 → **백엔드 프록시 필수** (아키텍처의 핵심 제약).
- **런타임(Node.js)**: 초기 미설치 확인. winget MSI 설치는 비대화형 환경에서 권한 승격 대기로 hang(24분) → 중단.
  대안으로 **portable zip**(`node-v24.18.0-win-x64`)을 `C:\Users\User\nodejs-portable`에 설치. 실검증: `node -v`=v24.18.0, `npm -v`=11.16.0.
  (주의: 세션 셸이 캡처된 환경을 쓰므로 명령마다 `$env:PATH`에 node 디렉터리를 prepend해야 함.)

## 5. System Decisions (Greenfield — User Approved)

| 항목 | 결정 | 근거 |
|------|------|------|
| Language/Runtime | Node.js (LTS) | 사용자 선택 |
| Backend Framework | Express | FRED 프록시 + 정적 서빙, 사용자 선택 |
| API Key 제공 | `.env`의 `FRED_API_KEY` (gitignored) | 사용자 선택, 키 서버측 보관 |
| Frontend | Vanilla JS + Chart.js | 사용자 선택, 경량 |
| Unit/IT 테스트 | Jest + supertest | Node 표준 |
| E2E 테스트 | Playwright (실브라우저, no-mock) | Real E2E 원칙 |

## 6. Decisions (Auto-resolved)

- **대표 지표 선정**: 카테고리별 가장 표준적인 FRED 시리즈 선택 (위 매핑 표). 성장의 GDP는
  실질 GDP `GDPC1`(분기, 계절조정)을 사용 — 명목 `GDP`보다 추세 해석에 적합.
- **기간**: 기본적으로 FRED가 반환하는 전체 관측을 받아 차트가 자체 스케일. 별도 기간 파라미터는
  엔드포인트가 `observation_start` 옵셔널 쿼리로 지원하되 기본은 미지정(전체).
- **차트 형태**: 시계열 → line chart. 카테고리 2지표는 동일 차트 2 dataset.
- **데이터 갱신**: 페이지 로드시 fetch (실시간 polling 미요구사항이므로 제외).
