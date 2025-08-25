# ConnectKit - Internal Documentation Reference

## Purpose
Enterprise-ready contact management platform built with modern web technologies and comprehensive testing frameworks. This file provides internal AI documentation reference (excluded from git).

## Architecture Overview
3-tier containerized application:
- **Frontend**: React 18 + TypeScript + Material-UI (port 3000)
- **Backend**: Node.js 18 + Express + TypeScript (port 3001) 
- **Database**: PostgreSQL 15 + Redis cache
- **Infrastructure**: Docker Compose orchestration

## Key Directories Summary

### `/backend/` - API Server
Layered Node.js/Express architecture with Controllers → Services → Repositories → Models pattern.
Contains authentication, contact management, middleware, and comprehensive testing suite.

### `/frontend/` - React Application  
Modern React SPA with component-based architecture, state management, and Material-UI design system.
Includes pages, components, hooks, and E2E testing.

### `/database/` - Data Layer
PostgreSQL schema definitions, migrations, and database initialization scripts.
Supports contact management with audit trails and user authentication.

### `/docker/` - Containerization
Multi-stage Dockerfiles and container configurations for development and production environments.

### `/docs/` - Documentation Hub
Comprehensive project documentation including architecture specs, API docs, testing guides, and security checklists.

### `/scripts/` - Development Utilities
Cross-platform scripts for startup, database operations, testing automation, and API testing.

## Technology Stack
- **Backend**: Node.js 18, Express, TypeScript, PostgreSQL, Redis, JWT
- **Frontend**: React 18, TypeScript, Material-UI, Zustand, React Query, Vite
- **Testing**: Jest, Vitest, Playwright
- **DevOps**: Docker, GitHub Actions, ESLint, Prettier

## Key Features
- Enterprise authentication with JWT and refresh tokens
- Comprehensive contact management with CRUD operations
- Advanced search, filtering, and bulk operations
- Import/export functionality (CSV, JSON, Excel, vCard)
- Duplicate detection and contact merging
- Role-based access control and audit logging
- Real-time statistics and analytics

## Security Implementation
- Field-level encryption for PII data
- JWT authentication with refresh token rotation
- Rate limiting and middleware security stack
- SQL injection prevention with parameterized queries
- XSS protection and security headers
- Comprehensive audit trails

## Development Status
Phase 1 (Foundation) completed with robust testing framework, security measures, and containerized infrastructure ready for active development.