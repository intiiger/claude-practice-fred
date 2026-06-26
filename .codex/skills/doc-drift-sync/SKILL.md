---
name: doc-drift-sync
description: 문서(README·AGENTS.md·.codex/README·docs/) ↔ 코드/RTM 드리프트 점검·동기화. 보고 우선. 인자 fix면 HIGH 항목 수정까지.
---

# Doc Drift Sync (Codex)

문서가 실제 repo 상태와 어긋났는지 검사하고 **보고 우선(report-first)**으로 동기화한다. 인자가 `fix`면 확인 후 HIGH 항목 수정까지.

## 원칙
- **RTM = 기준**. 문서가 RTM/코드와 다르면 문서가 틀린 것. 요구사항은 바꾸지 않는다. 파괴적 수정 금지(드리프트 표 먼저, 확인 후 수정).

## 절차
1. 실제 상태: `.codex/`·`.codex/skills/`·`AGENTS.md` 구조, `docs/requirements/*-rtm.md`(REQ·Phase·Status), `src/`·`tests/`.
2. 문서 주장: `AGENTS.md`, README, `.codex/README.md`, docs/.
3. 대조: 문서의 명령/경로/Phase 수 ↔ 실제 파일, RTM REQ ↔ 구현/테스트 존재.
4. 보고(수정 전):
   ```markdown
   # Doc Drift Report — [date]
   | # | 문서:위치 | 문서 주장 | 실제 | 심각도 | 제안 |
   ## Summary: 불일치 N (HIGH/MED/LOW)
   ```
5. 수정 정책: HIGH(틀린 경로·없는 명령·틀린 Phase 수)는 확인 후 문서 수정. LOW는 보고만. 코드/RTM을 문서에 맞추지 않는다.
