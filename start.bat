@echo off
setlocal enabledelayedexpansion
REM ---------------------------------------------------------------------------
REM  Zamglam - start the local development stack.
REM
REM  Run from a terminal:   .\start.bat        (PowerShell)
REM                         start.bat          (cmd)
REM  or just double-click it.
REM
REM  Uses npm.cmd rather than npm: this machine's PowerShell execution policy
REM  blocks npm.ps1, so plain `npm run dev` fails with a PSSecurityException.
REM ---------------------------------------------------------------------------

echo.
echo   ZAMGLAM - starting local development
echo   ===================================
echo.

REM --- MySQL must already be running (XAMPP) ---------------------------------
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
if errorlevel 1 (
  echo   [X] MySQL is NOT running on port 3306.
  echo.
  echo       Open the XAMPP Control Panel and click Start next to MySQL,
  echo       then run this script again.
  echo.
  pause
  exit /b 1
)
echo   [ok] MySQL is running on port 3306

REM --- Warn if the ports are already taken ------------------------------------
netstat -ano | findstr /R /C:":5000 .*LISTENING" >nul 2>&1
if not errorlevel 1 echo   [!] Port 5000 is already in use - the backend may already be running.
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul 2>&1
if not errorlevel 1 echo   [!] Port 3000 is already in use - Vite will move to 3001.

REM --- Start both servers in their own windows --------------------------------
start "Zamglam backend"  cmd /k "cd /d %~dp0backend && npm.cmd run dev"
start "Zamglam frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

REM --- Work out the Wi-Fi address so the phone URL is concrete -----------------
set "WIFIIP="
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.InterfaceAlias -match 'Wi-?Fi' -and $_.IPAddress -notlike '169.*' } ^| Select-Object -First 1).IPAddress"`) do set "WIFIIP=%%i"

echo.
echo   Two windows are opening. Give them a few seconds.
echo.
echo   Backend    http://localhost:5000
echo   Frontend   http://localhost:3000
if defined WIFIIP (
  echo   On phone   http://!WIFIIP!:3000      ^(same Wi-Fi^)
) else (
  echo   On phone   run  ipconfig  and use the Wi-Fi IPv4 address with :3000
)
echo.
echo   Close those two windows to stop the servers.
echo.
