@echo off
setlocal
cd /d "%~dp0"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set stamp=%%i
set "backup=backups\backup-%stamp%"
mkdir "%backup%" 2>nul
if exist "prisma\dev.db" copy "prisma\dev.db" "%backup%\dev.db" >nul
if exist "public\uploads" xcopy "public\uploads" "%backup%\uploads\" /E /I /Y >nul
if exist ".env" copy ".env" "%backup%\.env" >nul
echo Backup created: %backup%
pause
