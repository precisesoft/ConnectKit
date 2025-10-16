**API Testing**

**What It Does**

- This workflow helps automate checks for api testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nworkflow dispatch]
  J_postman_newman_tests[Postman/Newman API Tests]
  J_rest_assured_tests[REST Assured API Tests]
  J_api_security_tests[API Security Testing]
  J_summary[API Testing Summary]
  T --> J_postman_newman_tests
  T --> J_rest_assured_tests
  T --> J_api_security_tests
  J_postman_newman_tests --> J_summary
  J_rest_assured_tests --> J_summary
  J_api_security_tests --> J_summary
```

**Jobs & Steps**

- Job: Postman/Newman API Tests
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: newman-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install backend dependencies
    - Start backend
    - Install Newman
    - Create Postman collection
    - Run Newman tests
    - Upload Newman results
- Job: REST Assured API Tests
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: rest-assured-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install backend dependencies
    - Start backend
    - Install test dependencies
    - Create REST Assured test script
    - Run REST Assured style tests
    - Upload test results
- Job: API Security Testing
  - Runner: ubuntu-latest
  - Depends on: None
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install backend dependencies
    - Start backend
    - Run API security tests
- Job: API Testing Summary
  - Runner: ubuntu-latest
  - Depends on: Postman Newman Tests, Rest Assured Tests, Api Security Tests
  - What happens:
    - Generate report

**Step Diagrams**
**Postman/Newman API Tests — Steps**

```mermaid
flowchart TB
  S_postman_newman_tests_0[Checkout repository]
  S_postman_newman_tests_1[Setup Node.js]
  S_postman_newman_tests_0 --> S_postman_newman_tests_1
  S_postman_newman_tests_2[Install backend dependencies]
  S_postman_newman_tests_1 --> S_postman_newman_tests_2
  S_postman_newman_tests_3[Start backend]
  S_postman_newman_tests_2 --> S_postman_newman_tests_3
  S_postman_newman_tests_4[Install Newman]
  S_postman_newman_tests_3 --> S_postman_newman_tests_4
  S_postman_newman_tests_5[Create Postman collection]
  S_postman_newman_tests_4 --> S_postman_newman_tests_5
  S_postman_newman_tests_6[Run Newman tests]
  S_postman_newman_tests_5 --> S_postman_newman_tests_6
  S_postman_newman_tests_7[Upload Newman results]
  S_postman_newman_tests_6 --> S_postman_newman_tests_7
```

**REST Assured API Tests — Steps**

```mermaid
flowchart TB
  S_rest_assured_tests_0[Checkout repository]
  S_rest_assured_tests_1[Setup Node.js]
  S_rest_assured_tests_0 --> S_rest_assured_tests_1
  S_rest_assured_tests_2[Install backend dependencies]
  S_rest_assured_tests_1 --> S_rest_assured_tests_2
  S_rest_assured_tests_3[Start backend]
  S_rest_assured_tests_2 --> S_rest_assured_tests_3
  S_rest_assured_tests_4[Install test dependencies]
  S_rest_assured_tests_3 --> S_rest_assured_tests_4
  S_rest_assured_tests_5[Create REST Assured test script]
  S_rest_assured_tests_4 --> S_rest_assured_tests_5
  S_rest_assured_tests_6[Run REST Assured style tests]
  S_rest_assured_tests_5 --> S_rest_assured_tests_6
  S_rest_assured_tests_7[Upload test results]
  S_rest_assured_tests_6 --> S_rest_assured_tests_7
```

**API Security Testing — Steps**

```mermaid
flowchart TB
  S_api_security_tests_0[Checkout repository]
  S_api_security_tests_1[Setup Node.js]
  S_api_security_tests_0 --> S_api_security_tests_1
  S_api_security_tests_2[Install backend dependencies]
  S_api_security_tests_1 --> S_api_security_tests_2
  S_api_security_tests_3[Start backend]
  S_api_security_tests_2 --> S_api_security_tests_3
  S_api_security_tests_4[Run API security tests]
  S_api_security_tests_3 --> S_api_security_tests_4
```

**API Testing Summary — Steps**

```mermaid
flowchart TB
  S_summary_0[Generate report]
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "API Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
