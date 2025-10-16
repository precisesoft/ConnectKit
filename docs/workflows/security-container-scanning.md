**Security - Container Scanning**

**What It Does**

- This workflow helps automate checks for security - container scanning. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request
- On push (branches: main)
- On schedule (cron: 0 3 \* \* \*)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: Container Security Scan
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: container-security-${{ matrix.service }}-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Set up Docker Buildx
    - Build Docker image (${{ matrix.service }})
    - Run Trivy vulnerability scanner
    - Run Trivy scanner (Table format)
    - Install Syft and Grype
    - Generate container SBOM
    - Run Grype vulnerability scanner
    - Analyze Docker configuration
    - Check base image security
    - Generate vulnerability summary
    - Upload scan results and SBOMs

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Security - Container Scanning" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
