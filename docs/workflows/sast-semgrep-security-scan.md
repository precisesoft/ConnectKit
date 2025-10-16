**SAST - Semgrep Security Scan**

**What It Does**

- This workflow helps automate checks for sast - semgrep security scan. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- On schedule (cron: 0 2 \* \* \*)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: Semgrep Security Analysis
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: semgrep-security-results
  - What happens:
    - Checkout code
    - Run Semgrep with comprehensive rulesets
    - Upload SARIF results to GitHub Security Dashboard
    - Upload Semgrep results as artifact

**Required Secrets**

- GITHUB_TOKEN

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "SAST - Semgrep Security Scan" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
