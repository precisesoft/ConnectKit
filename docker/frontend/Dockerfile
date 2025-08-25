# Multi-stage Dockerfile for Frontend

# Stage 1: Dependencies
FROM node:18-alpine3.20 AS dependencies
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Copy workspace configuration and package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
# Install all dependencies first (to establish workspace structure)
RUN npm ci && npm cache clean --force
# Install production dependencies for the workspace (skip prepare scripts)
RUN npm ci --workspace=frontend --omit=dev --ignore-scripts && \
    npm cache clean --force

# Stage 2: Build
FROM node:18-alpine3.20 AS build
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Copy workspace configuration and package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci && npm cache clean --force
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Stage 3: Development
FROM node:18-alpine3.20 AS development
WORKDIR /app

# Install security updates and minimal dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Copy workspace configuration and package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install && npm cache clean --force
COPY frontend/ ./frontend/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=frontend", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 4: Production with Nginx
FROM nginx:1.27-alpine AS production

# Security labels
LABEL security.scan="enabled" \
      security.non-root="true" \
      security.readonly-rootfs="false"

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S frontend && \
    adduser -S frontend -u 1001 -G frontend

# Copy built application and nginx config
COPY --from=build --chown=frontend:frontend /app/frontend/dist /usr/share/nginx/html
COPY --chown=frontend:frontend frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R frontend:frontend /usr/share/nginx/html && \
    chown -R frontend:frontend /var/cache/nginx && \
    chown -R frontend:frontend /var/log/nginx && \
    chown -R frontend:frontend /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R frontend:frontend /var/run/nginx.pid

# Switch to non-root user
USER frontend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]