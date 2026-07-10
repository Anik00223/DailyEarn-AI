#!/bin/bash
# =============================================================================
# DailyEarn AI — Always-Live Startup Script
# Ensures the server stays running with auto-restart on failure
# Usage: ./scripts/start-always.sh [production|staging]
# =============================================================================

set -euo pipefail

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "?? DailyEarn AI — Always-Live Startup"
echo "?? Environment: $ENVIRONMENT"
echo ""

# ─── Configuration ─────────────────────────────────────────────
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/server.pid"
LOCK_FILE="/tmp/dailyearn-startup.lock"

# ─── Prevent concurrent startups ───────────────────────────────
if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
        echo "? Another startup process is running (PID $LOCK_PID). Exiting."
        exit 1
    fi
    echo "? Stale lock file found — removing"
    rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# ─── Create log directory ──────────────────────────────────────
mkdir -p "$LOG_DIR"

# ─── Check environment file ────────────────────────────────────
ENV_FILE="$PROJECT_DIR/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ] && [ -f "$PROJECT_DIR/.env" ]; then
    ENV_FILE="$PROJECT_DIR/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "? No environment file found (.env.$ENVIRONMENT or .env)"
    echo "  Please create one from .env.production.sample or .env.staging.sample"
    exit 1
fi

echo "? Loading environment from: $ENV_FILE"

# ─── Export environment variables ──────────────────────────────
export $(grep -v '^#' "$ENV_FILE" | xargs)

# ─── Preflight checks ─────────────────────────────────────────
echo ""
echo "─" | tr -d '\n'; echo "─ Pre-flight checks"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "? Node.js is not installed"
    exit 1
fi
echo "? Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "? npm is not installed"
    exit 1
fi

# Check PM2 (recommended)
HAS_PM2=false
if command -v pm2 &> /dev/null; then
    HAS_PM2=true
    echo "? PM2: $(pm2 --version)"
else
    echo "? PM2 not found — will run with Node directly (PM2 recommended for production)"
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "? Server already running (PID $OLD_PID)"
        echo "  Stop it first with: ./scripts/stop.sh"
        exit 0
    else
        echo "? Stale PID file found"
        rm -f "$PID_FILE"
    fi
fi

# ─── Ensure dependencies are installed ────────────────────────
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo ""
    echo "─" | tr -d '\n'; echo "─ Installing backend dependencies..."
    npm install --prefer-offline --no-audit --no-fund
else
    echo "? Dependencies already installed"
fi

# ─── Build TypeScript ──────────────────────────────────────────
echo ""
echo "─" | tr -d '\n'; echo "─ Building TypeScript..."
npm run build 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "? Build failed — check errors above"
    exit 1
fi
echo "? Build successful"

# ─── Start server ──────────────────────────────────────────────
echo ""
echo "─" | tr -d '\n'; echo "─ Starting server..."

if [ "$HAS_PM2" = true ]; then
    echo "? Starting with PM2..."
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js --env "$ENVIRONMENT" --no-daemon &
    PM2_PID=$!

    # Wait for PM2 to start
    sleep 3

    # Verify it's running
    if pm2 describe dailyearn-backend &>/dev/null; then
        echo ""
        echo "============================================================"
        echo "✅ DailyEarn AI is LIVE with PM2!"
        echo "   PID: $(pm2 show dailyearn-backend | grep '│ pid' | awk '{print $3}')"
        echo "   Port: ${PORT:-3001}"
        echo "   Env:  $ENVIRONMENT"
        echo "   Logs: pm2 logs dailyearn-backend"
        echo "============================================================"
        echo ""
        echo "Commands:"
        echo "  pm2 logs dailyearn-backend     — View logs"
        echo "  pm2 stop dailyearn-backend     — Stop server"
        echo "  pm2 restart dailyearn-backend  — Restart"
        echo "  pm2 monit                     — Live monitoring"
        echo ""
        exit 0
    else
        echo "? PM2 failed to start — falling back to direct Node"
    fi
fi

# Fallback: Direct Node.js start with auto-restart loop
echo "? Starting directly with Node.js (auto-restart loop)..."
cd "$PROJECT_DIR/backend"

AUTO_RESTART=true
MAX_RESTARTS=999999  # Effectively infinite
RESTART_DELAY=3000

restart_server() {
    local count=0
    while [ "$count" -lt "$MAX_RESTARTS" ] && [ "$AUTO_RESTART" = true ]; do
        count=$((count + 1))
        echo ""
        echo "─" | tr -d '\n'; echo "─ Server start #$count at $(date '+%Y-%m-%d %H:%M:%S')"

        node dist/server.js 2>&1 | tee -a "$LOG_DIR/server.log" &
        SERVER_PID=$!
        echo $SERVER_PID > "$PID_FILE"

        # Wait for process to exit
        wait $SERVER_PID
        EXIT_CODE=$?

        echo ""
        echo "? Server exited with code $EXIT_CODE"

        if [ "$EXIT_CODE" -eq 0 ]; then
            echo "? Clean exit — not restarting"
            rm -f "$PID_FILE"
            exit 0
        fi

        echo "! Restarting in ${RESTART_DELAY}ms..."
        sleep $((RESTART_DELAY / 1000))
    done
}

# Handle signals for graceful shutdown
cleanup() {
    echo ""
    echo "? Received shutdown signal"
    AUTO_RESTART=false
    if [ -f "$PID_FILE" ]; then
        kill $(cat "$PID_FILE") 2>/dev/null || true
        rm -f "$PID_FILE"
    fi
    exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP

echo "============================================================"
echo "✅ DailyEarn AI is LIVE (direct Node.js mode)"
echo "   Port: ${PORT:-3001}"
echo "   Env:  $ENVIRONMENT"
echo "   PID file: $PID_FILE"
echo "   Logs:     tail -f $LOG_DIR/server.log"
echo "============================================================"
echo ""

restart_server