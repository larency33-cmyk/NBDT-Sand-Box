@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js 22.12 or later is required.
  echo Install Node.js LTS from https://nodejs.org/ and rerun.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is missing. Reinstall Node.js with npm.
  pause
  exit /b 1
)
echo Installing NBDT dependencies (internet connection is needed the first time)...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed. Check internet access and your npm registry settings.
  pause
  exit /b 1
)
echo Starting NBDT local development server...
call npm run dev -- --host 127.0.0.1
if errorlevel 1 (
  echo [ERROR] Server failed to start.
  pause
  exit /b 1
)
