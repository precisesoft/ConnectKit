# Phase 1 Foundation - ConnectKit Implementation Blueprint

## Overview

This document provides a comprehensive blueprint for Phase 1 Foundation implementation of ConnectKit, covering months 1-2 of the development timeline. All specifications in this document must be followed before implementation begins.

## Project Structure

### Complete Folder Hierarchy

```
ConnectKit/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── security-scan.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── contacts.controller.ts
│   │   │   │   └── health.controller.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   ├── logging.middleware.ts
│   │   │   │   ├── rate-limit.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── models/
│   │   │   │   ├── contact.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   └── audit.model.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── contact.service.ts
│   │   │   │   ├── encryption.service.ts
│   │   │   │   └── audit.service.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── contacts.routes.ts
│   │   │   │   └── health.routes.ts
│   │   │   ├── utils/
│   │   │   │   ├── database.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── crypto.ts
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── auth.config.ts
│   │   │   │   └── app.config.ts
│   │   │   ├── types/
│   │   │   │   ├── contact.types.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   └── common.types.ts
│   │   │   └── app.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   └── utils/
│   │   │   ├── integration/
│   │   │   │   ├── auth.test.ts
│   │   │   │   └── contacts.test.ts
│   │   │   ├── e2e/
│   │   │   │   └── api.test.ts
│   │   │   ├── fixtures/
│   │   │   │   ├── contacts.json
│   │   │   │   └── users.json
│   │   │   └── setup/
│   │   │       ├── test-db.ts
│   │   │       └── test-server.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   ├── .eslintrc.js
│   │   ├── .prettierrc
│   │   └── Dockerfile
│   └── web/
│       ├── public/
│       │   ├── index.html
│       │   ├── favicon.ico
│       │   └── manifest.json
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/
│       │   │   │   ├── Button/
│       │   │   │   │   ├── Button.tsx
│       │   │   │   │   ├── Button.test.tsx
│       │   │   │   │   └── Button.stories.tsx
│       │   │   │   ├── Input/
│       │   │   │   ├── Modal/
│       │   │   │   └── Layout/
│       │   │   ├── auth/
│       │   │   │   ├── LoginForm/
│       │   │   │   ├── ProtectedRoute/
│       │   │   │   └── AuthProvider/
│       │   │   └── contacts/
│       │   │       ├── ContactList/
│       │   │       ├── ContactForm/
│       │   │       └── ContactCard/
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useContacts.ts
│       │   │   └── useApi.ts
│       │   ├── services/
│       │   │   ├── api.service.ts
│       │   │   ├── auth.service.ts
│       │   │   └── storage.service.ts
│       │   ├── utils/
│       │   │   ├── validation.ts
│       │   │   ├── formatting.ts
│       │   │   └── constants.ts
│       │   ├── types/
│       │   │   ├── contact.types.ts
│       │   │   ├── auth.types.ts
│       │   │   └── api.types.ts
│       │   ├── styles/
│       │   │   ├── globals.css
│       │   │   ├── theme.ts
│       │   │   └── components/
│       │   ├── pages/
│       │   │   ├── LoginPage/
│       │   │   ├── ContactsPage/
│       │   │   └── HomePage/
│       │   └── App.tsx
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── package.json
│       ├── tsconfig.json
│       ├── jest.config.js
│       ├── vite.config.ts
│       └── Dockerfile
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── eslint-config/
│       ├── index.js
│       └── package.json
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.test.yml
│   │   └── nginx/
│   │       ├── nginx.conf
│   │       └── Dockerfile
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── environments/
│           ├── dev/
│           ├── staging/
│           └── prod/
├── scripts/
│   ├── setup.sh
│   ├── test.sh
│   ├── build.sh
│   └── deploy.sh
├── docs/
│   ├── api/
│   │   └── openapi.yaml
│   └── architecture/
│       └── diagrams/
├── .gitignore
├── .dockerignore
├── .env.example
├── package.json
├── tsconfig.json
├── turbo.json
└── README.md
```

## Technology Stack Specifications

### Frontend Stack

