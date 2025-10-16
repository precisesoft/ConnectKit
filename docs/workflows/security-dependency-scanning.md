**Security - Dependency Scanning**

**What It Does**

- This workflow helps automate checks for security - dependency scanning. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- On schedule (cron: 0 2 \* \* \*)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: Dependency Security Scan
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: dependency-scan-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install workspace dependencies
    - Run npm audit (Frontend)
    - Run npm audit (Backend)
    - Generate SBOM for dependencies
    - Check for outdated packages
    - Upload dependency scan results and SBOMs
    - Enforce security policy

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Security - Dependency Scanning" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
