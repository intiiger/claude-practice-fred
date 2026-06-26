# HALO Workflow Project

## Usage
```
/halo-workflow [feature description]       # 워크플로우 실행
/halo-eval [list | <fixture> | compare <fixture> | clean]   # 회귀 테스트 (워크플로우 자체 품질 측정)
```

`/halo-eval` 은 fixture 기반 회귀 테스트 오케스트레이터. 워크플로우 프롬프트 개선 시
"같은 입력에 대한 품질 변화"를 숫자로 비교한다. 자세한 건 `workflow-tests/README.md`.

## Core Principles
- **RTM = Single Source of Truth** — 매 Phase가 RTM 업데이트. JUDGE는 RTM만 읽고 판별.
- **Main Agent First** — P1~P7 메인 연속 실행. 서브는 P8(리뷰)과 JUDGE(판별)에만.
- **File = Interface** — 에이전트 간 통신과 context 복구는 파일로만.
- **Constraint Verification** — 외부 의존성은 실제 호출로 검증.
- **Real E2E** — E2E는 실제 환경. Mock 금지.
- **LOOPBACK never changes requirements** — 요구사항 변경 = 새 사이클.
- **Max 5 LOOPBACK, per-phase 2 max** — 초과 시 Partial Report → P9.

## Execution Model
- **Main direct** (8 Phases): P1→P2→P3→P4→P5→P6→P7→P9 — 컨텍스트 단절 0
- **Sub-agents** (2 points): P8 review (×3), JUDGE (×1 — RTM만 읽고 판별)

## RTM Flow
P1(REQ등록) → P4(Unit TC매핑) → P5(구현위치매핑) → P6(IT/E2E TC매핑) → P7(결과기록) → P8(리뷰반영) → JUDGE(RTM읽고 판별)

## Agent Definitions
정식 서브에이전트로 `.claude/agents/`에 정의 (Claude Code 표준 위치, frontmatter + read-only 툴). repo 자기완결 — 외부/빌트인 에이전트에 의존하지 않는다:
- `halo-code-reviewer.md` — P8 review (subagent_type: `halo-code-reviewer`, ×3 parallel, read-only)
- `halo-judge.md` — JUDGE (subagent_type: `halo-judge`, ×1, RTM-only evaluation, read-only)

## Standalone Phase Skills
Phase 방법론을 단독 호출 가능한 스킬로 추출 (`.claude/skills/`). `halo-workflow.md`는 그대로 — 전체 워크플로우 외에 **개별 Phase만 필요할 때** 직접 호출:
- `halo-requirements-analysis` (P1) · `halo-dld-design` (P3) · `halo-unit-test-tdd` (P4) · `halo-integration-test` (P6) · `halo-regression-test` (P7)
- 각 스킬은 자기완결적. RTM/체크포인트 단계는 워크플로우 내 호출 시에만 수행.

## Rules
코드 표준·확장 규칙은 `.claude/rules/`에 분리:
- `design-principles.md` — P5 구현/P8 리뷰가 따르는 코딩 표준 (Core Principles의 코드 레벨 구체화)
- `extension-rules.md` — 워크플로우 프레임워크 자체를 수정/확장할 때의 불변식

## Harness Hooks
`PostToolUse(Edit|Write|MultiEdit)` 훅이 생성 코드(`src/`·`tests/`)에서 검증을 강제 (`.claude/hooks/`):
- `post-edit-lint.sh` — linter 자동 감지 후 lint (오류 시 블로킹; 도구·대상 외 파일이면 무해 통과)
- `post-edit-unit-test.sh` — 편집 파일과 매칭되는 unit test 실행, 결과를 **정보로만 전달(non-blocking)** — TDD 중간 단계(P4 RED, P5 부분 GREEN)의 실패는 정상이므로 블로킹하지 않음
