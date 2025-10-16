**Security - OWASP ZAP Scan**

**What It Does**

- This workflow helps automate checks for security - owasp zap scan. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On push (branches: main)
- On schedule (cron: 0 4 \* \* 1)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: OWASP ZAP Security Test
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: owasp-zap-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Create ZAP rules configuration
    - Setup application environment
    - Start application services
    - Wait for application to be ready
    - Run OWASP ZAP Baseline Scan (Frontend)
    - Run OWASP ZAP API Scan (Backend)
    - Parse ZAP results
    - Upload ZAP results
    - Stop services

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Security - OWASP ZAP Scan" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
