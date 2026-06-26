---
name: halo-requirements-analysis
description: HALO P1 요구사항 분석. 코드베이스 컨텍스트 수집·Greenfield 감지·요구사항 도출·제약 실검증(실제 호출)·요구사항 문서 작성·RTM 초기화. /halo-workflow의 P1으로도, 단독으로도 호출 가능.
---

# HALO — Requirements Analysis (P1)

RTM 중심 요구사항 분석. 산출물: `docs/requirements/[feature].md`, `docs/requirements/[feature]-rtm.md`.

> **호출 맥락**
> - `/halo-workflow` 안: 아래를 그대로 수행하고 `.workflow/state.json`·체크포인트까지 기록.
> - **단독 호출**: 요구사항 문서 + RTM 초기화까지만. state/checkpoint는 생략 가능.

## 1. 컨텍스트 수집 + Greenfield 감지
```
1. 프로젝트 구조 분석 (Glob, Grep)
2. 기존 코드 패턴·기술 스택·의존성 파악
3. 관련 모듈/파일 식별

Greenfield 판정: src/에 코드가 없거나 빌드/의존성 설정 파일이 없으면 → Greenfield
```

## 2. System Decisions (Greenfield 한정 — 사용자 확인)
기존 코드가 감지되면 자동 스킵. Greenfield일 때만 사용자에게 확인:
```
1. 언어/런타임  2. 프레임워크  3. 배포 환경  4. 외부 의존성  5. 기타 제약
승인 후 → 요구사항 문서 "System Decisions" 섹션에 기록.
이후 워크플로우는 추가 게이트 없이 자율 진행.
```

## 3. 요구사항 도출
```
도출 대상: 핵심 기능, 엣지 케이스, NFR(성능/보안), 제약
```

## 4. 모호성 처리
Greenfield 기술 결정만 사용자 확인. 그 외 모호성은 자동 해소하고 문서에 근거를 남긴다.

## 5. 제약 검증 (Constraint Verification)
```
외부 API     → 실제 호출로 검증
배포 환경     → 런타임 제약 확인
런타임 호환성  → 라이브러리 지원 검증
결과를 요구사항 문서 "Verified Constraints" 섹션에 기록
```
> 추정 금지 — 외부 의존성은 실제 호출로 검증한다(가정만으로 PASS 처리하지 않음).

## 6. 요구사항 문서 스키마
```markdown
# Requirements: [Feature Name]
## 1. Functional Requirements
| REQ-ID | Requirement | Priority | Acceptance Criteria |
## 2. Non-Functional Requirements
| NFR-ID | Category | Requirement | Measurement |
## 3. Edge Cases
| EDGE-ID | Scenario | Expected Behavior | Related REQ |
## 4. Constraints (Verified)
## 5. System Decisions (Greenfield — User Approved)
## 6. Decisions (Auto-resolved)
```

## 7. RTM 초기화 (Single Source of Truth)
```markdown
# RTM: [Feature Name]
## Metadata
- Created / Last Updated / Version / Status: Initialized
## Traceability Matrix
| REQ-ID | Requirement | Priority | Unit TC | Integration TC | E2E TC | Impl Location | Result | Review | Status |
| REQ-001 | ... | P1 | - | - | - | - | - | - | Registered |
## Coverage Summary / Update History
```
모든 REQ를 `Status=Registered`로 등록.

## 완료 체크
```
□ 요구사항 문서 + RTM 초기화
□ 제약 검증 완료
□ (워크플로우 내) state.json 초기화(greenfield flag) + P1.md 체크포인트
```
