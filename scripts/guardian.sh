#!/bin/bash
# =============================================================================
# DailyEarn AI — Self-Healing Guardian
# Watches the server process and restarts it if it crashes
# Run this in a separate terminal or as a systemd service
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/server.pid"
GUARDIAN_PID_FILE="$LOG_DIR/guardian.pid"
CHECK_INTERVAL=10  # seconds between health checks
MAX_RESTARTS_PER_HOUR=10

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [GUARDIAN] $*" | tee -a "$LOG_DIR/guardian.log"
}

cleanup() {
    log "Guardian shutting down"
    rm -f "$GUARDIAN_PID_FILE"
    exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP

# Prevent multiple guardians
if [ -f "$GUARDIAN_PID_FILE" ]; then
    OLD_PID=$(cat "$GUARDIAN_PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        log "Another guardian is already running (PID $OLD_PID). Exiting."
        exit 0
    fi
    rm -f "$GUARDIAN_PID_FILE"
fi

echo $$ > "$GUARDIAN_PID_FILE"

restart_count=0
last_hour_restarts=0
hour_start=$(date +%s)

log "Guardian started (PID $$)"

while true; do
    SERVER_RUNNING=false
    NEEDS_RESTART=false
    REASON=""

    # Check if server process is alive via PID file
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            SERVER_RUNNING=true
        else
            NEEDS_RESTART=true
            REASON="Process $PID is dead"
        fi
    else
        NEEDS_RESTART=true
        REASON="No PID file found"
    fi

    # If process is running, do a quick health check
    if [ "$SERVER_RUNNING" = true ]; then
        if curl -sf --max-time 5 http://localhost:3001/api/health > /dev/null 2>&1; then
            # Server is healthy
            :
        else
            NEEDS_RESTART=true
            REASON="Health check failed"
        fi
    fi

    # Rate limit restarts per hour
    CURRENT_TIME=$(date +%s)
    if [ $((CURRENT_TIME - hour_start)) -gt 3600 ]; then
        hour_start=$CURRENT_TIME
        last_hour_restarts=0
    fi

    if [ "$NEEDS_RESTART" = true ]; then
        if [ $last_hour_restarts -ge $MAX_RESTARTS_PER_HOUR ]; then
            log "CRITICAL: Restart rate limit reached ($MAX_RESTARTS_PER_HOUR/hour). NOT restarting."
            log "Manual intervention required!"
        else
            log "⚠ $REASON — restarting server..."
            bash "$SCRIPT_DIR/start-always.sh" production >> "$LOG_DIR/guardian.log" 2>&1 &
            last_hour_restarts=$((last_hour_restarts + 1))
            log "Restart #$last_hour_restarts this hour"
        fi
    fi

    sleep $CHECK_INTERVAL
done