#!/bin/bash
# Basic monitoring script
ENVIRONMENT=${1:-staging}
cd /opt/dailyearn
if ! docker ps | grep -q "dailyearn"; then
  echo "Services down, redeploying..."
  /opt/dailyearn/scripts/deploy.sh $ENVIRONMENT
fi
