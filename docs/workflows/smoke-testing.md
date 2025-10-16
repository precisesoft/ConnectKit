**Smoke Testing**

**What It Does**

- This workflow helps automate checks for smoke testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On push (branches: main)
- On deployment
- Manually from GitHub (Run workflow)
- On workflow_run

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npush\ndeployment\nworkflow dispatch\nworkflow run]
  J_smoke_tests[Critical Path Smoke Tests]
  T --> J_smoke_tests
```

**Jobs & Steps**

- Job: Critical Path Smoke Tests
  - Runner: ubuntu-latest
  - Depends on: None
  - What happens:
    - Checkout repository
    - Start services
    - Health check smoke test
    - Critical API endpoints smoke test
    - Frontend smoke test
    - Response time check
    - Generate smoke test summary
    - Cleanup

**Step Diagrams**
**Critical Path Smoke Tests — Steps**

```mermaid
flowchart TB
  S_smoke_tests_0[Checkout repository]
  S_smoke_tests_1[Start services]
  S_smoke_tests_0 --> S_smoke_tests_1
  S_smoke_tests_2[Health check smoke test]
  S_smoke_tests_1 --> S_smoke_tests_2
  S_smoke_tests_3[Critical API endpoints smoke test]
  S_smoke_tests_2 --> S_smoke_tests_3
  S_smoke_tests_4[Frontend smoke test]
  S_smoke_tests_3 --> S_smoke_tests_4
  S_smoke_tests_5[Response time check]
  S_smoke_tests_4 --> S_smoke_tests_5
  S_smoke_tests_6[Generate smoke test summary]
  S_smoke_tests_5 --> S_smoke_tests_6
  S_smoke_tests_7[Cleanup]
  S_smoke_tests_6 --> S_smoke_tests_7
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Smoke Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
