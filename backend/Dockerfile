# Multi-stage Dockerfile for DailyEarn AI Backend
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk add --no-cache \
    dumb-init \
    wget \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# -----------------------------------------------------------------------------
# Development Stage
# -----------------------------------------------------------------------------
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

USER backend

# Expose port and debugger
EXPOSE 3001 9229

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start with dumb-init for proper signal handling
CMD ["dumb-init", "npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build Stage
# -----------------------------------------------------------------------------
FROM base AS build

# Install all dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run typecheck && \
    npm run build

# Run tests
RUN npm run test

# Remove dev dependencies
RUN npm prune --omit=dev

# -----------------------------------------------------------------------------
# Production Stage
# -----------------------------------------------------------------------------
FROM base AS production

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy package files
COPY package*.json ./

# Copy configuration files
COPY drizzle.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Set permissions
RUN mkdir -p /app/logs && \
    chown -R backend:nodejs /app

USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start with dumb-init
CMD ["dumb-init", "node", "dist/server.js"]
