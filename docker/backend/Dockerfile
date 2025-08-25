# Multi-stage Dockerfile for Backend

# Stage 1: Dependencies (using workspace root)
FROM node:18-alpine3.19 AS dependencies
WORKDIR /app

# Install security updates and remove unnecessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

COPY package*.json ./
RUN npm ci --workspace=backend --only=production && \
    npm cache clean --force

# Stage 2: Build (using workspace root)  
FROM node:18-alpine3.19 AS build
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Stage 3: Development (using workspace root)
FROM node:18-alpine3.19 AS development
WORKDIR /app

# Install security updates and minimal dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

COPY package*.json ./
RUN npm install && npm cache clean --force
COPY backend/ ./backend/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=backend"]

# Stage 4: Production (using workspace root)
FROM node:18-alpine3.19 AS production

# Security labels
LABEL security.scan="enabled" \
      security.non-root="true" \
      security.readonly-rootfs="false"

WORKDIR /app

# Install security updates and minimal dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/* && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy dependencies and built application
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs backend/package*.json ./backend/

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/index.js"]