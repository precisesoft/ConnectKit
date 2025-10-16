**Mutation Testing**

**What It Does**

- This workflow helps automate checks for mutation testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On schedule (cron: 0 5 \* \* 0)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\nschedule\nworkflow dispatch]
  J_backend_mutation_testing[Backend Mutation Testing (Stryker)]
  J_frontend_mutation_testing[Frontend Mutation Testing (Stryker)]
  J_summary[Mutation Testing Summary]
  T --> J_backend_mutation_testing
  T --> J_frontend_mutation_testing
  J_backend_mutation_testing --> J_summary
  J_frontend_mutation_testing --> J_summary
```

**Jobs & Steps**

- Job: Backend Mutation Testing (Stryker)
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: backend-mutation-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Install Stryker dependencies for backend
    - Create Stryker configuration
    - Run Stryker mutation testing
    - Generate mutation score badge
    - Upload backend mutation results
- Job: Frontend Mutation Testing (Stryker)
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: frontend-mutation-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Install Stryker dependencies for frontend
    - Create Stryker configuration
    - Run Stryker mutation testing
    - Generate mutation score badge
    - Upload frontend mutation results
- Job: Mutation Testing Summary
  - Runner: ubuntu-latest
  - Depends on: Backend Mutation Testing, Frontend Mutation Testing
  - What happens:
    - Generate summary report

**Step Diagrams**
**Backend Mutation Testing (Stryker) — Steps**

```mermaid
flowchart TB
  S_backend_mutation_testing_0[Checkout repository]
  S_backend_mutation_testing_1[Setup Node.js]
  S_backend_mutation_testing_0 --> S_backend_mutation_testing_1
  S_backend_mutation_testing_2[Install dependencies]
  S_backend_mutation_testing_1 --> S_backend_mutation_testing_2
  S_backend_mutation_testing_3[Install Stryker dependencies for backend]
  S_backend_mutation_testing_2 --> S_backend_mutation_testing_3
  S_backend_mutation_testing_4[Create Stryker configuration]
  S_backend_mutation_testing_3 --> S_backend_mutation_testing_4
  S_backend_mutation_testing_5[Run Stryker mutation testing]
  S_backend_mutation_testing_4 --> S_backend_mutation_testing_5
  S_backend_mutation_testing_6[Generate mutation score badge]
  S_backend_mutation_testing_5 --> S_backend_mutation_testing_6
  S_backend_mutation_testing_7[Upload backend mutation results]
  S_backend_mutation_testing_6 --> S_backend_mutation_testing_7
```

**Frontend Mutation Testing (Stryker) — Steps**

```mermaid
flowchart TB
  S_frontend_mutation_testing_0[Checkout repository]
  S_frontend_mutation_testing_1[Setup Node.js]
  S_frontend_mutation_testing_0 --> S_frontend_mutation_testing_1
  S_frontend_mutation_testing_2[Install dependencies]
  S_frontend_mutation_testing_1 --> S_frontend_mutation_testing_2
  S_frontend_mutation_testing_3[Install Stryker dependencies for frontend]
  S_frontend_mutation_testing_2 --> S_frontend_mutation_testing_3
  S_frontend_mutation_testing_4[Create Stryker configuration]
  S_frontend_mutation_testing_3 --> S_frontend_mutation_testing_4
  S_frontend_mutation_testing_5[Run Stryker mutation testing]
  S_frontend_mutation_testing_4 --> S_frontend_mutation_testing_5
  S_frontend_mutation_testing_6[Generate mutation score badge]
  S_frontend_mutation_testing_5 --> S_frontend_mutation_testing_6
  S_frontend_mutation_testing_7[Upload frontend mutation results]
  S_frontend_mutation_testing_6 --> S_frontend_mutation_testing_7
```

**Mutation Testing Summary — Steps**

```mermaid
flowchart TB
  S_summary_0[Generate summary report]
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Mutation Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
