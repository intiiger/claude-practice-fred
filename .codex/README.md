# HALO — Codex 설정

이 repo를 **Codex CLI**에서 HALO 워크플로우로 쓰기 위한 설정. **전부 프로젝트 로컬**에서 로드된다 (사용자 홈 미사용).

## 무엇이 어디서 자동 로드되나
| 요소 | 위치 | 로드 |
|---|---|---|
| 룰 | 루트 `AGENTS.md` (+ 폴더별 `AGENTS.md`) | Codex 자동 (디렉토리당 1개) |
| 스킬 | `.codex/skills/<name>/SKILL.md` | Codex 자동 발견(description 기반 온디맨드) |
| 프로젝트 설정·훅 | `.codex/config.toml` | 프로젝트 신뢰(trust) 시 자동 |

> **커스텀 프롬프트(`~/.codex/prompts/`, `/prompts:`)는 안 쓴다.** Codex가 deprecated 처리 + skills 권고하고, 프로젝트 로컬에서 안 읽혀 홈에 설치해야 하므로. → 워크플로우·eval·doc-drift를 **스킬**로 제공한다 (전부 로컬).

## 사용 (스킬)
`.codex/skills/`에 다음이 있고 Codex가 자동 발견한다:
- `halo-workflow` — RTM 중심 TDD 9-Phase 실행
- `halo-eval` — fixture 회귀 테스트
- `doc-drift-sync` — 문서 드리프트 점검
- `halo-requirements-analysis`·`halo-dld-design`·`halo-unit-test-tdd`·`halo-integration-test`·`halo-regression-test` — Phase 방법론

호출: 관련 요청 시 자동 로드되거나, `$halo-workflow <기능>` 처럼 명시 호출.

## 설정·훅 메모
- `config.toml`은 프로젝트 레이어를 **신뢰(trust)**해야 로드. 워크플로우가 파일생성·테스트실행을 하므로 `sandbox_mode="workspace-write"` 권장(주석 해제).
- 검증 훅(`hooks/halo_post_edit.py`)은 **report-only**, payload 비의존(git 변경분 기반). 너무 잦으면 `PostToolUse`→`Stop`, Windows면 config의 `python3`→`python`.

## 서브에이전트 차이 (중요)
Codex엔 1급 서브에이전트가 없다. HALO의 **P8 3관점 리뷰 + JUDGE**는 메인이 **순차로 직접 수행**한다(`halo-workflow` 스킬에 내장). 메인 편향 제거를 위해 "리뷰 → 판별" 역할을 의식적으로 분리한다.
