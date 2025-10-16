**Backend Unit Tests**

**What It Does**

- This workflow helps automate checks for backend unit tests. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: Backend Tests (Node ${{ matrix.node-version }})
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: backend-test-results-node-${{ matrix.node-version }}
  - What happens:
    - Checkout repository
    - Setup Node.js ${{ matrix.node-version }}
    - Install backend dependencies
    - Wait for services to be ready
    - Setup test database
    - Run TypeScript type checking
    - Run unit tests
    - Run integration tests
    - Generate coverage summary
    - Upload test results as artifacts
    - Comment PR with coverage
    - Enforce coverage threshold

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Backend Unit Tests" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
