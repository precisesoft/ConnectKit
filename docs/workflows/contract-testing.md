**Contract Testing**

**What It Does**

- This workflow helps automate checks for contract testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\npush\nworkflow dispatch]
  J_consumer_tests[Consumer Contract Tests (Frontend)]
  J_provider_verification[Provider Contract Verification (Backend)]
  J_pact_broker_publish[Publish to Pact Broker]
  T --> J_consumer_tests
  J_consumer_tests --> J_provider_verification
  J_consumer_tests --> J_pact_broker_publish
  J_provider_verification --> J_pact_broker_publish
```

**Jobs & Steps**

- Job: Consumer Contract Tests (Frontend)
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: pact-contracts-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install Pact dependencies
    - Create consumer contract tests
    - Run consumer contract tests
    - Upload Pact contracts
- Job: Provider Contract Verification (Backend)
  - Runner: ubuntu-latest
  - Depends on: Consumer Tests
  - Artifacts: pact-verification-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Download Pact contracts
    - Install Pact verifier dependencies
    - Create provider verification tests
    - Start backend service
    - Run provider verification
    - Upload verification results
- Job: Publish to Pact Broker
  - Runner: ubuntu-latest
  - Depends on: Consumer Tests, Provider Verification
  - What happens:
    - Checkout repository
    - Download Pact contracts
    - Publish contracts to Pact Broker

**Step Diagrams**
**Consumer Contract Tests (Frontend) — Steps**

```mermaid
flowchart TB
  S_consumer_tests_0[Checkout repository]
  S_consumer_tests_1[Setup Node.js]
  S_consumer_tests_0 --> S_consumer_tests_1
  S_consumer_tests_2[Install Pact dependencies]
  S_consumer_tests_1 --> S_consumer_tests_2
  S_consumer_tests_3[Create consumer contract tests]
  S_consumer_tests_2 --> S_consumer_tests_3
  S_consumer_tests_4[Run consumer contract tests]
  S_consumer_tests_3 --> S_consumer_tests_4
  S_consumer_tests_5[Upload Pact contracts]
  S_consumer_tests_4 --> S_consumer_tests_5
```

**Provider Contract Verification (Backend) — Steps**

```mermaid
flowchart TB
  S_provider_verification_0[Checkout repository]
  S_provider_verification_1[Setup Node.js]
  S_provider_verification_0 --> S_provider_verification_1
  S_provider_verification_2[Download Pact contracts]
  S_provider_verification_1 --> S_provider_verification_2
  S_provider_verification_3[Install Pact verifier dependencies]
  S_provider_verification_2 --> S_provider_verification_3
  S_provider_verification_4[Create provider verification tests]
  S_provider_verification_3 --> S_provider_verification_4
  S_provider_verification_5[Start backend service]
  S_provider_verification_4 --> S_provider_verification_5
  S_provider_verification_6[Run provider verification]
  S_provider_verification_5 --> S_provider_verification_6
  S_provider_verification_7[Upload verification results]
  S_provider_verification_6 --> S_provider_verification_7
```

**Publish to Pact Broker — Steps**

```mermaid
flowchart TB
  S_pact_broker_publish_0[Checkout repository]
  S_pact_broker_publish_1[Download Pact contracts]
  S_pact_broker_publish_0 --> S_pact_broker_publish_1
  S_pact_broker_publish_2[Publish contracts to Pact Broker]
  S_pact_broker_publish_1 --> S_pact_broker_publish_2
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Contract Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
