**E2E Testing**

**What It Does**

- This workflow helps automate checks for e2e testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- On schedule (cron: 0 4 \* \* \*)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nschedule\nworkflow dispatch]
  J_e2e_chromium[E2E Tests - Chromium]
  J_e2e_firefox[E2E Tests - Firefox]
  J_e2e_webkit[E2E Tests - WebKit]
  J_e2e_mobile[E2E Tests - Mobile]
  J_visual_regression[Visual Regression Testing]
  J_summary[E2E Testing Summary]
  T --> J_e2e_chromium
  T --> J_e2e_firefox
  T --> J_e2e_webkit
  T --> J_e2e_mobile
  T --> J_visual_regression
  J_e2e_chromium --> J_summary
  J_e2e_firefox --> J_summary
  J_e2e_webkit --> J_summary
  J_e2e_mobile --> J_summary
  J_visual_regression --> J_summary
```

**Jobs & Steps**

- Job: E2E Tests - Chromium
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: e2e-chromium-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Start backend
    - Start frontend
    - Run E2E tests - Chromium
    - Upload test results
    - Generate test summary
- Job: E2E Tests - Firefox
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: e2e-firefox-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Start backend
    - Start frontend
    - Run E2E tests - Firefox
    - Upload test results
- Job: E2E Tests - WebKit
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: e2e-webkit-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Start backend
    - Start frontend
    - Run E2E tests - WebKit
    - Upload test results
- Job: E2E Tests - Mobile
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: e2e-mobile-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Start backend
    - Start frontend
    - Run E2E tests - Mobile
    - Upload test results
- Job: Visual Regression Testing
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: visual-regression-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install dependencies
    - Start backend
    - Start frontend
    - Create visual regression tests
    - Run visual regression tests
    - Upload visual regression results
- Job: E2E Testing Summary
  - Runner: ubuntu-latest
  - Depends on: E2e Chromium, E2e Firefox, E2e Webkit, E2e Mobile, Visual Regression
  - What happens:
    - Generate final report

**Step Diagrams**
**E2E Tests - Chromium — Steps**

```mermaid
flowchart TB
  S_e2e_chromium_0[Checkout repository]
  S_e2e_chromium_1[Setup Node.js]
  S_e2e_chromium_0 --> S_e2e_chromium_1
  S_e2e_chromium_2[Install dependencies]
  S_e2e_chromium_1 --> S_e2e_chromium_2
  S_e2e_chromium_3[Start backend]
  S_e2e_chromium_2 --> S_e2e_chromium_3
  S_e2e_chromium_4[Start frontend]
  S_e2e_chromium_3 --> S_e2e_chromium_4
  S_e2e_chromium_5[Run E2E tests - Chromium]
  S_e2e_chromium_4 --> S_e2e_chromium_5
  S_e2e_chromium_6[Upload test results]
  S_e2e_chromium_5 --> S_e2e_chromium_6
  S_e2e_chromium_7[Generate test summary]
  S_e2e_chromium_6 --> S_e2e_chromium_7
```

**E2E Tests - Firefox — Steps**

```mermaid
flowchart TB
  S_e2e_firefox_0[Checkout repository]
  S_e2e_firefox_1[Setup Node.js]
  S_e2e_firefox_0 --> S_e2e_firefox_1
  S_e2e_firefox_2[Install dependencies]
  S_e2e_firefox_1 --> S_e2e_firefox_2
  S_e2e_firefox_3[Start backend]
  S_e2e_firefox_2 --> S_e2e_firefox_3
  S_e2e_firefox_4[Start frontend]
  S_e2e_firefox_3 --> S_e2e_firefox_4
  S_e2e_firefox_5[Run E2E tests - Firefox]
  S_e2e_firefox_4 --> S_e2e_firefox_5
  S_e2e_firefox_6[Upload test results]
  S_e2e_firefox_5 --> S_e2e_firefox_6
```

**E2E Tests - WebKit — Steps**

```mermaid
flowchart TB
  S_e2e_webkit_0[Checkout repository]
  S_e2e_webkit_1[Setup Node.js]
  S_e2e_webkit_0 --> S_e2e_webkit_1
  S_e2e_webkit_2[Install dependencies]
  S_e2e_webkit_1 --> S_e2e_webkit_2
  S_e2e_webkit_3[Start backend]
  S_e2e_webkit_2 --> S_e2e_webkit_3
  S_e2e_webkit_4[Start frontend]
  S_e2e_webkit_3 --> S_e2e_webkit_4
  S_e2e_webkit_5[Run E2E tests - WebKit]
  S_e2e_webkit_4 --> S_e2e_webkit_5
  S_e2e_webkit_6[Upload test results]
  S_e2e_webkit_5 --> S_e2e_webkit_6
```

**E2E Tests - Mobile — Steps**

```mermaid
flowchart TB
  S_e2e_mobile_0[Checkout repository]
  S_e2e_mobile_1[Setup Node.js]
  S_e2e_mobile_0 --> S_e2e_mobile_1
  S_e2e_mobile_2[Install dependencies]
  S_e2e_mobile_1 --> S_e2e_mobile_2
  S_e2e_mobile_3[Start backend]
  S_e2e_mobile_2 --> S_e2e_mobile_3
  S_e2e_mobile_4[Start frontend]
  S_e2e_mobile_3 --> S_e2e_mobile_4
  S_e2e_mobile_5[Run E2E tests - Mobile]
  S_e2e_mobile_4 --> S_e2e_mobile_5
  S_e2e_mobile_6[Upload test results]
  S_e2e_mobile_5 --> S_e2e_mobile_6
```

**Visual Regression Testing — Steps**

```mermaid
flowchart TB
  S_visual_regression_0[Checkout repository]
  S_visual_regression_1[Setup Node.js]
  S_visual_regression_0 --> S_visual_regression_1
  S_visual_regression_2[Install dependencies]
  S_visual_regression_1 --> S_visual_regression_2
  S_visual_regression_3[Start backend]
  S_visual_regression_2 --> S_visual_regression_3
  S_visual_regression_4[Start frontend]
  S_visual_regression_3 --> S_visual_regression_4
  S_visual_regression_5[Create visual regression tests]
  S_visual_regression_4 --> S_visual_regression_5
  S_visual_regression_6[Run visual regression tests]
  S_visual_regression_5 --> S_visual_regression_6
  S_visual_regression_7[Upload visual regression results]
  S_visual_regression_6 --> S_visual_regression_7
```

**E2E Testing Summary — Steps**

```mermaid
flowchart TB
  S_summary_0[Generate final report]
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "E2E Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
