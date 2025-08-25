# ConnectKit CI/CD Pipeline Documentation

## 🚀 Overview

This directory contains the complete CI/CD pipeline configuration for ConnectKit, implementing modern DevOps practices with comprehensive testing, security scanning, and automated deployment.

## 📋 Workflow Files

### 1. `ci.yml` - Main CI/CD Pipeline

**Triggers:** Push to main/develop, Pull Requests
**Purpose:** Complete testing, building, and quality assurance

#### Pipeline Stages:

1. **Security Scan** - Trivy vulnerability scanning
2. **Backend Tests** - Unit tests, linting, type checking
3. **Frontend Tests** - Unit tests, linting, type checking
4. **Build** - Application build and artifact creation
5. **Docker Build** - Container image building (push events only)
6. **E2E Tests** - End-to-end testing (pull requests only)
7. **Summary** - Pipeline results and reporting

#### Key Features:

- 🔍 Comprehensive test coverage reporting
- 🐳 Docker multi-stage builds with caching
- 🎭 Playwright E2E testing with video recordings
- 📊 Codecov integration for coverage tracking
- ⚡ Node.js dependency caching for faster builds

### 2. `deploy.yml` - Deployment Pipeline

**Triggers:** Push to main, Version tags, Manual dispatch
**Purpose:** Automated deployment to staging and production

#### Deployment Flow:

1. **Build & Push** - Docker images to registry
2. **Deploy Staging** - Automatic staging deployment
3. **Deploy Production** - Production deployment (tags/manual)
4. **Health Check** - Post-deployment verification

### 3. `ci-minimal.yml` - Basic Pipeline (DISABLED)

Lightweight validation pipeline - currently disabled in favor of the main pipeline.

### 4. Other Workflow Files:

- `accessibility.yml` - Accessibility testing with Lighthouse and WAVE
- `security.yml` - Advanced security scanning (currently disabled)
- `performance.yml` - Performance testing (currently disabled)
- `nightly.yml` - Nightly comprehensive testing
- `compliance-federal.yml` - Federal compliance checking

## 🔧 Configuration Requirements

### GitHub Secrets

The following secrets need to be configured in your GitHub repository:

#### Required for CI:

- `CODECOV_TOKEN` - Codecov upload token for coverage reports

#### Required for Deployment:

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or access token

### Environment Variables

The pipeline uses the following environment variables:

- `NODE_VERSION: "18"` - Node.js version for all jobs
- `DOCKER_BUILDKIT: 1` - Enable Docker BuildKit for faster builds

## 📊 Pipeline Metrics

### Current Configuration:

- ⏱️ **Average Runtime**: ~15-20 minutes (full pipeline)
- 🧪 **Test Coverage**: Backend 80%+, Frontend 80%+
- 🔒 **Security Scanning**: Trivy filesystem scanning
- 🎭 **E2E Testing**: Playwright with video recording
- 📦 **Artifact Retention**: 7 days for test results

### Performance Optimizations:

- Node.js dependency caching
- Docker layer caching with GitHub Actions cache
- Parallel job execution
- Conditional job execution based on event type

## 🛠️ Local Development

### Running Tests Locally:

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm run test:unit

# E2E tests (requires services running)
docker-compose up -d
cd frontend && npm run test:e2e
```

### Building Docker Images:

```bash
# Build all services
docker-compose build

# Build specific service
docker build -f docker/backend/Dockerfile -t connectkit-backend ./backend
docker build -f docker/frontend/Dockerfile -t connectkit-frontend ./frontend
```

## 🔍 Troubleshooting

### Common Issues:

#### 1. Test Failures

- Check test logs in GitHub Actions
- Verify environment variables are set correctly
- Ensure database/Redis services are healthy

#### 2. Docker Build Failures

- Verify Dockerfile syntax
- Check for missing dependencies
- Review build context and file paths

#### 3. E2E Test Issues

- Check service health endpoints
- Verify environment configuration
- Review Playwright test recordings in artifacts

#### 4. Coverage Upload Failures

- Ensure `CODECOV_TOKEN` is set
- Check coverage file paths
- Verify coverage reporters are configured

### Getting Help:

1. Check pipeline logs in GitHub Actions tab
2. Review artifact uploads for detailed reports
3. Check service logs with `docker-compose logs`
4. Verify environment configuration matches `.env.example`

## 📈 Monitoring & Alerting

### Success Metrics:

- All tests passing ✅
- Coverage thresholds met 📊
- No critical security vulnerabilities 🔒
- Successful deployments 🚀

### Failure Response:

- Automatic pipeline failure on test failures
- Security scan results reported
- Artifact retention for debugging
- Comprehensive error reporting in job summaries

## 🔄 Pipeline Maintenance

### Regular Tasks:

- Update GitHub Actions versions quarterly
- Review and update security scanning rules
- Monitor pipeline performance metrics
- Update Node.js and dependency versions

### Scaling Considerations:

- Increase runner resources for larger codebases
- Implement matrix builds for multiple environments
- Add more comprehensive E2E test coverage
- Consider self-hosted runners for private repositories

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Codecov Integration](https://docs.codecov.com/docs/github-actions)

For questions or improvements to this CI/CD setup, please open an issue or submit a pull request.
