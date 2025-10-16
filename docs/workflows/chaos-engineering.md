**Chaos Engineering**

**What It Does**

- This workflow helps automate checks for chaos engineering. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On schedule (cron: 0 3 \* \* 1)
- Manually from GitHub (Run workflow)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\nschedule\nworkflow dispatch]
  J_setup_chaos_environment[Setup Chaos Environment]
  J_network_chaos[Network Chaos Testing]
  J_resource_chaos[Resource Chaos Testing]
  J_database_chaos[Database Chaos Testing]
  J_service_chaos[Service Chaos Testing]
  J_chaos_report[Chaos Engineering Report]
  T --> J_setup_chaos_environment
  J_setup_chaos_environment --> J_network_chaos
  J_setup_chaos_environment --> J_resource_chaos
  J_setup_chaos_environment --> J_database_chaos
  J_setup_chaos_environment --> J_service_chaos
  J_network_chaos --> J_chaos_report
  J_resource_chaos --> J_chaos_report
  J_database_chaos --> J_chaos_report
  J_service_chaos --> J_chaos_report
```

**Jobs & Steps**

- Job: Setup Chaos Environment
  - Runner: ubuntu-latest
  - Depends on: None
  - What happens:
    - Checkout repository
    - Setup Docker and services
    - Install chaos tools
    - Setup output
- Job: Network Chaos Testing
  - Runner: ubuntu-latest
  - Depends on: Setup Chaos Environment
  - What happens:
    - Checkout repository
    - Inject network latency
    - Inject packet loss
    - Simulate network partition
- Job: Resource Chaos Testing
  - Runner: ubuntu-latest
  - Depends on: Setup Chaos Environment
  - What happens:
    - Checkout repository
    - CPU stress test
    - Memory stress test
- Job: Database Chaos Testing
  - Runner: ubuntu-latest
  - Depends on: Setup Chaos Environment
  - What happens:
    - Checkout repository
    - Slow database queries
    - Database connection failure
- Job: Service Chaos Testing
  - Runner: ubuntu-latest
  - Depends on: Setup Chaos Environment
  - What happens:
    - Checkout repository
    - Random container kills
    - Service pause/unpause
- Job: Chaos Engineering Report
  - Runner: ubuntu-latest
  - Depends on: Network Chaos, Resource Chaos, Database Chaos, Service Chaos
  - What happens:
    - Generate chaos report
    - Cleanup

**Step Diagrams**
**Setup Chaos Environment — Steps**

```mermaid
flowchart TB
  S_setup_chaos_environment_0[Checkout repository]
  S_setup_chaos_environment_1[Setup Docker and services]
  S_setup_chaos_environment_0 --> S_setup_chaos_environment_1
  S_setup_chaos_environment_2[Install chaos tools]
  S_setup_chaos_environment_1 --> S_setup_chaos_environment_2
  S_setup_chaos_environment_3[Setup output]
  S_setup_chaos_environment_2 --> S_setup_chaos_environment_3
```

**Network Chaos Testing — Steps**

```mermaid
flowchart TB
  S_network_chaos_0[Checkout repository]
  S_network_chaos_1[Inject network latency]
  S_network_chaos_0 --> S_network_chaos_1
  S_network_chaos_2[Inject packet loss]
  S_network_chaos_1 --> S_network_chaos_2
  S_network_chaos_3[Simulate network partition]
  S_network_chaos_2 --> S_network_chaos_3
```

**Resource Chaos Testing — Steps**

```mermaid
flowchart TB
  S_resource_chaos_0[Checkout repository]
  S_resource_chaos_1[CPU stress test]
  S_resource_chaos_0 --> S_resource_chaos_1
  S_resource_chaos_2[Memory stress test]
  S_resource_chaos_1 --> S_resource_chaos_2
```

**Database Chaos Testing — Steps**

```mermaid
flowchart TB
  S_database_chaos_0[Checkout repository]
  S_database_chaos_1[Slow database queries]
  S_database_chaos_0 --> S_database_chaos_1
  S_database_chaos_2[Database connection failure]
  S_database_chaos_1 --> S_database_chaos_2
```

**Service Chaos Testing — Steps**

```mermaid
flowchart TB
  S_service_chaos_0[Checkout repository]
  S_service_chaos_1[Random container kills]
  S_service_chaos_0 --> S_service_chaos_1
  S_service_chaos_2[Service pause/unpause]
  S_service_chaos_1 --> S_service_chaos_2
```

**Chaos Engineering Report — Steps**

```mermaid
flowchart TB
  S_chaos_report_0[Generate chaos report]
  S_chaos_report_1[Cleanup]
  S_chaos_report_0 --> S_chaos_report_1
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Chaos Engineering" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