```json
{
  "react": "^18.2.0",
  "typescript": "^5.3.3",
  "@types/react": "^18.2.45",
  "@types/react-dom": "^18.2.18",
  "vite": "^5.0.10",
  "@mui/material": "^5.15.3",
  "@mui/icons-material": "^5.15.3",
  "@emotion/react": "^11.11.1",
  "@emotion/styled": "^11.11.0",
  "react-router-dom": "^6.20.1",
  "react-hook-form": "^7.48.2",
  "react-query": "^3.39.3",
  "axios": "^1.6.2",
  "zustand": "^4.4.7"
}
```

### Backend Stack

```json
{
  "node": ">=20.10.0",
  "express": "^4.18.2",
  "typescript": "^5.3.3",
  "pg": "^8.11.3",
  "@types/pg": "^8.10.9",
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6",
  "jsonwebtoken": "^9.0.2",
  "@types/jsonwebtoken": "^9.0.5",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "@types/cors": "^2.8.17",
  "express-rate-limit": "^7.1.5",
  "joi": "^17.11.0",
  "winston": "^3.11.0",
  "crypto": "built-in"
}
```

### Testing Stack

```json
{
  "jest": "^29.7.0",
  "@types/jest": "^29.5.8",
  "supertest": "^6.3.3",
  "@types/supertest": "^6.0.2",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/user-event": "^14.5.1",
  "cypress": "^13.6.1",
  "stryker-mutator": "^7.3.0"
}
```

### DevOps Stack

```json
{
  "docker": ">=24.0.0",
  "kubernetes": ">=1.28.0",
  "nginx": "^1.25.3",
  "postgresql": "^16.1",
  "redis": "^7.2.3"
}
```

## Development Environment Setup

### Prerequisites Checklist

- [ ] Node.js 20.10.0+ installed
- [ ] Docker Desktop 24.0.0+ installed
- [ ] PostgreSQL 16+ installed (or Docker)
- [ ] Redis 7.2+ installed (or Docker)
- [ ] Git 2.40+ installed
- [ ] VS Code with recommended extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-jest",
    "ms-vscode-remote.remote-containers",
    "GitLab.gitlab-workflow",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

### Environment Setup Script

```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up ConnectKit development environment..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="20.10.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $REQUIRED_VERSION or higher required. Current: $NODE_VERSION"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment files
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
fi

# Setup database
echo "🗄️ Setting up database..."
docker-compose up -d postgres redis
sleep 5

# Run database migrations
npm run db:migrate

# Install git hooks
echo "🪝 Installing git hooks..."
npx husky install
npx husky add .husky/pre-commit "npm run lint:staged"
npx husky add .husky/pre-push "npm run test:ci"

echo "✅ Setup complete! Run 'npm run dev' to start development"
```

## Git Workflow and Branching Strategy

### Branch Structure

```
main (protected)
├── develop (protected)
├── feature/CONN-123-implement-contact-crud
├── bugfix/CONN-456-fix-auth-validation
├── hotfix/CONN-789-security-patch
└── release/v1.0.0
```

### Git Configuration

```bash
# .gitignore
node_modules/
dist/
build/
.env
.env.local
.env.production
.DS_Store
*.log
coverage/
.nyc_output/
.vscode/settings.json
.idea/
*.tgz
*.tar.gz

# Docker
.dockerignore

# OS
Thumbs.db
```

### Commit Message Convention

```
type(scope): description

[optional body]

[optional footer]

Types:
- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting changes
- refactor: code refactoring
- test: adding tests
- chore: maintenance tasks

Examples:
feat(auth): implement JWT token validation
fix(contacts): resolve duplicate email validation
docs(api): update OpenAPI specification
```

### Branch Protection Rules

```yaml
# Required for main and develop branches
branch_protection:
  required_status_checks:
    - continuous-integration
    - security-scan
    - test-coverage
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
```

## Docker Containerization Approach

### Multi-stage API Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:20.10.0-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

### Frontend Dockerfile

