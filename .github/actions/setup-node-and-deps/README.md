# Setup Node.js and Dependencies Action

A composite action that provides common Node.js and npm setup functionality with intelligent caching.

## Usage

```yaml
- name: Setup Node.js and dependencies
  uses: ./.github/actions/setup-node-and-deps
  with:
    node-version: "18"
    install-root: "true"
    install-backend: "true"
    install-frontend: "true"
    cache-key-suffix: "security-scan"
```

## Inputs

| Input              | Description                     | Required | Default |
| ------------------ | ------------------------------- | -------- | ------- |
| `node-version`     | Node.js version to use          | No       | `18`    |
| `install-root`     | Install root dependencies       | No       | `true`  |
| `install-backend`  | Install backend dependencies    | No       | `false` |
| `install-frontend` | Install frontend dependencies   | No       | `false` |
| `cache-key-suffix` | Additional suffix for cache key | No       | `''`    |

## Features

- ✅ Automatic Node.js setup with specified version
- ✅ Intelligent npm cache management
- ✅ Selective dependency installation (root, backend, frontend)
- ✅ Enhanced caching with custom suffixes for different job types
- ✅ Optimized cache keys based on package-lock.json hashes

## Examples

### Basic setup (root only)

```yaml
- uses: ./.github/actions/setup-node-and-deps
```

### Full stack setup

```yaml
- uses: ./.github/actions/setup-node-and-deps
  with:
    install-backend: "true"
    install-frontend: "true"
```

### Security scanning setup with custom cache

```yaml
- uses: ./.github/actions/setup-node-and-deps
  with:
    install-backend: "true"
    install-frontend: "true"
    cache-key-suffix: "security-tools"
```

This composite action reduces duplication across workflow jobs and provides consistent, optimized dependency management.
