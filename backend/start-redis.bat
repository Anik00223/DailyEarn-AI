@echo off
REM Simple Redis starter - download if not exists, start if exists

if not exist "%TEMP%\redis\redis-server.exe" (
    echo Redis not found, downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip' -OutFile '%TEMP%\redis.zip' -UseBasicParsing"
    powershell -Command "Expand-Archive -Path '%TEMP%\redis.zip' -DestinationPath '%TEMP%' -Force"
    move "%TEMP%\Redis-x64-5.0.14.1\*" "%TEMP%\redis\" >nul 2>&1
    rmdir "%TEMP%\Redis-x64-5.0.14.1" >nul 2>&1
)

echo Starting Redis on port 6379...
start "" "%TEMP%\redis\redis-server.exe" --port 6379

echo Waiting 3 seconds for Redis to start...
timeout /t 3 /nobreak >nul

echo Redis should be running now. Check with: netstat -an | find "6379"
