#!/usr/bin/env python3
"""HALO Codex PostToolUse hook — report-only lint/test (payload 비의존).

Codex 편집 도구의 payload 스키마(tool_input의 파일경로 필드)가 버전마다 달라서,
stdin 페이로드는 소비만 하고 **git 변경분**으로 대상 파일을 찾는다.
- 대상: src/·tests/ 의 *.py 변경분(추적/스테이지/미추적)
- ruff(있으면) lint + 매칭 unit test 실행 → 결과를 stdout(developer context)으로만 전달
- 절대 차단하지 않는다(항상 exit 0). 도구 부재·변경 없음이면 조용히 통과.
- TDD 중간 단계(P4 RED, P5 부분 GREEN)의 테스트 실패는 정상이므로 정보로만.
"""
import os
import subprocess
import sys


def sh(args):
    try:
        return subprocess.run(args, capture_output=True, text=True, timeout=110)
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return None


def main():
    try:
        sys.stdin.read()  # payload 소비(스키마 비의존)
    except Exception:
        pass

    changed = set()
    for cmd in (
        ["git", "diff", "--name-only"],
        ["git", "diff", "--name-only", "--cached"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ):
        r = sh(cmd)
        if r and r.returncode == 0:
            changed.update(
                line.strip().replace("\\", "/")
                for line in r.stdout.splitlines() if line.strip()
            )

    targets = [
        f for f in changed
        if (f.startswith("src/") or f.startswith("tests/")) and f.endswith(".py")
    ]
    if not targets:
        return 0

    msgs = []

    # 1) lint (ruff 자동 감지)
    r = sh(["ruff", "check", *targets])
    if r is not None and r.returncode != 0 and (r.stdout or r.stderr):
        msgs.append("[halo-lint]\n" + (r.stdout or r.stderr)[-1200:])

    # 2) 매칭 unit test (report-only; exit 5 = no tests collected → 무시)
    bases = sorted({os.path.basename(f)[:-3] for f in targets})
    r = sh([sys.executable, "-m", "pytest", "tests/unit", "-k", " or ".join(bases), "-q"])
    if r is not None and r.returncode not in (0, 5) and r.stdout:
        msgs.append("[halo-unit-test] 실패 있음(TDD 진행 중이면 정상 / 완료 단계면 확인):\n" + r.stdout[-1500:])

    if msgs:
        print("\n".join(msgs))  # stdout → Codex developer context
    return 0


if __name__ == "__main__":
    sys.exit(main())
