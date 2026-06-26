---
name: halo-eval
description: fixture 기반 HALO 워크플로우 회귀 테스트. 워크플로우 프롬프트/룰 개선 시 같은 입력의 품질 변화를 숫자로 비교. 인자로 fixture명 또는 list/compare/clean.
---

# HALO Eval (Codex)

HALO 워크플로우 자체를 회귀 테스트하는 오케스트레이터다. 사용자가 준 인자(fixture명 또는 `list`/`compare <fixture>`/`clean`)로 동작한다.

평가 스크립트는 도구 중립(파이썬)이라 그대로 재사용: `workflow-tests/scripts/`. 규약은 `workflow-tests/README.md`.

## 인자별 동작
- (빈값 | `list`) → `workflow-tests/fixtures/*/oracle.json` 훑어 fixture 목록+description+baseline 유무 표.
- `compare <fixture>` → `python workflow-tests/scripts/compare.py <fixture>` 출력 그대로.
- `clean` → 5개 산출물 디렉토리(docs/src/tests/reports/.workflow)의 `.gitkeep` 외 파일을 확인 후 정리.
- `<fixture> [--baseline]` → **[RUN]**.

## [RUN]
1. 사전 점검: `fixtures/<fixture>/{request.txt,oracle.json}` 존재. 워크스페이스 클린(5개 디렉토리에 `.gitkeep` 외 파일 없을 것; 있으면 중단+clean 안내). `request.txt` 읽기.
2. Brownfield: `oracle.json.greenfield==false` & `fixture/baseline/` 있으면 `cp -r fixtures/<fixture>/baseline/. .`.
3. 워크플로우 실행: `halo-workflow` 스킬의 프로토콜(P1~P9, **P8 3리뷰+JUDGE를 메인이 순차**)을 `request.txt`를 기능요청으로 삼아 수행. 모든 규칙 엄수. Greenfield 스택 질문은 사용자에게.
4. 평가: 완주(P9.md, state.current_phase=P9) 확인 후
   - 기본 `python workflow-tests/scripts/evaluate.py <fixture>`
   - `--baseline`이면 `... evaluate.py <fixture> --save-baseline`
5. 요약: Oracle 통과수 / LOOPBACK / RTM(REQ·PASS·TC·Impl) / P8 리뷰(C·M·Mn) / Functional / Archive 경로. FAIL은 항목 나열.
6. 다음 제안: 전체 PASS+baseline 없음→`--baseline` / baseline 있음→`compare` / FAIL→AGENTS.md·스킬 조정.

## 주의
- 비결정성 — baseline 확정 전 2~3회. evaluate(산출물 이동) 전 다른 fixture 연속 실행 금지.
