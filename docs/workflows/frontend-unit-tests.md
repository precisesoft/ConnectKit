**Frontend Unit Tests**

**What It Does**

- This workflow helps automate checks for frontend unit tests. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nworkflow dispatch]
  J_test[Frontend Tests (Node ${{ matrix.node-version }})]
  T --> J_test
```

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

**Step Diagrams**
**Frontend Tests (Node ${{ matrix.node-version }}) — Steps**

```mermaid
flowchart TB
  S_test_0[Checkout repository]
  S_test_1[Setup Node.js ${{ matrix.node-version }}]
  S_test_0 --> S_test_1
  S_test_2[Cache node_modules]
  S_test_1 --> S_test_2
  S_test_3[Install workspace dependencies]
  S_test_2 --> S_test_3
  S_test_4[Run TypeScript type checking]
  S_test_3 --> S_test_4
  S_test_5[Run ESLint]
  S_test_4 --> S_test_5
  S_test_6[Build application]
  S_test_5 --> S_test_6
  S_test_7[Run unit tests with coverage]
  S_test_6 --> S_test_7
  S_test_8[Generate coverage summary]
  S_test_7 --> S_test_8
  S_test_9[Upload test results as artifacts]
  S_test_8 --> S_test_9
  S_test_10[Comment PR with coverage]
  S_test_9 --> S_test_10
  S_test_11[Verify build artifacts]
  S_test_10 --> S_test_11
```

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
