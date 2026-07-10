#!/bin/bash
# DailyEarn AI — Status check
PID_FILE="/opt/dailyearn/logs/server.pid"

echo "DailyEarn AI Status"
echo "==================="

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Status: RUNNING (PID $PID)"
        echo "Uptime: $(ps -o etimes= -p $PID | xargs) seconds"
        echo "Memory: $(ps -o rss= -p $PID | xargs) KB"
    else
        echo "Status: STOPPED (stale PID file)"
    fi
else
    echo "Status: STOPPED (no PID file)"
fi

# Check PM2 if installed
if command -v pm2 &> /dev/null; then
    echo ""
    echo "PM2 Status:"
    pm2 status 2>/dev/null || echo "  No PM2 processes"
fi

# Health check
if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo ""
    echo "Health Check: HEALTHY"
    curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || true
else
    echo ""
    echo "Health Check: UNREACHABLE"
fi