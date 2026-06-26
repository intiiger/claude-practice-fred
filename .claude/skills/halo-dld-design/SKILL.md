---
name: halo-dld-design
description: HALO P3 상세 설계(DLD). 요구사항을 받아 파일 구조·인터페이스 계약(public 시그니처)·데이터 흐름·통합 지점을 설계. P4/P5가 이 계약을 따른다. /halo-workflow의 P3으로도, 단독으로도 호출 가능.
---

# HALO — Detailed Level Design (P3)

요구사항을 구현 가능한 설계로 변환. 산출물: `docs/architecture/[feature].md`.

> **호출 맥락**
> - `/halo-workflow` 안: P1~P2 컨텍스트 기반으로 설계하고 P3.md 체크포인트 기록.
> - **단독 호출**: 요구사항 문서(또는 사용자가 준 요구) 기반으로 설계 문서만 작성.

## 입력
- `docs/requirements/[feature].md` (있으면) 또는 사용자가 제시한 요구사항
- (선택) 기존 코드베이스 탐색 결과

## 1. 설계
```
요구사항 기반으로 직접 설계. 포함 항목:
- 파일 구조 (생성/수정 대상)
- 인터페이스 계약 (public 함수 시그니처) ← P4(테스트)·P5(구현)가 그대로 따른다
- 데이터 흐름
- 통합 지점 (Integration Points)
```
> 인터페이스 계약이 이 단계의 핵심 산출. 시그니처가 모호하면 P4가 잘못된 테스트를, P5가 잘못된 구현을 만든다.

## 2. 설계 문서 스키마
```markdown
# Architecture: [Feature Name]
## 1. Design Overview
## 2. File Structure
## 3. Interface Contract        ← public 시그니처 (입력/출력/예외)
## 4. Data Flow
## 5. Integration Points
```

## 완료 체크
```
□ docs/architecture/[feature].md 작성 (인터페이스 계약 포함)
□ (워크플로우 내) P3.md 체크포인트
```
