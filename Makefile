# shellcheck disable=SC2086,SC2207

# DailyEarn AI - Makefile for Development, Production & Always-Live Operations
.PHONY: help dev staging prod test clean logs backup rollback health \
         start-always stop restart status pm2-setup pm2-start pm2-stop \
         pm2-logs pm2-monitor build validate-config setup-staging setup-prod

ENVIRONMENT ?= staging
SERVICE ?=

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-24s\033[0m %s\n", $$1, $$2}'

# ─── Development ───────────────────────────────────────────────
dev: ## Run development environment
	@echo "?? Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
	@echo "?? Frontend: http://localhost:5173"
	@echo "?? API: http://localhost:3001"

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.yml -f docker-compose.override.yml down

dev-logs: ## View dev logs
	docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f

# ─── Always-Live Mode (Production) ─────────────────────────────
start-always: ## Start server in always-live mode (with auto-restart)
	@echo "?? Starting Always-Live mode..."
	@chmod +x scripts/start-always.sh scripts/stop.sh scripts/restart.sh scripts/status.sh
	@bash scripts/start-always.sh $(ENVIRONMENT)

stop: ## Stop the always-live server
	@echo "?? Stopping server..."
	@bash scripts/stop.sh

restart: ## Restart the server
	@echo "?? Restarting server..."
	@bash scripts/restart.sh $(ENVIRONMENT)

status: ## Check server status
	@bash scripts/status.sh

# ─── PM2 Process Manager ──────────────────────────────────────
pm2-setup: ## Install PM2 globally and configure
	@echo "?? Setting up PM2..."
	npm install -g pm2@latest
	@echo "?? PM2 installed: $$(pm2 --version)"
	@echo ""
	@echo "Next steps:"
	@echo "  make pm2-start    — Start with PM2"
	@echo "  make pm2-logs     — View logs"
	@echo "  make pm2-monitor  — Live monitoring"

pm2-start: ## Start server with PM2
	@echo "?? Starting with PM2..."
	@cd $(CURDIR) && pm2 start ecosystem.config.js
	@echo "?? PM2 started. Commands:"
	@echo "  pm2 logs dailyearn-backend"
	@echo "  pm2 monit"
	@echo "  pm2 save"
	@echo "  pm2 startup  (for boot persistence)"

pm2-stop: ## Stop PM2 server
	@echo "?? Stopping PM2 server..."
	@pm2 stop dailyearn-backend || true

pm2-restart: ## Restart PM2 server
	@echo "?? Restarting PM2 server..."
	@pm2 restart dailyearn-backend || true

pm2-logs: ## View PM2 logs
	@pm2 logs dailyearn-backend

pm2-monitor: ## Live PM2 monitoring
	@pm2 monit

pm2-status: ## Show PM2 status
	@pm2 status

pm2-save: ## Save PM2 process list
	@pm2 save
	@echo "?? PM2 process list saved"

pm2-startup: ## Configure PM2 to start on boot
	@echo "?? Setting up PM2 boot script..."
	@pm2 startup
	@echo "?? Run the command printed above, then:"
	@echo "  make pm2-save"

# ─── Docker Deployments ────────────────────────────────────────
staging: ## Deploy to staging
	@echo "?? Deploying to staging..."
	./scripts/deploy.sh staging

prod: ## Deploy to production
	@echo "??  Deploying to production..."
	read -p "Are you sure you want to deploy to production? (yes/N): " confirm && [ "$${confirm}" = "yes" ]
	./scripts/deploy.sh production

build: ## Build production Docker images
	@echo "?? Building production images..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# ─── Testing ───────────────────────────────────────────────────
test: ## Run tests
	@echo "?? Running tests..."
	cd backend && npm test 2>&1 || echo "?? Backend tests failed"
	cd frontend && npm test 2>&1 || echo "?? Frontend tests failed"

test-backend: ## Run backend tests only
	@echo "?? Running backend tests..."
	cd backend && npm test

test-frontend: ## Run frontend tests only
	@echo "?? Running frontend tests..."
	cd frontend && npm test

# ─── Logs ──────────────────────────────────────────────────────
logs: ## View logs (specify ENVIRONMENT=staging|prod)
	@echo "?? Viewing logs for $(ENVIRONMENT)..."
	@docker compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml logs -f $(SERVICE)

logs-backend: ## View backend logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=backend

logs-frontend: ## View frontend logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=frontend

logs-nginx: ## View nginx logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=nginx

logs-db: ## View database logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=postgres

# ─── Health & Monitoring ───────────────────────────────────────
health: ## Health check (specify ENVIRONMENT=staging|prod)
	@echo "??  Running health check for $(ENVIRONMENT)..."
	./scripts/health-check.sh $(ENVIRONMENT)

health-local: ## Local health check
	@echo "?? Checking local health..."
	@curl -sf http://localhost:3001/api/health && echo "" && echo "✅ Healthy" || echo "❌ Unhealthy"

monitor: ## Show server metrics
	@curl -sf http://localhost:3001/api/monitor | python3 -m json.tool 2>/dev/null || echo "?? Server not responding"

# ─── Database ──────────────────────────────────────────────────
db-migrate: ## Run database migrations
	@echo "???  Running migrations..."
	docker-compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml exec backend npm run db:migrate

db-push: ## Push schema to database (dev)
	cd backend && npm run db:push

db-generate: ## Generate migrations from schema
	cd backend && npm run db:generate

db-studio: ## Open Drizzle Studio
	cd backend && npm run db:studio

db-shell: ## Open database shell
	docker-compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-dailyearn}

# ─── Backups ───────────────────────────────────────────────────
backup: ## Create backup (specify ENVIRONMENT=staging|prod)
	@echo "?? Creating backup for $(ENVIRONMENT)..."
	./scripts/backup.sh $(ENVIRONMENT)

rollback: ## Rollback to previous backup (specify ENVIRONMENT=staging|prod)
	@echo "??  Rolling back $(ENVIRONMENT)..."
	./scripts/rollback.sh $(ENVIRONMENT) $(BACKUP_FILE)

# ─── Cleanup ───────────────────────────────────────────────────
clean: ## Clean up Docker resources
	@echo "?? Cleaning up Docker resources..."
	docker system prune -f
	docker volume prune -f
	docker image prune -f

clean-all: ## Clean everything including volumes
	@echo "??  Cleaning everything..."
	docker-compose -f docker-compose.yml down -v --remove-orphans
	docker system prune -f --volumes
	docker image prune -f

# ─── Setup ─────────────────────────────────────────────────────
setup-staging: ## Initial staging setup
	@echo "?? Setting up staging environment..."
	cp .env.staging.sample .env.staging
	@echo "Please edit .env.staging with your actual values"

setup-prod: ## Initial production setup
	@echo "?? Setting up production environment..."
	cp .env.production.sample .env.production
	@echo "??  Please edit .env.production with actual values (keep secure!)"

validate-config: ## Validate configuration files
	@echo "? Validating configuration..."
	@docker-compose config -q
	@echo "?? Configuration valid"