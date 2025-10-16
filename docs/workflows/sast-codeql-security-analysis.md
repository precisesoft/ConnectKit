**SAST - CodeQL Security Analysis**

**What It Does**

- This workflow helps automate checks for sast - codeql security analysis. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On push (branches: main, develop)
- On pull request (branches: main)
- On schedule (cron: 30 1 \* \* 0)
- Manually from GitHub (Run workflow)

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
