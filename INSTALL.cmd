@echo off
setlocal
cd /d "%~dp0"
title PERSPEKTIVA - installation

echo ===============================================
echo       PERSPEKTIVA - PROJECT SETUP
echo ===============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js LTS and run this file again.
  pause
  exit /b 1
)

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 goto error

echo [2/3] Preparing Prisma Client...
call npx prisma generate
if errorlevel 1 goto error

echo [3/3] Updating database schema without deleting existing data...
call npx prisma db push
if errorlevel 1 goto error

echo.
echo Setup completed. Existing administrator credentials were not changed.
echo Now run START.cmd
pause
exit /b 0

:error
echo.
echo ERROR: installation was not completed.
echo Take a screenshot of this window and send it to ChatGPT.
pause
exit /b 1
