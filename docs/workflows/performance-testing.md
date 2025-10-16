**Performance Testing**

**What It Does**

- This workflow helps automate checks for performance testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On schedule (cron: 0 2 \* \* \*)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\npull request\nschedule\nworkflow dispatch]
  J_setup[Setup Test Environment]
  J_k6_load_testing[K6 Load Testing]
  J_k6_stress_testing[K6 Stress Testing]
  J_k6_spike_testing[K6 Spike Testing]
  J_artillery_testing[Artillery Performance Testing]
  J_cleanup[Cleanup Test Environment]
  T --> J_setup
  J_setup --> J_k6_load_testing
  J_setup --> J_k6_stress_testing
  J_setup --> J_k6_spike_testing
  J_setup --> J_artillery_testing
  J_k6_load_testing --> J_cleanup
  J_k6_stress_testing --> J_cleanup
  J_k6_spike_testing --> J_cleanup
  J_artillery_testing --> J_cleanup
```

**Jobs & Steps**

- Job: Setup Test Environment
  - Runner: ubuntu-latest
  - Depends on: None
  - What happens:
    - Checkout repository
    - Setup Docker Buildx
    - Start application stack
    - Set API URL
- Job: K6 Load Testing
  - Runner: ubuntu-latest
  - Depends on: Setup
  - Artifacts: k6-load-test-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Create K6 load test script
    - Run K6 load test
    - Upload load test results
    - Parse and display results
- Job: K6 Stress Testing
  - Runner: ubuntu-latest
  - Depends on: Setup
  - Artifacts: k6-stress-test-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Create K6 stress test script
    - Run K6 stress test
    - Upload stress test results
- Job: K6 Spike Testing
  - Runner: ubuntu-latest
  - Depends on: Setup
  - Artifacts: k6-spike-test-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Create K6 spike test script
    - Run K6 spike test
    - Upload spike test results
- Job: Artillery Performance Testing
  - Runner: ubuntu-latest
  - Depends on: Setup
  - Artifacts: artillery-results-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install Artillery
    - Create Artillery test config
    - Run Artillery test
    - Generate Artillery HTML report
    - Upload Artillery results
- Job: Cleanup Test Environment
  - Runner: ubuntu-latest
  - Depends on: K6 Load Testing, K6 Stress Testing, K6 Spike Testing, Artillery Testing
  - What happens:
    - Checkout repository
    - Stop application stack
    - Generate final report

**Step Diagrams**
**Setup Test Environment — Steps**

```mermaid
flowchart TB
  S_setup_0[Checkout repository]
  S_setup_1[Setup Docker Buildx]
  S_setup_0 --> S_setup_1
  S_setup_2[Start application stack]
  S_setup_1 --> S_setup_2
  S_setup_3[Set API URL]
  S_setup_2 --> S_setup_3
```

**K6 Load Testing — Steps**

```mermaid
flowchart TB
  S_k6_load_testing_0[Checkout repository]
  S_k6_load_testing_1[Create K6 load test script]
  S_k6_load_testing_0 --> S_k6_load_testing_1
  S_k6_load_testing_2[Run K6 load test]
  S_k6_load_testing_1 --> S_k6_load_testing_2
  S_k6_load_testing_3[Upload load test results]
  S_k6_load_testing_2 --> S_k6_load_testing_3
  S_k6_load_testing_4[Parse and display results]
  S_k6_load_testing_3 --> S_k6_load_testing_4
```

**K6 Stress Testing — Steps**

```mermaid
flowchart TB
  S_k6_stress_testing_0[Checkout repository]
  S_k6_stress_testing_1[Create K6 stress test script]
  S_k6_stress_testing_0 --> S_k6_stress_testing_1
  S_k6_stress_testing_2[Run K6 stress test]
  S_k6_stress_testing_1 --> S_k6_stress_testing_2
  S_k6_stress_testing_3[Upload stress test results]
  S_k6_stress_testing_2 --> S_k6_stress_testing_3
```

**K6 Spike Testing — Steps**

```mermaid
flowchart TB
  S_k6_spike_testing_0[Checkout repository]
  S_k6_spike_testing_1[Create K6 spike test script]
  S_k6_spike_testing_0 --> S_k6_spike_testing_1
  S_k6_spike_testing_2[Run K6 spike test]
  S_k6_spike_testing_1 --> S_k6_spike_testing_2
  S_k6_spike_testing_3[Upload spike test results]
  S_k6_spike_testing_2 --> S_k6_spike_testing_3
```

**Artillery Performance Testing — Steps**

```mermaid
flowchart TB
  S_artillery_testing_0[Checkout repository]
  S_artillery_testing_1[Setup Node.js]
  S_artillery_testing_0 --> S_artillery_testing_1
  S_artillery_testing_2[Install Artillery]
  S_artillery_testing_1 --> S_artillery_testing_2
  S_artillery_testing_3[Create Artillery test config]
  S_artillery_testing_2 --> S_artillery_testing_3
  S_artillery_testing_4[Run Artillery test]
  S_artillery_testing_3 --> S_artillery_testing_4
  S_artillery_testing_5[Generate Artillery HTML report]
  S_artillery_testing_4 --> S_artillery_testing_5
  S_artillery_testing_6[Upload Artillery results]
  S_artillery_testing_5 --> S_artillery_testing_6
```

**Cleanup Test Environment — Steps**

```mermaid
flowchart TB
  S_cleanup_0[Checkout repository]
  S_cleanup_1[Stop application stack]
  S_cleanup_0 --> S_cleanup_1
  S_cleanup_2[Generate final report]
  S_cleanup_1 --> S_cleanup_2
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Performance Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
