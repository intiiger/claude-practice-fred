@echo off
setlocal enableextensions
REM ============================================================
REM  HALO agent setup (Claude Code + Codex)
REM  Wrapper for setup-agent.ps1 - handles PowerShell exec policy,
REM  forwards all args, and bootstraps the script if missing.
REM
REM  Usage:
REM    setup-agent.bat                         install both into current folder
REM    setup-agent.bat -Tools codex            Codex only
REM    setup-agent.bat -Mode Force             overwrite without backup
REM    setup-agent.bat -Target C:\my-product   install into a specific folder
REM    setup-agent.bat -WhatIf                 preview only (no changes)
REM ============================================================

set "PS1=%~dp0setup-agent.ps1"
set "TMPPS=%TEMP%\setup-agent.ps1"
set "RAW=https://raw.githubusercontent.com/FREEDOBY/halo-workflow/main/setup-agent.ps1"

REM pause at end only when launched by double-click (not when run from a shell)
set "PAUSE_AT_END=0"
echo %cmdcmdline% | find /i "%~nx0" >nul 2>&1 && set "PAUSE_AT_END=1"

if exist "%PS1%" goto runlocal

echo setup-agent.ps1 not found beside this file - downloading from repo...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing '%RAW%' -OutFile '%TMPPS%'"
if errorlevel 1 (
  echo [ERROR] download failed: %RAW%
  set "EXITCODE=1"
  goto finish
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%TMPPS%" %*
set "EXITCODE=%ERRORLEVEL%"
goto finish

:runlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" %*
set "EXITCODE=%ERRORLEVEL%"
goto finish

:finish
if "%PAUSE_AT_END%"=="1" pause
endlocal & exit /b %EXITCODE%
