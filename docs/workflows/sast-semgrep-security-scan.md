**SAST - Semgrep Security Scan**

**What It Does**

- This workflow helps automate checks for sast - semgrep security scan. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- On schedule (cron: 0 2 \* \* \*)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nschedule\nworkflow dispatch]
  J_semgrep[Semgrep Security Analysis]
  T --> J_semgrep
```

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

**Step Diagrams**
**Semgrep Security Analysis — Steps**

```mermaid
flowchart TB
  S_semgrep_0[Checkout code]
  S_semgrep_1[Run Semgrep with comprehensive rulesets]
  S_semgrep_0 --> S_semgrep_1
  S_semgrep_2[Upload SARIF results to GitHub Security Dashboa…]
  S_semgrep_1 --> S_semgrep_2
  S_semgrep_3[Upload Semgrep results as artifact]
  S_semgrep_2 --> S_semgrep_3
```

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
