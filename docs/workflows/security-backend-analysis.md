**Security - Backend Analysis**

**What It Does**

- This workflow helps automate checks for security - backend analysis. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nworkflow dispatch]
  J_backend_security[Backend Security Tests]
  T --> J_backend_security
```

**Jobs & Steps**

- Job: Backend Security Tests
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: backend-security-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Cache node_modules
    - Install dependencies
    - Run ESLint security checks
    - Check for SQL injection vulnerabilities
    - Check for hardcoded secrets
    - Check authentication security
    - Check input validation
    - Check for console statements
    - Check error handling
    - Check security middleware
    - Run security tests
    - Upload security results

**Step Diagrams**
**Backend Security Tests — Steps**

```mermaid
flowchart TB
  S_backend_security_0[Checkout repository]
  S_backend_security_1[Setup Node.js]
  S_backend_security_0 --> S_backend_security_1
  S_backend_security_2[Cache node_modules]
  S_backend_security_1 --> S_backend_security_2
  S_backend_security_3[Install dependencies]
  S_backend_security_2 --> S_backend_security_3
  S_backend_security_4[Run ESLint security checks]
  S_backend_security_3 --> S_backend_security_4
  S_backend_security_5[Check for SQL injection vulnerabilities]
  S_backend_security_4 --> S_backend_security_5
  S_backend_security_6[Check for hardcoded secrets]
  S_backend_security_5 --> S_backend_security_6
  S_backend_security_7[Check authentication security]
  S_backend_security_6 --> S_backend_security_7
  S_backend_security_8[Check input validation]
  S_backend_security_7 --> S_backend_security_8
  S_backend_security_9[Check for console statements]
  S_backend_security_8 --> S_backend_security_9
  S_backend_security_10[Check error handling]
  S_backend_security_9 --> S_backend_security_10
  S_backend_security_11[Check security middleware]
  S_backend_security_10 --> S_backend_security_11
  S_backend_security_12[Run security tests]
  S_backend_security_11 --> S_backend_security_12
  S_backend_security_13[Upload security results]
  S_backend_security_12 --> S_backend_security_13
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Security - Backend Analysis" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
