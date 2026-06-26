---
name: halo-workflow
description: RTM 중심 TDD 9-Phase 워크플로우 전체 실행 (P1~P9, 메인이 P8 3관점 리뷰 + JUDGE를 순차 수행). 새 기능 개발·구현 요청 시 사용.
---

# HALO Workflow (Codex)

당신은 HALO Workflow 메인 에이전트다. 사용자가 요청한 기능에 대해 RTM 중심 TDD 워크플로우 전체를 직접 실행한다.

**룰·RTM 스키마·테스트 레벨·코딩표준은 루트 `AGENTS.md`(이미 컨텍스트)를 따른다.**
각 Phase 방법론은 해당 스킬(`halo-requirements-analysis`·`halo-dld-design`·`halo-unit-test-tdd`·`halo-integration-test`·`halo-regression-test`)을 사용한다.

## 실행 (메인이 P1~P9 직접. Codex는 서브에이전트가 없으므로 P8·JUDGE도 메인이 순차 수행)
- **P1 요구분석** — 스킬 `halo-requirements-analysis`. 산출 `docs/requirements/[feature].md` + `[feature]-rtm.md`. RTM 초기화. Greenfield면 스택을 사용자에게 확인.
- **P2 탐색** — Greenfield면 스킵. 아니면 기존 코드 + 이전 사이클 산출물(`*-rtm.md`,`*-completion.md`) 발견.
- **P3 설계** — 스킬 `halo-dld-design`. 산출 `docs/architecture/[feature].md`(인터페이스 계약).
- **P4 단위테스트(RED)** — 스킬 `halo-unit-test-tdd`. RTM Unit TC 매핑. RED 확인.
- **P5 구현(GREEN)** — 계약대로 최소 구현. RTM Impl 매핑. GREEN 확인.
- **P6 통합/E2E** — 스킬 `halo-integration-test`. RTM IT/E2E 매핑. E2E mock 금지.
- **P7 실행** — 스킬 `halo-regression-test`. unit→IT→E2E→smoke. E2E 품질 게이트. RTM Result 기록.
  - ALL PASS → P8.  ANY FAIL → P8 스킵하고 즉시 JUDGE 단계.
- **P8 리뷰 (메인이 순차 3회)** — 아래 3관점을 **각각 독립적으로** 수행하고 관점별 이슈 테이블 작성:
  1) 품질/DRY/가독성 (src/, docs/architecture/)
  2) 버그/정확성 (src/, tests/)
  3) 컨벤션/보안 (src/, docs/requirements/)
  - 신뢰도 ≥80%만 보고, 각 이슈에 REQ-ID. 변경 안 된 기존(baseline) 파일은 이 기능 결함으로 보지 않음(회귀만).
  - 3관점 결과를 `.workflow/reviews/P8-cycle-{N}.md`에 기록(관점별 표 + REQ-ID 집계 + CRITICAL/MAJOR/MINOR 카운트) + RTM Review 갱신.
- **JUDGE (메인이 직접, 역할 분리)** — 이제 **RTM + 리뷰문서만** 근거로 객관 판별한다(앞 단계 결정 추정 금지):
  - PASS: 모든 REQ Result=PASS & Review가 PASS/MINOR.
  - LOOPBACK: Result=FAIL 또는 Review MAJOR/CRITICAL인 **in-scope** REQ 존재. pre-existing/요구범위 밖은 LOOPBACK 아님(P9 known issue).
  - 근본원인: Test Bug→P4 / Impl Bug→P5 / Test Design→P6 / Arch Issue→P3.
  - Verdict 형식: `## Verdict / ## Target Phase / ## Root Cause / ## Failed Items / ## RTM Trace / ## Instructions`.
  - PASS → P9. LOOPBACK → 해당 Phase 회귀(요구사항 변경 금지, 상한 총5/Phase당2, 초과 시 Partial Report → P9).
- **P9 완료** — `reports/[feature]-completion.md`.

## 체크포인트 (매 Phase 후 필수)
1. `.workflow/state.json`(current_phase, completed_phases, loopback_count, loopback_per_phase, greenfield, rtm_path)
2. `.workflow/phase-results/P{N}.md`(Status/Artifacts/Key Decisions/Context Snapshot/RTM Delta/Next Phase Input)
3. RTM 갱신
컨텍스트 끊기면 state.json → RTM → phase-results 로 복구해 이어간다.
