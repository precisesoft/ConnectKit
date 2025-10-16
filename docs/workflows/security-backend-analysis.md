**Security - Backend Analysis**

**What It Does**

- This workflow helps automate checks for security - backend analysis. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request
- On push (branches: main)
- Manually from GitHub (Run workflow)

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