```dockerfile
# apps/web/Dockerfile
FROM node:20.10.0-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.25.3-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Development Setup

```yaml
# infrastructure/docker/docker-compose.dev.yml
version: "3.8"
services:
  postgres:
    image: postgres:16.1-alpine
    environment:
      POSTGRES_DB: connectkit_dev
      POSTGRES_USER: connectkit
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7.2.3-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build:
      context: ../../apps/api
      dockerfile: Dockerfile
      target: runtime
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://connectkit:dev_password@postgres:5432/connectkit_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_jwt_secret_key
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ../../apps/api/src:/app/src
    command: npm run dev

  web:
    build:
      context: ../../apps/web
      dockerfile: Dockerfile
      target: runtime
    ports:
      - "5173:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

## Database Design and Security Configuration

### Core Database Schema

```sql
-- Database initialization script
-- infrastructure/database/init.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      tenant_id, table_name, record_id, action, old_values,
      user_id, timestamp, ip_address
    ) VALUES (
      OLD.tenant_id, TG_TABLE_NAME, OLD.id, TG_OP,
      to_jsonb(OLD), current_setting('app.current_user_id')::uuid,
      NOW(), inet_client_addr()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      tenant_id, table_name, record_id, action, old_values, new_values,
      user_id, timestamp, ip_address
    ) VALUES (
      NEW.tenant_id, TG_TABLE_NAME, NEW.id, TG_OP,
      to_jsonb(OLD), to_jsonb(NEW),
      current_setting('app.current_user_id')::uuid,
      NOW(), inet_client_addr()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      tenant_id, table_name, record_id, action, new_values,
      user_id, timestamp, ip_address
    ) VALUES (
      NEW.tenant_id, TG_TABLE_NAME, NEW.id, TG_OP,
      to_jsonb(NEW), current_setting('app.current_user_id')::uuid,
      NOW(), inet_client_addr()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    encryption_key BYTEA NOT NULL DEFAULT gen_random_bytes(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Users table with row-level security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, email)
);

-- Contacts table with field-level encryption
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email_encrypted BYTEA[],
    phone_encrypted BYTEA[],
    company VARCHAR(255),
    title VARCHAR(255),
    address_encrypted JSONB,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    last_modified_by UUID NOT NULL REFERENCES users(id),
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_search_vector ON contacts USING gin(search_vector);
CREATE INDEX idx_contacts_tags ON contacts USING gin(tags);
CREATE INDEX idx_audit_log_tenant_timestamp ON audit_log(tenant_id, timestamp);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);

-- Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY users_tenant_isolation ON users
    FOR ALL TO application_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL TO application_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY audit_log_tenant_isolation ON audit_log
    FOR ALL TO application_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create audit triggers
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER contacts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_contact_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_search_vector_trigger
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_contact_search_vector();
```

### Database Connection Configuration

```typescript
// apps/api/src/config/database.config.ts
import { Pool, PoolConfig } from "pg";

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
}

export const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "connectkit",
  username: process.env.DB_USER || "connectkit",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.NODE_ENV === "production",
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
  connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || "5000"),
});

export const createDatabasePool = (): Pool => {
  const config = getDatabaseConfig();

  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    max: config.maxConnections,
    idleTimeoutMillis: config.idleTimeoutMs,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    application_name: "ConnectKit-API",
  };

  return new Pool(poolConfig);
};
```

## Environment Configuration Management

### Environment Variables Structure

```bash
# .env.example
# Application Configuration
NODE_ENV=development
APP_PORT=3000
APP_HOST=localhost
APP_NAME=ConnectKit
APP_VERSION=1.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=connectkit
DB_USER=connectkit
DB_PASSWORD=your_secure_password
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DB_SSL_ENABLED=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# Authentication Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key

# Encryption Configuration
ENCRYPTION_KEY=your_32_byte_encryption_key_for_pii_data
ENCRYPTION_ALGORITHM=aes-256-gcm

# API Configuration
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
API_CORS_ORIGIN=http://localhost:5173

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_HOURS=24
SESSION_SECRET=your_session_secret_key

# Monitoring Configuration
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENABLED=true
METRICS_ENDPOINT=/metrics

# Development Configuration (dev only)
HOT_RELOAD=true
DEBUG_QUERIES=false
MOCK_DATA_ENABLED=false
```

### Configuration Validation

