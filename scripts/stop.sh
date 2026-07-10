#!/bin/bash
# DailyEarn AI — Stop server
PID_FILE="/opt/dailyearn/logs/server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping DailyEarn AI (PID $PID)..."
        kill "$PID"
        sleep 2
        if kill -0 "$PID" 2>/dev/null; then
            kill -9 "$PID"
        fi
        rm -f "$PID_FILE"
        echo "Stopped."
    else
        echo "Process not running (stale PID file)"
        rm -f "$PID_FILE"
    fi
else
    echo "No PID file found — checking for node processes..."
    pkill -f "node.*dist/server.js" || echo "No running server found"
fi