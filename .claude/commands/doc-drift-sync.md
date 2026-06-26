# /doc-drift-sync — 문서 ↔ 코드/RTM 드리프트 점검·동기화

문서(README.md, CLAUDE.md, docs/)가 실제 repo 상태와 어긋났는지 검사하고,
**보고 우선(report-first)**으로 동기화한다. RTM이 SSOT이므로 충돌 시 RTM·코드를 기준으로 본다.

## 원칙
- **RTM = 기준**. 문서가 RTM/코드와 다르면 문서가 틀린 것으로 간주한다.
- **요구사항은 바꾸지 않는다** — 문서 동기화는 서술을 맞추는 작업이지 요구사항 재정의가 아니다.
- **파괴적 수정 금지** — 먼저 드리프트 표를 보여주고, 수정은 사용자 확인 후.

## 점검 절차

```
STEP 1 — 실제 상태 수집
  - .claude/ 구조 (commands/, agents/, hooks/, rules/, settings.json)
  - docs/requirements/*-rtm.md (있으면) → REQ-ID·Phase·Status
  - src/ · tests/ 실제 구성

STEP 2 — 문서 주장 수집
  - README.md: 사용법·구조·Phase 설명
  - CLAUDE.md: Usage / Execution Model / RTM Flow / Agent Definitions 경로
  - docs/architecture, docs/requirements

STEP 3 — 대조하여 드리프트 식별
  - 문서에 적힌 명령/경로/Phase 수 ↔ 실제 파일
  - CLAUDE.md/halo-workflow.md의 subagent_type ↔ 실제 .claude/agents/ 정의(frontmatter name)
  - README의 Phase/원칙 설명 ↔ halo-workflow.md 실제 동작
  - RTM의 REQ ↔ src/tests 구현·테스트 존재 여부

STEP 4 — 드리프트 보고 (수정 전)
```

## 드리프트 보고 형식

```markdown
# Doc Drift Report — [date]

| # | 문서:위치 | 문서 주장 | 실제 상태 | 심각도 | 제안 |
|---|----------|----------|----------|--------|------|

## Summary
- 불일치: N건 (HIGH n / MED n / LOW n)
- 자동 수정 가능: N건
```

## 수정 정책
- HIGH(잘못된 경로·존재하지 않는 명령·틀린 Phase 수)는 사용자 확인 후 문서 측을 수정.
- LOW(표현 차이)는 표로만 보고하고 강제하지 않는다.
- 코드/RTM을 문서에 맞추는 방향의 수정은 **하지 않는다** (문서가 따라간다).

## 사용
```
/doc-drift-sync            # 점검 + 보고만
/doc-drift-sync fix        # 보고 후, 확인받아 HIGH 항목 문서 수정
```
