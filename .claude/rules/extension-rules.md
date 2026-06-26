# Extension Rules — 워크플로우 프레임워크 확장 규칙

`halo-workflow.md`·에이전트·훅 자체를 수정/확장할 때 지켜야 할 불변식.
이 repo는 "진화하는 프레임워크"이므로, 구조 변경 시 정합성이 깨지기 쉽다.

## 불변식 (절대 깨지 않는다)
- **RTM = Single Source of Truth** — 새로 추가하는 어떤 Phase도 RTM을 업데이트해야 한다. RTM에 흔적을 남기지 않는 단계는 추가하지 않는다.
- **LOOPBACK은 요구사항을 바꾸지 않는다** — 요구사항 변경은 항상 새 사이클. LOOPBACK 로직에 요구사항 재정의를 끼워넣지 않는다.
- **Main Agent First** — 서브 에이전트는 P8(리뷰 ×3)·JUDGE(×1)뿐. 새 서브 에이전트는 "메인 편향 제거" 또는 "병렬 이득"이 명확할 때만, 그 근거를 문서화하고 추가한다.
- **LOOPBACK 상한** — 총 5회 / phase당 2회. 초과 시 Partial Report → P9. 이 캡을 우회하는 경로를 만들지 않는다.

## 에이전트 호출 컨벤션
- 서브에이전트는 Claude Code 표준 위치 **`.claude/agents/`에 정식 정의**한다 (자동 발견). frontmatter에 `name`·`description`·`tools`(read-only: `Read, Grep, Glob`)를 두고, **본문이 곧 시스템 프롬프트**가 된다.
- 호출은 **자기 `subagent_type`으로** 한다 — `halo-judge`, `halo-code-reviewer`. 외부/빌트인 에이전트(`code-reviewer` 등)에 의존하지 않는다 → repo 자기완결·이식성 확보.
- 이름은 **`halo-` 프리픽스**로 네임스페이스 — 빌트인 `code-reviewer`와의 충돌을 피한다.
- **에이전트 정의를 `.claude/commands/`에 두지 말 것** — 하위 `.md`가 슬래시 커맨드로 자동 등록되어 stray 커맨드(`/agents:judge` 등)로 네임스페이스가 오염된다. 분리 유지: 에이전트=`.claude/agents/`, 커맨드=`.claude/commands/`.
- 에이전트를 추가/이름변경하면 참조처를 **모두** 갱신: 정의 파일 frontmatter `name`, `halo-workflow.md`(JUDGE·P8 섹션의 `subagent_type`), `CLAUDE.md`(Agent Definitions), `doc-drift-sync.md`(드리프트 점검 항목), 이 파일.

## Phase 추가/변경 시 동기화 대상
하나의 Phase를 추가/이름변경하면 아래를 **모두** 갱신해야 정합성이 유지된다:
1. `halo-workflow.md` — 실행 테이블(Main Direct / Sub-Agents) + 체크포인트 스키마 + LOOPBACK 라우팅
2. `CLAUDE.md` — Execution Model + RTM Flow
3. RTM 스키마 — 새 Phase가 기록할 컬럼/상태
4. `workflow-tests/` — 회귀 baseline (`/halo-eval`로 영향 확인)
5. JUDGE 근본 원인 분류 — 새 Phase가 LOOPBACK 대상이 될 수 있으면 매핑 추가

## 훅 작성 규칙
- 훅은 **대상 외 파일(src/·tests/ 밖)·도구 부재 시 반드시 exit 0** (무해 통과). 워크플로우를 막지 않는다.
- **lint 훅은 블로킹** — 실제 lint 오류 시 stderr + exit 2 (lint 오류는 단계 무관 항상 결함).
- **unit-test 훅은 non-blocking(report-only)** — 결과를 정보로만 전달하고 항상 exit 0. TDD상 중간 단계(P4 RED, P5 부분 GREEN)의 테스트 실패는 정상이므로 블로킹하면 워크플로우와 충돌한다.
- 특정 언어/러너를 하드코딩하지 않는다 — 자동 감지. (이 repo는 feature마다 스택이 다를 수 있다.)
