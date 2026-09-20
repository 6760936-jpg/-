@echo off
setlocal
cd /d "%~dp0"
title PERSPEKTIVA - server

if not exist "node_modules" (
  echo Dependencies not found. Starting installation...
  call INSTALL.cmd
  if errorlevel 1 exit /b 1
)

echo [1/3] Preparing Prisma Client...
call npx prisma generate
if errorlevel 1 goto error

echo [2/3] Updating database schema...
call npx prisma db push
if errorlevel 1 goto error

echo [3/3] Clearing Next.js cache...
if exist ".next" rmdir /s /q ".next"

echo.
echo Starting PERSPEKTIVA...
echo Open this address in your browser when Next.js is ready:
echo http://localhost:3000
echo.
call npm run dev
exit /b 0

:error
echo.
echo ERROR: project preparation failed.
echo Take a screenshot of this window and send it to ChatGPT.
pause
exit /b 1
