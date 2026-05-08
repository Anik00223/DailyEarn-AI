#!/bin/bash

set -euo pipefail

# DailyEarn AI Deployment Script
# Usage: ./deploy.sh [staging|production]

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying DailyEarn AI to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment file exists
if [[ ! -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]]; then
    log_error "Environment file .env.$ENVIRONMENT not found!"
    log_info "Please create .env.$ENVIRONMENT from .env.$ENVIRONMENT.sample"
    exit 1
fi

# Validate required environment variables
required_vars=(
    "DOMAIN"
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_ACCESS_SECRET"
    "JWT_REFRESH_SECRET"
    "GEMINI_API_KEY"
    "ADMIN_SECRET"
    "LETSENCRYPT_EMAIL"
)

missing_vars=()
source "$PROJECT_DIR/.env.$ENVIRONMENT"

for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    log_error "Missing required environment variables:"
    printf '  - %s\n' "${missing_vars[@]}"
    exit 1
fi

log_info "✓ Environment validation passed"

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

# Use docker compose V2 if available
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log_info "✓ Docker found: $(docker --version)"
log_info "✓ Docker Compose found: $($DOCKER_COMPOSE --version)"

cd "$PROJECT_DIR"

# Pull latest images
log_info "Pulling latest Docker images..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml pull

# Stop services if running
if $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml ps | grep -q "Up"; then
    log_info "Stopping running services..."
    $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml down
fi

# Start database and cache (if not running)
log_info "Starting database and cache services..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d postgres redis

# Wait for database to be ready
log_info "Waiting for PostgreSQL to be ready..."
START_TIME=$(date +%s)
while ! $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml exec -T postgres pg_isready -U "${POSTGRES_USER}" 2>/dev/null; do
    if [[ $(($(date +%s) - START_TIME)) -gt 60 ]]; then
        log_error "PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""
log_info "✓ PostgreSQL is ready"

# Wait for Redis
log_info "Waiting for Redis to be ready..."
while ! $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml exec -T redis redis-cli ping 2>/dev/null; do
    if [[ $(($(date +%s) - START_TIME)) -gt 60 ]]; then
        log_error "Redis failed to start within 60 seconds"
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""
log_info "✓ Redis is ready"

# Rolling deployment of backend
log_info "Deploying backend service..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d --no-deps backend

# Health check backend
log_info "Waiting for backend to be healthy..."
RETRIES=30
while [[ $RETRIES -gt 0 ]]; do
    if curl -f -s "http://localhost:${BACKEND_PORT:-3001}/health" >/dev/null 2>&1; then
        log_info "✓ Backend is healthy"
        break
    fi
    RETRIES=$((RETRIES - 1))
    sleep 2
    echo -n "."
done

if [[ $RETRIES -eq 0 ]]; then
    log_error "Backend failed health check"
    exit 1
fi

# Deploy frontend
log_info "Deploying frontend service..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d --no-deps frontend

# Wait for frontend
log_info "Waiting for frontend to be ready..."
sleep 10

# Deploy nginx
log_info "Deploying nginx reverse proxy..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d --no-deps nginx

# Wait and verify
log_info "Waiting for all services to be ready..."
sleep 10

# Final health check
if curl -f -s "https://${DOMAIN}/health" >/dev/null 2>&1; then
    log_info "✓ Application is accessible at https://${DOMAIN}"
else
    log_warn "Application may not be accessible yet. Check the logs."
fi

# Show final status
log_info "Deployment completed! Service status:"
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml ps

# Cleanup old images
log_info "Cleaning up unused Docker images..."
docker image prune -f

log_info "✅ Deployment to $ENVIRONMENT completed successfully!"
log_info "🌐 Production URL: https://${DOMAIN}"
