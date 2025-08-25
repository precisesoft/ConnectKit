# Software Bill of Materials (SBOM) Implementation Guide

## Overview

ConnectKit implements comprehensive Software Bill of Materials (SBOM) generation and analysis to meet federal compliance requirements including NTIA minimum elements, Executive Order 14028, and various security frameworks.

## Features

### ✅ SBOM Generation

- **Multiple Formats**: CycloneDX JSON, SPDX JSON, Syft JSON, CSV, HTML reports
- **Container Scanning**: Docker image SBOM generation for both frontend and backend
- **Workspace Support**: Full npm workspace dependency analysis
- **Real-time Generation**: Automated generation in CI/CD pipeline

### ✅ Vulnerability Analysis

- **Multi-Database Scanning**: GitHub Advisory, NVD, OSV, VulnDB
- **Configurable Thresholds**: Severity-based failure criteria
- **Exception Management**: Vulnerability allowlists with expiration dates
- **VEX Generation**: Vulnerability Exploitability eXchange documents

### ✅ License Compliance

- **Policy-Based Checking**: Approved, prohibited, and conditional licenses
- **Federal Compliance**: Alignment with federal licensing requirements
- **Attribution Generation**: Automatic license attribution documents

### ✅ Federal Compliance

- **NTIA Minimum Elements**: All required elements included
- **Executive Order 14028**: Full compliance implementation
- **Attestation Documents**: Cryptographic attestation generation
- **Audit Trails**: Complete compliance history and reporting

## Quick Start

### Local Development

```bash
# Generate comprehensive SBOM
npm run sbom:generate

# Run vulnerability analysis
npm run sbom:check

# Full SBOM pipeline (generate + check)
npm run sbom:full

# Federal compliance check
npm run compliance:federal
```

### GitHub Actions

The SBOM pipeline runs automatically on:

- **Daily**: Scheduled compliance checks at 1 AM UTC
- **Manual**: Workflow dispatch with configurable options
- **Pull Requests**: SBOM analysis on security-sensitive changes

#### Manual Trigger Options

```yaml
# Trigger federal compliance workflow
gh workflow run compliance-federal.yml \
--ref main \
-f compliance_suite=sbom \
-f severity_threshold=medium
```

## Configuration

### Vulnerability Thresholds (`.sbom/allowlist.json`)

```json
{
  "thresholds": {
    "critical": {
      "max_allowed": 0,
      "fail_build": true
    },
    "high": {
      "max_allowed": 5,
      "fail_build": true
    },
    "medium": {
      "max_allowed": 20,
      "fail_build": false
    },
    "low": {
      "max_allowed": 50,
      "fail_build": false
    }
  }
}
```

### License Policy (`.sbom/license-policy.json`)

```json
{
  "license_policy": {
    "approved": ["MIT", "Apache-2.0", "BSD-3-Clause"],
    "prohibited": ["GPL-2.0", "GPL-3.0", "AGPL-3.0"],
    "conditionally_approved": [
      {
        "license": "LGPL-2.1",
        "condition": "Dynamic linking only"
      }
    ]
  }
}
```

### SBOM Generation Settings (`.sbom/sbom-config.json`)

```json
{
  "sbom_generation": {
    "formats": {
      "cyclonedx": { "enabled": true },
      "spdx": { "enabled": true },
      "csv": { "enabled": true },
      "html": { "enabled": true }
    },
    "scan_targets": {
      "docker_images": {
        "enabled": true,
        "images": ["connectkit-backend:latest", "connectkit-frontend:latest"]
      }
    }
  }
}
```

## Federal Compliance

### NTIA Minimum Elements ✅

All required elements are automatically included:

- ✅ **Supplier Name**: Extracted from package metadata
- ✅ **Component Name**: All components named and versioned
- ✅ **Version String**: Semantic versioning compliance
- ✅ **Other Unique Identifiers**: Package URLs and checksums
- ✅ **Dependency Relationship**: Complete dependency tree
- ✅ **Author of SBOM Data**: CI/CD pipeline attribution
- ✅ **Timestamp**: ISO 8601 generation timestamp

### Executive Order 14028 ✅

Full compliance with federal cybersecurity requirements:

- ✅ **SBOM Provision**: Machine-readable format
- ✅ **Vulnerability Disclosure**: Automated scanning
- ✅ **Software Attestation**: Cryptographic signatures
- ✅ **Secure Development**: Security controls validation

### Security Frameworks

- **NIST 800-53**: SI-2 (Flaw Remediation), SC-28 (Protection at Rest)
- **FedRAMP**: RA-5 (Vulnerability Scanning), SA-11 (Developer Security Testing)
- **FISMA**: Continuous monitoring and compliance reporting

## Output Artifacts

### Generated Files

```
sbom-output/
├── sbom-cyclonedx.json         # CycloneDX format SBOM
├── sbom-spdx.json              # SPDX format SBOM
├── sbom-syft.json              # Syft native format
├── sbom-components.csv         # Spreadsheet-friendly format
├── sbom-report.html            # Human-readable report
├── sbom-table.txt              # Text table format
├── vulnerabilities-filtered.json   # Processed vulnerabilities
├── vulnerabilities-raw.json    # Raw scan results
├── compliance-report.json      # Federal compliance assessment
├── vex-document.json          # Vulnerability exploitability exchange
└── sbom-attestation.json      # Cryptographic attestation
```

