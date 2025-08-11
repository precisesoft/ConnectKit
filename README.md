# ConnectKit 🚀

[![CI/CD Pipeline](https://github.com/precisesoft/ConnectKit/actions/workflows/ci.yml/badge.svg)](https://github.com/precisesoft/ConnectKit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/precisesoft/ConnectKit/branch/main/graph/badge.svg)](https://codecov.io/gh/precisesoft/ConnectKit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enterprise-ready contact management platform built with modern web technologies and best practices.

## 🌟 Features

- **Secure Authentication**: JWT-based auth with refresh tokens and MFA support
- **Contact Management**: Full CRUD operations with advanced search and filtering
- **Enterprise Security**: Field-level encryption, audit logging, and RBAC
- **High Performance**: Redis caching, database indexing, and optimized queries
- **Modern UI**: Responsive React interface with Material-UI components
- **API Documentation**: OpenAPI 3.0 specification with interactive docs
- **Comprehensive Testing**: 80%+ code coverage with unit, integration, and E2E tests
- **DevOps Ready**: Docker containerization with CI/CD pipeline

## 🛠️ Tech Stack

### Backend
- **Node.js 18** with **Express.js** and **TypeScript**
- **PostgreSQL 15** with encryption and RLS
- **Redis** for caching and session management
- **JWT** authentication with refresh tokens
- **Joi** and **Zod** for validation

### Frontend
- **React 18** with **TypeScript**
- **Material-UI** for components
- **React Query** for data fetching
- **Zustand** for state management
- **Vite** for build tooling

### DevOps
- **Docker** and **Docker Compose**
- **GitHub Actions** for CI/CD
- **Jest** and **Vitest** for testing
- **ESLint** and **Prettier** for code quality

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/precisesoft/ConnectKit.git
cd ConnectKit
```

2. **Copy environment configuration**
```bash
cp .env.example .env
```

3. **Start with Docker Compose**
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Documentation: http://localhost:3001/api-docs

### Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start development servers**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

## 📁 Project Structure

```
ConnectKit/
├── backend/               # Backend API application
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Data models
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utility functions
│   │   └── validators/   # Input validation
│   └── tests/            # Backend tests
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   ├── styles/       # Global styles
│   │   └── utils/        # Utility functions
│   └── tests/            # Frontend tests
├── database/             # Database scripts
├── docker/               # Docker configurations
└── docs/                 # Documentation
```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test coverage
```bash
npm test -- --coverage
```

## 📚 Documentation

- [Product Requirements Document](./PRD-CONNECTKIT.md)
- [Best Practices Guide](./BEST-PRACTICES-GUIDE.md)
- [TDD Implementation Guide](./TDD-IMPLEMENTATION-GUIDE.md)
- [Security Recommendations](./SECURITY-RECOMMENDATIONS.md)
- [DevOps Automation Guide](./DEVOPS-AUTOMATION-RECOMMENDATIONS.md)
- [Phase 1 Foundation](./PHASE-1-FOUNDATION.md)
- [Code Review Checklist](./CODE-REVIEW-CHECKLIST.md)
- [Execution Todo List](./EXECUTION-TODO.md)

## 🔒 Security

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: Field-level encryption for PII data
- **Audit Logging**: Comprehensive audit trail
- **Rate Limiting**: API rate limiting per user/IP
- **Input Validation**: Strict input validation and sanitization
- **SQL Injection**: Parameterized queries and ORM
- **XSS Protection**: Content Security Policy headers

## 🚢 Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

See [.env.example](./.env.example) for all configuration options.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TDD practices - write tests first
4. Ensure 80%+ test coverage
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please read our [Code Review Checklist](./CODE-REVIEW-CHECKLIST.md) before submitting PRs.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development**: Node.js/TypeScript team
- **Frontend Development**: React/TypeScript team
- **DevOps**: Infrastructure and automation team
- **Security**: Security and compliance team

## 📞 Support

For support, email support@connectkit.com or open an issue in this repository.

## 🎯 Roadmap

- [x] Phase 1: Foundation and Infrastructure
- [ ] Phase 2: Backend API Development
- [ ] Phase 3: Frontend Application
- [ ] Phase 4: Security Hardening
- [ ] Phase 5: Testing Implementation
- [ ] Phase 6: DevOps Automation
- [ ] Phase 7: Monitoring & Observability
- [ ] Phase 8: Documentation & Deployment

---

Built with ❤️ using Test-Driven Development and Enterprise Best Practices