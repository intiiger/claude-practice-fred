#!/usr/bin/env bash
# post-edit-lint.sh — PostToolUse(Edit|Write|MultiEdit) lint dispatcher
#
# HALO repo는 프레임워크다: src/tests는 워크플로우 실행 시 feature별로 채워진다.
# 따라서 toolchain을 하드코딩하지 않고 자동 감지하며,
# 도구가 없거나 대상 파일이 아니면 조용히 통과(exit 0)한다.
# 실제 lint FAIL일 때만 stderr로 보고하고 exit 2 → 메인 에이전트가 인지/수정.
set -uo pipefail

# 1) 훅 페이로드(stdin JSON)에서 편집된 파일 경로 추출 (python은 항상 존재)
payload="$(cat)"
file="$(printf '%s' "$payload" | python -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null)"
[ -z "$file" ] && exit 0

# 2) repo 기준 상대 경로로 정규화 (Windows 역슬래시 → 슬래시)
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$file" in
  "$root"/*) rel="${file#"$root"/}" ;;
  *)         rel="$file" ;;
esac
rel="${rel//\\//}"

# 3) 스코프: 생성된 코드(src/, tests/)만 대상. .claude/·docs/·*.md 등은 무시
case "$rel" in
  src/*|tests/*) ;;
  *) exit 0 ;;
esac

# 4) 언어별 linter 자동 감지 후 실행
case "$rel" in
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      out="$(ruff check "$rel" 2>&1)" || { echo "[post-edit-lint] ruff $rel:"; echo "$out"; exit 2; }
    elif command -v flake8 >/dev/null 2>&1; then
      out="$(flake8 "$rel" 2>&1)" || { echo "[post-edit-lint] flake8 $rel:"; echo "$out"; exit 2; }
    fi
    ;;
  *.js|*.ts|*.jsx|*.tsx)
    if [ -f package.json ] && command -v npx >/dev/null 2>&1 && npx --no-install eslint --version >/dev/null 2>&1; then
      out="$(npx --no-install eslint "$rel" 2>&1)" || { echo "[post-edit-lint] eslint $rel:"; echo "$out"; exit 2; }
    fi
    ;;
esac
exit 0
