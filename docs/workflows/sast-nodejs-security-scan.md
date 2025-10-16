**SAST - NodeJS Security Scan**

**What It Does**

- This workflow helps automate checks for sast - nodejs security scan. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nworkflow dispatch]
  J_njsscan[NodeJS Security Analysis]
  T --> J_njsscan
```

**Jobs & Steps**

- Job: NodeJS Security Analysis
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: nodejs-security-results
  - What happens:
    - Checkout code
    - Setup Python
    - Install NodeJsScan
    - Run NodeJsScan on backend
    - Run NodeJsScan on entire project
    - Display scan summary
    - Upload Backend SARIF results to GitHub Security Dashboard
    - Upload Full Project SARIF results to GitHub Security Dashboard
    - Upload NodeJsScan results as artifact

**Step Diagrams**
**NodeJS Security Analysis — Steps**

```mermaid
flowchart TB
  S_njsscan_0[Checkout code]
  S_njsscan_1[Setup Python]
  S_njsscan_0 --> S_njsscan_1
  S_njsscan_2[Install NodeJsScan]
  S_njsscan_1 --> S_njsscan_2
  S_njsscan_3[Run NodeJsScan on backend]
  S_njsscan_2 --> S_njsscan_3
  S_njsscan_4[Run NodeJsScan on entire project]
  S_njsscan_3 --> S_njsscan_4
  S_njsscan_5[Display scan summary]
  S_njsscan_4 --> S_njsscan_5
  S_njsscan_6[Upload Backend SARIF results to GitHub Security…]
  S_njsscan_5 --> S_njsscan_6
  S_njsscan_7[Upload Full Project SARIF results to GitHub Sec…]
  S_njsscan_6 --> S_njsscan_7
  S_njsscan_8[Upload NodeJsScan results as artifact]
  S_njsscan_7 --> S_njsscan_8
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "SAST - NodeJS Security Scan" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