```typescript
// apps/api/src/config/app.config.ts
import Joi from "joi";

const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "staging", "production")
    .default("development"),

  APP_PORT: Joi.number().port().default(3000),

  APP_HOST: Joi.string().hostname().default("localhost"),

  JWT_SECRET: Joi.string().min(32).required(),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default("15m"),

  DB_HOST: Joi.string().required(),

  DB_PORT: Joi.number().port().default(5432),

  DB_NAME: Joi.string().required(),

  ENCRYPTION_KEY: Joi.string().length(32).required(),

  BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(15).default(12),
});

export const validateConfig = () => {
  const { error, value } = configSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
};

export const config = validateConfig();
```

## Initial CI/CD Pipeline Setup

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.10.0"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npm run format:check

      - name: TypeScript type check
        run: npm run type-check

  test:
    name: Test Suite
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16.1
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: connectkit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.10.0"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/connectkit_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/connectkit_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.10.0"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          languages: typescript, javascript

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, test, security]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.10.0"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build API
        run: npm run build:api

      - name: Build Web App
        run: npm run build:web

      - name: Build Docker images
        run: |
          docker build -t connectkit-api:${{ github.sha }} ./apps/api
          docker build -t connectkit-web:${{ github.sha }} ./apps/web

      - name: Run container security scan
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            -v $HOME/Library/Caches:/root/.cache/ \
            aquasec/trivy image connectkit-api:${{ github.sha }}
```

### Quality Gates Configuration

```json
{
  "quality_gates": {
    "test_coverage": {
      "minimum_coverage": 80,
      "coverage_types": ["line", "branch", "function"],
      "exclude_patterns": ["**/*.test.ts", "**/*.spec.ts", "**/mocks/**"]
    },
    "code_complexity": {
      "max_cyclomatic_complexity": 10,
      "max_cognitive_complexity": 15
    },
    "security": {
      "block_on_high_vulnerabilities": true,
      "block_on_medium_vulnerabilities": false,
      "dependency_scan": true
    },
    "performance": {
      "bundle_size_limit": "2MB",
      "lighthouse_score_minimum": 90
    }
  }
}
```

## Implementation Checklist

### Phase 1 Requirements Verification

#### Infrastructure Setup

- [ ] Docker containers configured and tested
- [ ] Database schema implemented with RLS
- [ ] Redis caching layer configured
- [ ] Environment configuration validated
- [ ] CI/CD pipeline functional

#### Authentication System

- [ ] JWT token implementation with refresh
- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] Account lockout after failed attempts
- [ ] Role-based access control foundation
- [ ] Multi-tenant user isolation

#### API Foundation

- [ ] Express server with TypeScript
- [ ] Request validation middleware
- [ ] Error handling middleware
- [ ] Rate limiting implementation
- [ ] Security headers (Helmet)
- [ ] CORS configuration
- [ ] Health check endpoints

#### Database Security

- [ ] Row-level security policies active
- [ ] Field-level encryption for PII
- [ ] Audit logging for all operations
- [ ] Database connection pooling
- [ ] Backup and recovery procedures

#### Testing Framework

- [ ] Unit test structure established
- [ ] Integration test framework
- [ ] Test database setup
- [ ] Mock data generators
- [ ] Coverage reporting (80%+ requirement)

#### Development Tools

- [ ] ESLint configuration with strict rules
- [ ] Prettier formatting setup
- [ ] Husky pre-commit hooks
- [ ] VS Code workspace configuration
- [ ] Development Docker compose

### Success Criteria

- [ ] All tests passing with 80%+ coverage
- [ ] Security scan passes with no high vulnerabilities
- [ ] API response times under 200ms (95th percentile)
- [ ] Database queries optimized with proper indexing
- [ ] Authentication flow complete and secure
- [ ] Development environment fully functional
- [ ] CI/CD pipeline operational
- [ ] Documentation complete and reviewed

## Next Steps

Upon completion of Phase 1 Foundation:

1. **Code Review**: Conduct comprehensive review against this blueprint
2. **Security Assessment**: Perform security testing and vulnerability assessment
3. **Performance Testing**: Load test the API and database setup
4. **Documentation Review**: Ensure all documentation is complete and accurate
5. **Phase 2 Planning**: Begin planning for Core Features implementation

This foundation phase must be 100% complete before proceeding to Phase 2 Core Features development.
