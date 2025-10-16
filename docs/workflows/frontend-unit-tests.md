**Frontend Unit Tests**

**What It Does**

- This workflow helps automate checks for frontend unit tests. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: Frontend Tests (Node ${{ matrix.node-version }})
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: frontend-test-results-node-${{ matrix.node-version }}
  - What happens:
    - Checkout repository
    - Setup Node.js ${{ matrix.node-version }}
    - Cache node_modules
    - Install workspace dependencies
    - Run TypeScript type checking
    - Run ESLint
    - Build application
    - Run unit tests with coverage
    - Generate coverage summary
    - Upload test results as artifacts
    - Comment PR with coverage
    - Verify build artifacts

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Frontend Unit Tests" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
