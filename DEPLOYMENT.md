# DailyEarn AI - Deployment Guide

Complete production-ready infrastructure configuration with Docker, Nginx, SSL, and CI/CD.

## 📋 Overview

This setup provides:
- ✅ Docker containerization for all services
- ✅ Nginx reverse proxy with SSL (Let's Encrypt)
- ✅ PostgreSQL and Redis in containers
- ✅ GitHub Actions CI/CD pipeline
- ✅ Environment separation (dev/staging/prod)
- ✅ Rolling deployments
- ✅ Health checks & monitoring
- ✅ Automated backups
- ✅ Resource limits

## 🚀 Quick Start

### 1. Environment Setup

**Staging setup:**
```bash
cp .env.staging.sample .env.staging
# Edit .env.staging with your values
```

**Production setup:**
```bash
cp .env.production.sample .env.production
# Edit .env.production with your secure values
# DO NOT commit .env.production to git!
```

### 2. Development (Local)

```bash
# Start development environment
make dev

# View logs
make logs ENVIRONMENT=dev

# Stop environment
make dev-stop
```

Access:
- Frontend: http://localhost:5173
- API: http://localhost:3001

### 3. Deploy to Staging

**Deploy staging via GitHub Actions:**
```bash
git checkout staging
git add .
git commit -m "Deploy to staging"
git push origin staging
```

**Deploy staging manually:**
```bash
ssh root@your-staging-server

# Clone repo
git clone https://github.com/your-username/dailyearn-ai.git
cd dailyearn-ai

# Create .env.staging (copy from GitHub secrets)
# Deploy
make staging
```

### 4. Deploy to Production

**Deploy production via GitHub Actions:**
```bash
git checkout main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

**Deploy production manually:**
```bash
ssh root@your-production-server

# Clone repo
git clone https://github.com/your-username/dailyearn-ai.git
cd dailyearn-ai

# Create .env.production (copy from secure storage)
# Deploy
make prod
```

## 🔧 Configuration Files

**Structure:**
```
/docker-compose.yml              # Base services
/docker-compose.override.yml      # Development override
/docker-compose.staging.yml       # Staging configuration
/docker-compose.prod.yml          # Production configuration

/backend/Dockerfile              # Backend multi-stage build
/frontend/Dockerfile            # Frontend multi-stage build
/Dockerfile.nginx              # Nginx container

/nginx/conf.staging.dailyearnai.com   # Staging Nginx config
/nginx/conf.production.dailyearnai.com # Production Nginx config
/nginx/snippets/               # Reusable Nginx snippets

/.env.staging.sample            # Staging env template
/.env.production.sample         # Production env template

/.github/workflows/
  - ci.yml                      # Build & test on PR
  - deploy-staging.yml          # Auto-deploy staging
  - deploy-production.yml       # Deploy production

/scripts/
  - deploy.sh                   # Main deployment script
  - backup.sh                   # Create backups
  - rollback.sh                 # Rollback to backup
  - health-check.sh             # Health check endpoints

/Makefile                      # Convenience commands
```

## 🔒 Security

### SSL Certificates
- Auto-provisioned via Let's Encrypt and Certbot
- Renewed automatically
- Staging uses staging certificate to avoid rate limits

### Secrets Management
1. **Never commit `.env.production` or `.env.staging` to git**
2. Store secrets in:
   - GitHub Secrets for CI/CD
   - 1Password/Bitwarden for manual deployment
   - VPS environment variables

### Required Secrets (GitHub)
```yaml
# Repository secrets
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided
LETSENCRYPT_EMAIL: your-email@example.com

# Staging secrets
POSTGRES_DB_STAGING: dailyearn_staging
POSTGRES_USER_STAGING: postgres
POSTGRES_PASSWORD_STAGING: <secure-random-password>
REDIS_PASSWORD_STAGING: <secure-random-password>
JWT_ACCESS_SECRET_STAGING: <64-char-secret>
JWT_REFRESH_SECRET_STAGING: <64-char-secret>
GEMINI_API_KEY_STAGING: <your-api-key>
ADMIN_SECRET_STAGING: <32-char-secret>
SSH_PRIVATE_KEY_STAGING: <ssh-private-key>
DROPLET_IP_STAGING: <droplet-ip-address>
DROPLET_USER: root
SENTRY_DSN_STAGING: <sentry-dsn>

# Production secrets (different values!)
POSTGRES_DB_PROD: dailyearn_prod
POSTGRES_USER_PROD: postgres
POSTGRES_PASSWORD_PROD: <different-secure-password>
REDIS_PASSWORD_PROD: <different-secure-password>
JWT_ACCESS_SECRET_PROD: <different-64-char-secret>
JWT_REFRESH_SECRET_PROD: <different-64-char-secret>
GEMINI_API_KEY_PROD: <prod-api-key>
ADMIN_SECRET_PROD: <different-32-char-secret>
SSH_PRIVATE_KEY_PROD: <prod-ssh-key>
DROPLET_IP_PROD: <prod-droplet-ip>
SENTRY_DSN_PROD: <prod-sentry-dsn>
SLACK_WEBHOOK_URL: <optional-slack-webhook>
```

### Generating Secrets
```bash
# JWT secrets (64 chars)
openssl rand -base64 64

# Admin secret (32 chars)
openssl rand -base64 32

# Passwords
openssl rand -base64 32

# API keys
# Use provider-specific generators
```

## 🦺 GitHub Actions Workflow

### CI Pipeline (ci.yml)
Triggers: Pull requests to staging/main
Steps:
1. Checkout code
2. Install dependencies
3. Run linter (TypeScript)
4. Run tests
5. Build Docker images
6. Run security scan (Trivy)
7. Upload security report

### Staging Deploy (deploy-staging.yml)
Triggers: Push to staging branch
Steps:
1. Build & push images with `:staging` tag
2. Deploy to staging VPS via SSH
3. Health check
4. Slack notification

### Production Deploy (deploy-production.yml)
Triggers: Push to main branch (manual approval)
Steps:
1. Require manual approval (GitHub Environments)
2. Backup current deployment
3. Build & push images with `:latest` tag
4. Deploy to production VPS via SSH
5. Smoke tests
6. Verify health checks
7. Slack notification

## 📊 Monitoring & Logs

### Health Checks
```bash
# Check application health
curl https://staging.dailyearnai.com/health
curl https://staging.dailyearnai.com/api/health

# Via Makefile
make health ENVIRONMENT=staging
make health ENVIRONMENT=prod
```

### Logs
```bash
# All logs
docker-compose -f docker-compose.yml -f docker-compose.staging.yml logs -f

# Backend only
make logs-backend ENVIRONMENT=staging

# Nginx logs
make logs-nginx ENVIRONMENT=staging
```

### Monitoring
- **Sentry**: Error tracking (auto-configured from secrets)
- **Winston**: Application logs (in containers)
- **Nginx**: Access/error logs (in nginx container)

### Resource Limits
- Backend: 512MB RAM
- Frontend: static via Nginx
- PostgreSQL: 1GB RAM (prod)
- Redis: 256MB RAM
- Nginx: 128MB RAM

## 🔄 Rolling Deployment

The deployment uses rolling updates:

1. Start database & cache
2. Deploy new backend version
3. Wait for health check (~30s)
4. Deploy new frontend
5. Deploy nginx
6. Verify final health

Rollback: `make rollback ENVIRONMENT=staging BACKUP_FILE=<backup.tar.gz>`

## 🗄️ Database

### Migrations
```bash
# Run migrations
docker-compose -f docker-compose.yml -f docker-compose.staging.yml exec backend npm run db:migrate

# Via Makefile
make db-migrate ENVIRONMENT=staging
```

### Backups
```bash
# Create backup
make backup ENVIRONMENT=staging

# Or manually
./scripts/backup.sh staging

# Backups stored in ./backups/
# Automatically keep last 7 days
```

### Restore
```bash
# List backups
ls -lh backups/

# Rollback
./scripts/rollback.sh staging backups/staging_backup_20240508_120000.tar.gz
```

## 🛠️ Development

### Local Development
```bash
# Start all services
make dev

# Frontend only
npm run dev

# Backend only
cd backend && npm run dev

# Access at http://localhost:5173
```

### Testing
```bash
make test

# Or individual
cd backend && npm test
cd frontend && npm test
```

### Docker Testing
```bash
# Test docker-compose configuration
docker-compose config

# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run with test compose file
docker-compose -f docker-compose.yml -f docker-compose.test.yml up
```

## 🚨 Troubleshooting

### Containers won't start
```bash
# Check logs
make logs ENVIRONMENT=staging

# Check configuration
docker-compose -f docker-compose.yml -f docker-compose.staging.yml config

# Restart services
make staging
```

### SSL certificate issues
```bash
# Renew certificate manually
docker-compose -f docker-compose.yml -f docker-compose.staging.yml run --rm certbot

# Or via make
make certbot ENVIRONMENT=staging
```

### Database connection issues
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.yml -f docker-compose.staging.yml exec postgres pg_isready

# Connect to database
docker-compose -f docker-compose.yml -f docker-compose.staging.yml exec postgres psql -U postgres
```

### Deployment failures
Check:
1. Environment variables configured
2. Docker daemon running
3. Sufficient disk space
4. Network connectivity
5. GitHub secrets configured

## 📦 Useful Commands

```bash
# Status
make status ENVIRONMENT=staging

# Shell into backend
make staging-shell

# Clean unused resources
make clean

# Validate config
make validate-config

# Nginx test
nginx -t

# Full production deployment
make prod

# View all available commands
make help
```

## 🔗 Domain Setup

### DNS Configuration
Add to your DNS provider:

```
A     dailyearnai.com     YOUR_DROPLET_IP
A     www.dailyearnai.com YOUR_DROPLET_IP
A     staging.dailyearnai.com STAGING_DROPLET_IP (if different)
```

### IP Configuration
By default, Nginx listens on ports 80 and 443:
- HTTP (port 80): Redirects to HTTPS
- HTTPS (port 443): SSL termination

## 📚 References

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [DigitalOcean Droplets](https://docs.digitalocean.com/products/droplets/)