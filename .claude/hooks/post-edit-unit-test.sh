#!/usr/bin/env bash
# post-edit-unit-test.sh — PostToolUse(Edit|Write|MultiEdit) focused unit test runner
#
# 편집된 src 파일과 매칭되는 unit 테스트만 골라 실행(빠르게) → 결과를 메인에 정보로 전달.
# **report-only (non-blocking, 항상 exit 0)**: TDD 특성상 중간 단계의 실패는 정상이다
#   - P4 RED: 구현 전이라 테스트가 실패해야 정상
#   - P5 부분 GREEN: 한 번에 하나씩 통과시키므로 중간엔 일부 실패가 정상
# 따라서 블로킹(exit 2)하지 않고 PASS/FAIL 요약만 surface한다.
# pytest 부재·미수집(no tests)·대상 외 파일이면 조용히 통과.
set -uo pipefail

payload="$(cat)"
file="$(printf '%s' "$payload" | python -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null)"
[ -z "$file" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$file" in
  "$root"/*) rel="${file#"$root"/}" ;;
  *)         rel="$file" ;;
esac
rel="${rel//\\//}"

# pytest가 없으면 강제할 것이 없으니 통과
command -v pytest >/dev/null 2>&1 || exit 0

# 대상 결정: src 편집 → 모듈명 매칭 테스트 / unit 테스트 편집 → 그 파일
case "$rel" in
  src/*.py)        target="tests/unit -k $(basename "$rel" .py)" ;;
  tests/unit/*.py) target="$rel" ;;
  *) exit 0 ;;
esac

out="$(pytest $target -q 2>&1)"; rc=$?
[ "$rc" -eq 5 ] && exit 0          # exit 5 = no tests collected → 보고할 것 없음
if [ "$rc" -ne 0 ]; then
  # 블로킹하지 않음 — 중간 단계 실패는 TDD상 정상일 수 있다. 정보로만 전달.
  echo "[post-edit-unit-test] $rel — unit test 실패 있음 (TDD 진행 중이면 정상 / 완료 단계면 확인 필요):"
  echo "$out" | tail -20
fi
exit 0