### Docker Container SBOMs

```
sbom-output/
├── sbom-backend-docker.json    # Backend container SBOM
└── sbom-frontend-docker.json   # Frontend container SBOM
```

## Vulnerability Management

### Exception Process

1. **Add Exception** to `.sbom/allowlist.json`:

```json
{
  "vulnerabilities": {
    "exceptions": [
      {
        "cve": "CVE-2024-12345",
        "reason": "Not applicable - code path not executed",
        "expires": "2025-12-31",
        "reviewer": "security-team",
        "created": "2025-01-15"
      }
    ]
  }
}
```

2. **Document Justification**: Include detailed reasoning
3. **Set Expiration**: All exceptions must have expiration dates
4. **Review Process**: Security team approval required

### Threshold Management

Adjust vulnerability thresholds based on your security posture:

```bash
# Strict mode (fail on any high/critical)
SEVERITY_THRESHOLD=high npm run sbom:check

# Permissive mode (fail only on critical)
SEVERITY_THRESHOLD=critical npm run sbom:check

# Development mode (report only)
SEVERITY_THRESHOLD=low npm run sbom:check
```

## Integration Examples

### CI/CD Pipeline

```yaml
- name: Generate SBOM
  uses: ./.github/workflows/sbom-utils.yml
  with:
    severity_threshold: medium
    fail_on_critical: true
    scan_docker_images: true
```

### Security Scanning

```bash
# Quick vulnerability check
npm run sbom:check

# Full compliance audit
npm run compliance:federal

# Generate attestation for deployment
node scripts/sbom-generator.js --attestation
```

### Development Workflow

```bash
# Before committing changes
npm run sbom:generate

# Check for new vulnerabilities
npm run sbom:check

# Review license compliance
cat sbom-output/sbom-report.html
```

## Monitoring and Alerting

### GitHub Actions Integration

The SBOM pipeline provides:

- **Step Summary**: Detailed results in GitHub Actions UI
- **Artifact Upload**: All SBOM files archived for 30 days
- **PR Comments**: Automatic vulnerability summaries on pull requests
- **Failure Notifications**: Build failures on threshold violations

### Dashboard Metrics

Key metrics tracked:

- **Total Components**: Number of dependencies tracked
- **Vulnerability Trends**: Critical/High/Medium/Low over time
- **License Compliance**: Prohibited vs approved license usage
- **SBOM Completeness**: Percentage of required elements present

## Troubleshooting

### Common Issues

#### SBOM Generation Fails

```bash
# Check tool installation
syft version
grype version

# Verify npm workspace setup
npm run build --workspaces

# Check configuration
cat .sbom/sbom-config.json
```

#### Vulnerability Scan Errors

```bash
# Update vulnerability database
grype db update

# Check network connectivity
grype --help

# Verify SBOM format
cat sbom-output/sbom-cyclonedx.json | jq .
```

#### License Compliance Failures

```bash
# Review license policy
cat .sbom/license-policy.json

# Check detected licenses
jq '.artifacts[].licenses' sbom-output/sbom-syft.json

# Update policy for new licenses
vi .sbom/license-policy.json
```

### Performance Optimization

For large projects:

```bash
# Exclude development dependencies
npm ci --omit=dev

# Limit scan scope in .sbom/sbom-config.json
{
  "scan_targets": {
    "exclude_paths": ["node_modules/@types", "coverage"]
  }
}

# Use caching in CI/CD
- uses: actions/cache@v4
  with:
    path: ~/.cache/grype
    key: grype-db-${{ hashFiles('**/package-lock.json') }}
```

## Security Considerations

### Sensitive Data Protection

- **No Secrets**: SBOM generation excludes sensitive configuration
- **Git Ignore**: Output files are git-ignored by default
- **Artifact Retention**: Limited to 30 days in CI/CD
- **Access Control**: SBOM artifacts require appropriate permissions

### Supply Chain Security

- **Tool Verification**: SBOM tools installed from official sources
- **Signature Validation**: Package integrity verified
- **Update Management**: Regular tool and database updates
- **Audit Trail**: Complete generation and analysis history

## Best Practices

### Development

1. **Regular Generation**: Run SBOM generation on every build
2. **Threshold Tuning**: Adjust vulnerability thresholds based on environment
3. **Exception Review**: Regularly review and update vulnerability exceptions
4. **License Monitoring**: Monitor for new license types in dependencies

### Operations

1. **Automated Scanning**: Daily vulnerability scans in production
2. **Compliance Reporting**: Regular compliance status reviews
3. **Incident Response**: SBOM-based vulnerability impact analysis
4. **Vendor Management**: Share SBOMs with customers and partners

### Compliance

1. **Documentation**: Maintain compliance evidence and documentation
2. **Audit Support**: SBOM artifacts support security audits
3. **Regulatory Alignment**: Regular review of compliance requirements
4. **Risk Assessment**: Use SBOM data for security risk assessment

---

For technical support or questions about SBOM implementation, contact the ConnectKit Security Team.
