**Security - Consolidated Report**

**What It Does**

- This workflow helps automate checks for security - consolidated report. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On workflow_run
- On schedule (cron: 0 6 \* \* 1)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\nworkflow run\nschedule\nworkflow dispatch]
  J_security_report[Security Report Consolidation]
  T --> J_security_report
```

**Jobs & Steps**

- Job: Security Report Consolidation
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: security-report-consolidated-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup report environment
    - Download recent artifacts
    - Analyze dependency scan results
    - Analyze container security results
    - Analyze application security results
    - Analyze SBOM results
    - Check existing SAST results
    - Generate security scorecard
    - Generate recommendations
    - Generate compliance checklist
    - Create summary for GitHub
    - Upload security report
    - Create security issues if critical vulnerabilities found

**Step Diagrams**
**Security Report Consolidation — Steps**

```mermaid
flowchart TB
  S_security_report_0[Checkout repository]
  S_security_report_1[Setup report environment]
  S_security_report_0 --> S_security_report_1
  S_security_report_2[Download recent artifacts]
  S_security_report_1 --> S_security_report_2
  S_security_report_3[Analyze dependency scan results]
  S_security_report_2 --> S_security_report_3
  S_security_report_4[Analyze container security results]
  S_security_report_3 --> S_security_report_4
  S_security_report_5[Analyze application security results]
  S_security_report_4 --> S_security_report_5
  S_security_report_6[Analyze SBOM results]
  S_security_report_5 --> S_security_report_6
  S_security_report_7[Check existing SAST results]
  S_security_report_6 --> S_security_report_7
  S_security_report_8[Generate security scorecard]
  S_security_report_7 --> S_security_report_8
  S_security_report_9[Generate recommendations]
  S_security_report_8 --> S_security_report_9
  S_security_report_10[Generate compliance checklist]
  S_security_report_9 --> S_security_report_10
  S_security_report_11[Create summary for GitHub]
  S_security_report_10 --> S_security_report_11
  S_security_report_12[Upload security report]
  S_security_report_11 --> S_security_report_12
  S_security_report_13[Create security issues if critical vulnerabilit…]
  S_security_report_12 --> S_security_report_13
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Security - Consolidated Report" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
