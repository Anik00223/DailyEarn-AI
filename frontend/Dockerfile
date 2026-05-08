# Multi-stage Dockerfile for DailyEarn AI Frontend
FROM node:20-alpine AS base

# Install dependencies
RUN apk update && apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# -----------------------------------------------------------------------------
# Development Stage
# -----------------------------------------------------------------------------
FROM base AS development

RUN npm ci --include=dev

COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001

USER frontend

EXPOSE 5173 24678

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

CMD ["dumb-init", "npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build Stage
# -----------------------------------------------------------------------------
FROM base AS build

RUN npm ci --include=dev

COPY . .

# Set build arguments
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:3001}

# Build application
RUN npm run build

# -----------------------------------------------------------------------------
# Production Stage - Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY nginx/conf.frontend /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
