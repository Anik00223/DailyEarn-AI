#!/bin/bash
# Windows start-always.bat — always-alive server wrapper for Windows
@echo off
setlocal enabledelayedexpansion

set PORT=3001
set NODE_ENV=production
set SCRIPT_DIR=%~dp0
set LOG_DIR=%SCRIPT_DIR%..\logs
set PID_FILE=%LOG_DIR%\server.pid
set SERVER_DIR=%SCRIPT_DIR%..\backend

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:START_LOOP
echo [%date% %time%] Starting DailyEarn AI server...
cd /d "%SERVER_DIR%"

node dist\server.js >> "%LOG_DIR%\server.log" 2>&1
set EXIT_CODE=%ERRORLEVEL%

echo [%date% %time%] Server exited with code %EXIT_CODE%

if %EXIT_CODE% EQU 0 (
    echo Clean exit detected. Server will not restart.
    goto :EOF
) else (
    echo Server crashed. Restarting in 5 seconds...
    timeout /t 5 /nobreak >nul
    goto START_LOOP
)