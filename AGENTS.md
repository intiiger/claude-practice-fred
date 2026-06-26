# HALO Workflow — Agent Rules (Codex)

> 이 파일은 **Codex가 자동으로 읽는** 프로젝트 룰이다 (루트 + 디렉토리별 `AGENTS.md`).
> HALO = Harness-Agentic Loopback Orchestration. TDD + RTM 중심 9-Phase 워크플로우.

## Core Principles
- **RTM = Single Source of Truth** — 매 Phase가 RTM 업데이트. 판별은 RTM만 읽고 한다.
- **Main Agent First** — P1~P7 메인 연속 실행. 서브는 P8(리뷰)·JUDGE(판별)에만.
- **File = Interface** — Phase 간 통신·컨텍스트 복구는 파일로만. 인메모리/암묵 의존 금지.
- **Constraint Verification** — 외부 의존성은 실제 호출로 검증.
- **Real E2E** — E2E는 실제 환경. Mock 금지.
- **LOOPBACK never changes requirements** — 요구사항 변경 = 새 사이클.
- **Max 5 LOOPBACK, per-phase 2** — 초과 시 Partial Report → P9.

## Execution Model (9 Phases)
- **Main 직접**: P1 요구분석 → P2 탐색(Greenfield면 스킵) → P3 설계 → P4 단위테스트(TDD RED) → P5 구현(TDD GREEN) → P6 통합/E2E → P7 실행 → P9 완료보고
- **서브**: P8 코드리뷰(3관점 병렬) + JUDGE(RTM 기반 LOOPBACK 판별)
- **서브에이전트 미지원 도구(Codex 등)**: 메인이 P8 3관점 리뷰와 JUDGE 판별을 **순차로 직접 수행**. 메인 편향 제거를 위해 "리뷰 → 판별" 단계를 의식적으로 분리하되 같은 세션에서 실행한다.

## RTM = Single Source of Truth
컬럼: `REQ-ID | Requirement | Priority | Unit TC | Integration TC | E2E TC | Impl Location | Result | Review | Status`
- `Result`: P7 기록 (PASS/FAIL/-)
- `Review`: P8 기록 (PASS/MINOR/MAJOR/CRITICAL/-)
- `Status`: Registered → Unit TC Mapped → Implemented → All TC Mapped → Verified → Complete
- Flow: P1(REQ등록) → P4(Unit TC) → P5(구현위치) → P6(IT/E2E TC) → P7(결과) → P8(리뷰) → JUDGE(판별)

판별 기준: 모든 REQ Result=PASS & Review가 PASS/MINOR → PASS. Result=FAIL 또는 Review MAJOR/CRITICAL 하나라도 → LOOPBACK.
LOOPBACK 근본원인 분류: Test Bug→P4 / Impl Bug→P5 / Test Design→P6 / Arch Issue→P3.

## Test Levels
- L0 Unit: mock 허용, P4 작성·P5 실행(TDD)
- L1 Integration: 최소 mock, P6 작성·P7 실행
- L2 E2E: **mock 없음**·실제 환경, P6 작성·P7 실행
- L3 Smoke: 서버 기동 + 핵심 기능 확인, P7

## 코딩 표준 (P5 구현 / P8 리뷰가 검사)
- **TDD**: RED 먼저(실패 테스트 없이 구현 금지), 테스트 통과 최소 구현, 모든 코드는 REQ-ID로 추적.
- **File=Interface**: 출력 파일은 다른 Phase가 다시 읽을 것을 전제로 자기완결적.
- **검증 진실성**: 외부 의존성 실제 호출, E2E mock 금지, "통과한 척" 금지 — 실패는 실패로 드러낸다.
- **품질**: 명확한 네이밍 > 주석, 예외/에러 경로 무시 금지(빈 catch 금지), 결정적 동작 우선, DRY(3회 반복 전 추출, 성급한 추상화 경계).
- **일관성**: 새 코드는 주변 코드처럼(네이밍·구조·에러처리·주석밀도).

## 확장 불변식
- 새로 추가하는 어떤 Phase도 RTM을 업데이트한다(흔적 없는 단계 금지).
- LOOPBACK에 요구사항 재정의를 끼워넣지 않는다. LOOPBACK 상한을 우회하는 경로를 만들지 않는다.
- **지식 배치 규칙**: 전역 불변식 → 이 파일(AGENTS.md). 폴더/모듈 한정 룰 → 그 폴더의 `AGENTS.md`. 상황 조건부 절차·방법론 → Skill(온디맨드).

## Codex 자원 위치
- 스킬 `.codex/skills/` — 워크플로우(`halo-workflow`)·평가(`halo-eval`)·문서점검(`doc-drift-sync`) + Phase 방법론 5개. 관련 시 자동 로드 또는 `$<skill> <인자>`로 호출.
- 훅 `.codex/config.toml`의 `[[hooks.PostToolUse]]` (report-only)
- 폴더/모듈 한정 룰은 해당 폴더에 `AGENTS.md`를 두면 그 폴더 작업 시 자동 로드된다.
- 커스텀 프롬프트(`~/.codex/prompts/`)는 deprecated라 미사용 — skills로 대체.
