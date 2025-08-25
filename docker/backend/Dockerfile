# Multi-stage Dockerfile for Backend

# Stage 1: Dependencies (using workspace root)
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --workspace=backend --only=production

# Stage 2: Build (using workspace root)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Stage 3: Development (using workspace root)
FROM node:18-alpine AS development
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY backend/ ./backend/
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=backend"]

# Stage 4: Production (using workspace root)
FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs backend/package*.json ./backend/
USER nodejs
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]