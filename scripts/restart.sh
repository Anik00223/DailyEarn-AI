#!/bin/bash
# DailyEarn AI — Restart server (stop + start)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/stop.sh"
sleep 2
"$SCRIPT_DIR/start-always.sh" "${1:-production}"