**Security - SBOM Generation**

**What It Does**

- This workflow helps automate checks for security - sbom generation. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- On pull request (branches: main, develop)
- On push (branches: main)
- On release
- On schedule (cron: 0 2 \* \* 1)
- Manually from GitHub (Run workflow)

**Jobs & Steps**

- Job: Generate Source Code SBOM
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: sbom-source-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Setup Node.js
    - Install Syft
    - Check Node version for cdxgen
    - Generate Frontend SBOM with Syft
    - Generate Backend SBOM with Syft
    - Install cdxgen (if compatible)
    - Generate CycloneDX SBOM with cdxgen
    - Alternative CycloneDX generation with npm
    - Generate npm dependency tree
    - Analyze licenses
    - Generate SBOM summary
    - Upload source SBOMs
- Job: Generate Container SBOM
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: sbom-container-${{ matrix.service }}-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Set up Docker Buildx
    - Build Docker image (${{ matrix.service }})
    - Install Syft
    - Generate container SBOM with Syft
    - Generate container layer analysis
    - Upload container SBOMs
- Job: Scan SBOMs for Vulnerabilities
  - Runner: ubuntu-latest
  - Depends on: Sbom Source, Sbom Containers
  - Artifacts: sbom-vulnerabilities-${{ github.run_number }}
  - What happens:
    - Download all SBOMs
    - Install Grype
    - Scan source SBOMs with Grype
    - Generate vulnerability summary
    - Upload vulnerability scan results
- Job: Generate SBOM Attestation
  - Runner: ubuntu-latest
  - Depends on: Sbom Source
  - Artifacts: sbom-attestation-${{ github.run_number }}
  - What happens:
    - Checkout repository
    - Download source SBOMs
    - Generate SBOM attestation
    - Upload attestation
- Job: Publish SBOMs
  - Runner: ubuntu-latest
  - Depends on: Sbom Source, Sbom Containers, Sbom Vulnerability Scan
  - What happens:
    - Download all SBOMs
    - Create SBOM archive
    - Upload SBOMs to release

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Security - SBOM Generation" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
