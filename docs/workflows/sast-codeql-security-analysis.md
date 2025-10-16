**SAST - CodeQL Security Analysis**

**What It Does**

- This workflow helps automate checks for sast - codeql security analysis. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On push (branches: main, develop)
- On pull request (branches: main)
- On schedule (cron: 30 1 \* \* 0)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npush\npull request\nschedule\nworkflow dispatch]
  J_analyze[CodeQL Analysis]
  T --> J_analyze
```

**Jobs & Steps**

- Job: CodeQL Analysis
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: codeql-results-${{ matrix.language }}
  - What happens:
    - Checkout repository
    - Initialize CodeQL
    - Setup Node.js for better JavaScript/TypeScript analysis
    - Install dependencies for better analysis
    - Autobuild
    - Perform CodeQL Analysis
    - Upload CodeQL results as artifact

**Step Diagrams**
**CodeQL Analysis — Steps**

```mermaid
flowchart TB
  S_analyze_0[Checkout repository]
  S_analyze_1[Initialize CodeQL]
  S_analyze_0 --> S_analyze_1
  S_analyze_2[Setup Node.js for better JavaScript/TypeScript …]
  S_analyze_1 --> S_analyze_2
  S_analyze_3[Install dependencies for better analysis]
  S_analyze_2 --> S_analyze_3
  S_analyze_4[Autobuild]
  S_analyze_3 --> S_analyze_4
  S_analyze_5[Perform CodeQL Analysis]
  S_analyze_4 --> S_analyze_5
  S_analyze_6[Upload CodeQL results as artifact]
  S_analyze_5 --> S_analyze_6
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "SAST - CodeQL Security Analysis" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
