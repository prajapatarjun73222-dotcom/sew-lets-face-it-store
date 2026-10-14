@echo off
title Sew Lets Face It - dev servers
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not on PATH. Install it from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "server\.env" (
  echo server\.env is missing. Copy server\.env.example to server\.env and fill in the values.
  pause
  exit /b 1
)

if not exist "node_modules" call npm install
if not exist "server\node_modules" call npm install --prefix server
if not exist "client\node_modules" call npm install --prefix client

echo Starting API on http://localhost:5000 and website on http://localhost:5173 ...
echo Press Ctrl+C in this window to stop both.

start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:5173"
call npm run dev
