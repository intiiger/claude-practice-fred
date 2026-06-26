---
name: halo-regression-test
description: HALO P7 테스트 실행. Unit→Integration→E2E→Smoke 순으로 전체 피라미드를 실행하고, E2E 품질 게이트(실서버·no-mock) 검사 후 RTM에 PASS/FAIL 기록. ANY FAIL 시 LOOPBACK 트리거. /halo-workflow의 P7로도, 단독으로도 호출 가능.
---

# HALO — Test Execution / Regression (P7)

전체 테스트 피라미드를 실행하고 결과를 RTM에 기록한다. 회귀(regression) 시 동일 순서로 재실행해 깨짐을 잡는다.

> **호출 맥락**
> - `/halo-workflow` 안: 실행 + RTM Result 기록 + P7.md 체크포인트 + 분기(ALL PASS→P8 / ANY FAIL→JUDGE).
> - **단독 호출**: 피라미드 실행 + 품질 게이트 검사 + 결과 리포트까지. RTM/JUDGE 단계는 워크플로우 내에서만.

## 1. 실행 순서
```
Step 1: UNIT → Step 2: INTEGRATION → Step 3: E2E → Step 4: SMOKE
(Smoke: 서버 기동 + 핵심 기능 동작 확인)
```

## 2. E2E 품질 검증 게이트 (PASS/FAIL과 무관하게 항상)
```
□ E2E 코드에 mock/stub/spy 없음?
□ 실제 서버가 기동되었나?
□ 실제 엔드포인트로 요청을 보냈나?
미충족 시 → 해당 REQ를 RTM에 FAIL로 기록 (테스트가 초록이어도 무효)
```

## 3. RTM 결과 기록 (RTM 존재 시)
```
각 REQ의 Result 컬럼에 PASS/FAIL 기록. Update History에 항목 추가.
```

## 4. 분기 (워크플로우 내)
```
ALL PASS → P8 (코드 리뷰)로 진행
ANY FAIL → RTM에 FAIL 기록 후 즉시 JUDGE 호출 (P8 스킵)
```
> 단독 호출 시에는 분기 대신 결과 요약 리포트를 반환한다.

## 완료 체크
```
□ Unit/IT/E2E/Smoke 실행
□ E2E 품질 게이트 통과
□ 결과 기록 (RTM 존재 시) — FAIL이어도 체크포인트 작성 후 진행
```
