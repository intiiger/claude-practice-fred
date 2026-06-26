<#
.SYNOPSIS
  HALO 에이전트 플러그인 이식기 (Claude Code + Codex).

.DESCRIPTION
  halo-workflow 레포를 clone 해서 제품 워크스페이스에 에이전트 설정을 설치한다.
  설치물은 **전부 실행한 폴더(Target) 안에만** 생긴다. 사용자 홈에는 아무것도 안 쓴다.
  - 어댑터: .claude / .codex
  - 공유자산: AGENTS.md = Codex 룰, .codex/skills/ = Codex 스킬(워크플로우·eval·doc-drift-sync 포함)
  - 기본 -Mode Backup: 대상의 기존 설정을 .halo-backup/시각 폴더에 백업 후 덮어씀.
  - -WhatIf 로 실제 변경 없이 미리보기.

.PARAMETER Target  설치 대상 폴더. 기본은 현재 폴더(실행 위치).
.PARAMETER Repo    소스 레포 URL.
.PARAMETER Tools   설치할 에이전트: claude, codex. 기본은 둘 다.
.PARAMETER Mode    Backup 기본 / Merge / Force.
                    Backup = 기존 파일 백업 후 덮어쓰기.
                    Merge  = 없는 파일만 추가, 기존 보존.
                    Force  = 백업 없이 덮어쓰기.

.EXAMPLE
  .\setup-agent.ps1
.EXAMPLE
  .\setup-agent.ps1 -Tools codex -Mode Merge
.EXAMPLE
  .\setup-agent.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Medium')]
param(
  [string]   $Target = (Get-Location).Path,
  [string]   $Repo   = 'https://github.com/FREEDOBY/halo-workflow.git',
  [ValidateSet('claude', 'codex')]
  [string[]] $Tools  = @('claude', 'codex'),
  [ValidateSet('Backup', 'Merge', 'Force')]
  [string]   $Mode   = 'Backup'
)
$ErrorActionPreference = 'Stop'

# 도구별 설치 manifest. 공유자산(AGENTS.md)은 도구 간 중복 -> dedupe.
$assets = @{
  claude = @('.claude')
  codex  = @('.codex', 'AGENTS.md')
}
$items = $Tools | ForEach-Object { $assets[$_] } | Select-Object -Unique

# 이전 버전에서 이전/삭제된 경로. 오버레이 복사(Copy-Item)는 소스에 없는 파일을 못 지우므로
# 업그레이드 설치 시 stale 파일이 남는다 → 명시적으로 제거한다.
#   .claude/commands/agents/ : 에이전트 정의를 .claude/agents/로 이전. 잔존 시 stray 슬래시 커맨드(/agents:*) 재등록.
# 향후 파일을 이전/삭제하면 이 목록도 함께 갱신한다.
$pruneByTool = @{
  claude = @('.claude/commands/agents')
}
$prune = $Tools | ForEach-Object { $pruneByTool[$_] } | Where-Object { $_ } | Select-Object -Unique

$stamp      = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$backupRoot = Join-Path $Target ".halo-backup\$stamp"
$results    = @()
$didBackup  = $false

function Copy-Overlay {
  param([string]$Src, [string]$Dst)
  if (Test-Path -LiteralPath $Src -PathType Container) {
    if (-not (Test-Path -LiteralPath $Dst)) { New-Item -ItemType Directory -Force -Path $Dst | Out-Null }
    if (Get-ChildItem -LiteralPath $Src -Force) {
      Copy-Item -Path (Join-Path $Src '*') -Destination $Dst -Recurse -Force
    }
  }
  else {
    $parent = Split-Path $Dst -Parent
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Copy-Item -LiteralPath $Src -Destination $Dst -Force
  }
}

function Backup-Existing {
  param([string]$Dst, [string]$BackupTo)
  if (Test-Path -LiteralPath $Dst -PathType Container) {
    New-Item -ItemType Directory -Force -Path $BackupTo | Out-Null
    if (Get-ChildItem -LiteralPath $Dst -Force) {
      Copy-Item -Path (Join-Path $Dst '*') -Destination $BackupTo -Recurse -Force
    }
  }
  else {
    $parent = Split-Path $BackupTo -Parent
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Copy-Item -LiteralPath $Dst -Destination $BackupTo -Force
  }
}

