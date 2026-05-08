# DailyEarn AI - Makefile for Development and Deployment
.PHONY: help dev staging prod test clean logs backup rollback health

ENVIRONMENT ?= staging
SERVICE ?=

help: ## Show this help message
	@echo 'DailyEarn AI - Available commands:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Run development environment
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
	@echo "🔗 Frontend: http://localhost:5173"
	@echo "🔗 API: http://localhost:3001"

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.yml -f docker-compose.override.yml down

staging: ## Deploy to staging
	@echo "🚀 Deploying to staging..."
	./scripts/deploy.sh staging

staging-logs: ## View staging logs
	docker-compose -f docker-compose.yml -f docker-compose.staging.yml logs -f

staging-shell: ## Access staging backend shell
	docker-compose -f docker-compose.yml -f docker-compose.staging.yml exec backend sh

prod: ## Deploy to production
	@echo "⚠️  Deploying to production..."
	read -p "Are you sure you want to deploy to production? (yes/N): " confirm && [ "$${confirm}" = "yes" ]
	./scripts/deploy.sh production

prod-logs: ## View production logs
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

prod-shell: ## Access production backend shell
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend sh

test: ## Run tests
	@echo "🧪 Running tests..."
	cd backend && npm test
	cd frontend && npm test

build: ## Build production images
	@echo "🔨 Building production images..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

logs: ## View logs (specify ENVIRONMENT=staging|prod)
	@echo "📋 Viewing logs for $(ENVIRONMENT)..."
@if docker compose version &> /dev/null; then
		docker compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml logs -f $(SERVICE)
	else
		docker-compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml logs -f $(SERVICE)
	endif

backup: ## Create backup (specify ENVIRONMENT=staging|prod)
	@echo "💾 Creating backup for $(ENVIRONMENT)..."
	./scripts/backup.sh $(ENVIRONMENT)

rollback: ## Rollback to previous backup (specify ENVIRONMENT=staging|prod)
	@echo "⏮️  Rolling back $(ENVIRONMENT)..."
	./scripts/rollback.sh $(ENVIRONMENT) $(BACKUP_FILE)

clean: ## Clean up Docker images, containers, volumes
	@echo "🧹 Cleaning up Docker resources..."
	docker system prune -f	docker volume prune -f
	docker image prune -f

db-migrate: ## Run database migrations
	@echo "🗄️  Running migrations..."
	docker-compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml exec backend npm run db:migrate

health: ## Health check (specify ENVIRONMENT=staging|prod)
	@echo "❤️  Running health check for $(ENVIRONMENT)..."
	./scripts/health-check.sh $(ENVIRONMENT)

certbot: ## Renew SSL certificates
	@echo "🔐 Renewing SSL certificates..."
	docker-compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml run --rm certbot

status: ## Show service status
	@docker-compose -f docker-compose.yml -f docker-compose.$(ENVIRONMENT).yml ps

setup-staging: ## Initial staging setup
	@echo "🔧 Setting up staging environment..."
	cp .env.staging.sample .env.staging
	@echo "Please edit .env.staging with your actual values"

setup-prod: ## Initial production setup
	@echo "🔧 Setting up production environment..."
	cp .env.production.sample .env.production
	@echo "⚠️  Please edit .env.production with your actual values (keep secure!)"

logs-backend: ## View backend logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=backend

logs-frontend: ## View frontend logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=frontend

logs-nginx: ## View nginx logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=nginx

logs-db: ## View database logs
	$(MAKE) logs ENVIRONMENT=$(ENVIRONMENT) SERVICE=postgres

validate-config: ## Validate configuration files
	@echo "✅ Validating configuration..."
	@docker-compose config -q
	@echo "✓ Configuration valid"
