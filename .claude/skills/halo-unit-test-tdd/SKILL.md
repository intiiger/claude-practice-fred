---
name: halo-unit-test-tdd
description: HALO P4 단위테스트 TDD RED. 인터페이스 계약 기반으로 격리된 단위테스트를 먼저 작성하고 FAIL(RED) 확인 + RTM에 Unit TC 매핑. Mock 허용(Level 0). /halo-workflow의 P4로도, 단독으로도 호출 가능.
---

# HALO — Unit Test / TDD RED (P4)

구현 전에 실패하는 단위테스트를 작성한다(RED). 산출물: `tests/unit/[feature].*`.

> **호출 맥락**
> - `/halo-workflow` 안: 테스트 작성 + RTM Unit TC 매핑 + RED 확인 + P4.md 체크포인트.
> - **단독 호출**: 인터페이스/요구를 받아 단위테스트 작성 + RED 확인까지. RTM 매핑은 RTM이 있을 때만.

## 전제 — Test Level 0 (Unit)
```
Mock/Stub 허용 (외부 의존성 격리). 빠르고 결정적인 단위 검증.
```

## 1. 단위테스트 작성
```
1. 격리: 외부 의존성은 Mock/Stub
2. AAA: Arrange → Act → Assert
3. @requirement 주석으로 REQ-ID 매핑
4. 설계의 인터페이스 계약에 정의된 함수만 테스트
```
> 계약에 없는 함수를 테스트하지 않는다 — 테스트가 곧 계약의 실행 명세다.

## 2. RTM 업데이트 (RTM 존재 시)
```
각 REQ에 Unit TC-ID 기록. Update History에 항목 추가. Status → Unit TC Mapped.
```

## 3. RED 확인 (필수)
```
모든 Unit Test 실행 → FAIL 확인 (아직 구현 없음).
PASS가 나오면 테스트가 잘못된 것 — 구현 없이 통과하는 테스트는 무효.
```

## 완료 체크
```
□ Unit TC-ID 매핑 (RTM 존재 시)
□ RED 확인
□ (워크플로우 내) P4.md 체크포인트
```