# --- clone ---
$tmp = Join-Path $env:TEMP ('halo-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
Write-Host "clone: $Repo"
git clone --depth 1 --quiet $Repo $tmp
if ($LASTEXITCODE -ne 0) { throw "git clone 실패: $Repo" }

try {
  foreach ($rel in $items) {
    $src = Join-Path $tmp $rel
    $dst = Join-Path $Target $rel
    if (-not (Test-Path -LiteralPath $src)) { $results += "skip-소스없음: $rel"; continue }

    if (-not (Test-Path -LiteralPath $dst)) {
      if ($PSCmdlet.ShouldProcess($dst, '설치')) { Copy-Overlay -Src $src -Dst $dst; $results += "installed: $rel" }
      continue
    }

    switch ($Mode) {
      'Merge' {
        if (Test-Path -LiteralPath $src -PathType Container) {
          if ($PSCmdlet.ShouldProcess($dst, '병합-없는파일만')) {
            $base = (Get-Item -LiteralPath $src).FullName
            Get-ChildItem -LiteralPath $src -Recurse -File -Force | ForEach-Object {
              $childRel = $_.FullName.Substring($base.Length).TrimStart('\', '/')
              $t = Join-Path $dst $childRel
              if (-not (Test-Path -LiteralPath $t)) {
                $td = Split-Path $t -Parent
                if (-not (Test-Path -LiteralPath $td)) { New-Item -ItemType Directory -Force -Path $td | Out-Null }
                Copy-Item -LiteralPath $_.FullName -Destination $t -Force
              }
            }
            $results += "merged: $rel"
          }
        }
        else { $results += "skip-이미존재: $rel" }
      }
      'Force' {
        if ($PSCmdlet.ShouldProcess($dst, '덮어쓰기')) { Copy-Overlay -Src $src -Dst $dst; $results += "overwrite: $rel" }
      }
      default {
        $b = Join-Path $backupRoot $rel
        if ($PSCmdlet.ShouldProcess($dst, '백업후덮어쓰기')) {
          Backup-Existing -Dst $dst -BackupTo $b
          $didBackup = $true
          Copy-Overlay -Src $src -Dst $dst
          $results += "backup+overwrite: $rel"
        }
      }
    }
  }

  # --- 이전/삭제된 경로 정리 (오버레이 복사가 못 지우는 stale 파일 제거) ---
  # Merge 모드 포함 모든 모드에서 적용 — stale 파일은 어떤 모드에서도 남으면 안 된다.
  # 사용자 로컬 파일 보호: 특정 경로만 제거하고 .claude 전체를 clean-replace 하지 않는다.
  foreach ($p in $prune) {
    $pt = Join-Path $Target $p
    if (-not (Test-Path -LiteralPath $pt)) { continue }
    if ($Mode -eq 'Backup') {
      Backup-Existing -Dst $pt -BackupTo (Join-Path $backupRoot $p)
      $didBackup = $true
    }
    if ($PSCmdlet.ShouldProcess($pt, '이전된 경로 제거')) {
      Remove-Item -LiteralPath $pt -Recurse -Force
      $results += "pruned: $p"
    }
  }

  # --- 배포: .claude/skills/* → .codex/skills/ 복사 (Codex 설치 시) ---
  # phase 스킬은 도구 중립이라 .claude/skills 를 그대로 .codex/skills 로 복사해 배포한다.
  # 소스는 clone($tmp) — codex 단독 설치(.claude 미설치)에서도 항상 존재.
  if ($Tools -contains 'codex') {
    $skillSrc = Join-Path $tmp '.claude/skills'
    $skillDst = Join-Path $Target '.codex/skills'
    if (Test-Path -LiteralPath $skillSrc) {
      if ($PSCmdlet.ShouldProcess($skillDst, '.claude/skills -> .codex/skills 복사')) {
        if (-not (Test-Path -LiteralPath $skillDst)) { New-Item -ItemType Directory -Force -Path $skillDst | Out-Null }
        Copy-Item -Path (Join-Path $skillSrc '*') -Destination $skillDst -Recurse -Force
        $results += "codex-skills 복사: .claude/skills -> .codex/skills"
      }
    }
  }
}
finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

# --- 요약 ---
Write-Host ''
Write-Host "=== HALO 이식 결과 -> $Target ==="
Write-Host ("도구: " + ($Tools -join ', ') + "  /  모드: $Mode")
if ($results.Count -eq 0) { Write-Host '  변경 없음' } else { $results | ForEach-Object { Write-Host "  $_" } }
if ($didBackup) { Write-Host "백업 위치: $backupRoot" }
Write-Host ''
Write-Host '다음 단계:'
Write-Host '  - Claude: .claude/ 그대로 동작 [CLAUDE.md + rules + skills + commands + hooks]'
if ($Tools -contains 'codex') {
  Write-Host '  - Codex: AGENTS.md=룰, .codex/skills=스킬(halo-workflow/eval/doc-drift-sync + phase 5개)'
  Write-Host '           워크플로우는 halo-workflow 스킬로 실행. config.toml 훅을 쓰려면 프로젝트를 trust.'
  Write-Host '           (모든 설치물은 이 폴더 안에만 생성됨 - 사용자 홈 미사용)'
}
