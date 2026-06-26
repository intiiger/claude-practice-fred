---
name: halo-integration-test
description: HALO P6 통합 + E2E 테스트. 최소 mock 통합 테스트와 프로젝트 타입별 실환경 E2E(mock 금지)를 작성하고 RTM에 IT/E2E TC 매핑. /halo-workflow의 P6으로도, 단독으로도 호출 가능.
---

# HALO — Integration & E2E Test (P6)

모듈 상호작용(통합)과 실환경 시나리오(E2E)를 검증한다. 산출물: `tests/integration/*`, `tests/e2e/*`.

> **호출 맥락**
> - `/halo-workflow` 안: IT+E2E 작성 + RTM IT/E2E TC 매핑 + P6.md 체크포인트.
> - **단독 호출**: 구현/요구를 받아 IT+E2E 작성까지. RTM 매핑은 RTM이 있을 때만.

## 전제 — Test Levels
```
Level 1: INTEGRATION → 최소 mock, 실제 모듈 상호작용
Level 2: E2E         → mock 없음, 실제 환경
```

## 1. 통합 테스트
```
최소 mock. 실제 모듈 상호작용 검증. @requirement 주석.
```

## 2. E2E 전략 결정 (프로젝트 타입별)
```
Web frontend → 브라우저 자동화 + 서버 기동
Web API      → HTTP 클라이언트 + 실제 서버
CLI          → 서브프로세스 실행 + stdout 검증
Library      → 통합 테스트로 충분 (E2E 비해당)
```

## 3. E2E 환경 구성 + 작성
```
필수: 실제 환경(mock 없음). Given-When-Then. @requirement 주석.
금지: fetch/HTTP mock, DOM mock, "E2E인 척하는" 단위테스트.
```
> E2E에서 mock을 쓰는 순간 그것은 E2E가 아니다. 실제 서버·실제 엔드포인트·실제 의존성으로 검증한다.

## 4. RTM 업데이트 (RTM 존재 시)
```
각 REQ에 Integration/E2E TC-ID 기록. Update History에 항목 추가. Status → All TC Mapped.
```

## 완료 체크
```
□ IT/E2E TC-ID 매핑 (RTM 존재 시)
□ E2E가 실환경 기준 충족 (mock 없음)
□ (워크플로우 내) P6.md 체크포인트
```
