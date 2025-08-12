# ConnectKit - DevOps Automation Recommendations

## Executive Summary

This document outlines a comprehensive DevOps strategy for ConnectKit, focusing on automation, reliability, and scalability. The approach emphasizes Infrastructure as Code, continuous integration and deployment, comprehensive monitoring, and cost optimization while maintaining enterprise-grade security and compliance.

## DevOps Philosophy and Principles

### Core Principles
1. **Automation First**: Automate everything that can be automated
2. **Infrastructure as Code**: All infrastructure defined and versioned in code
3. **Immutable Infrastructure**: Replace rather than modify infrastructure
4. **Fail Fast, Recover Faster**: Quick detection and automated recovery
5. **Observability**: Comprehensive monitoring, logging, and tracing
6. **Security by Design**: Security integrated into every stage
7. **Continuous Improvement**: Regular assessment and optimization

### DevOps Maturity Model
```
Level 1: Basic Automation
├── Manual deployments with some scripting
├── Basic monitoring and alerting
└── Version control for application code

Level 2: Continuous Integration
├── Automated build and test pipelines
├── Code quality gates
└── Basic deployment automation

Level 3: Continuous Delivery
├── Automated deployment pipelines
├── Infrastructure as Code
└── Comprehensive testing strategies

Level 4: Continuous Deployment
├── Zero-downtime deployments
├── Feature flags and canary releases
└── Self-healing infrastructure

Level 5: Autonomous Operations (Target State)
├── AI-driven operations and optimization
├── Predictive scaling and healing
└── Full end-to-end automation
```

## CI/CD Pipeline Architecture

### GitHub Actions Workflow Strategy

#### Repository Structure
```
.github/
├── workflows/
│   ├── ci.yml                    # Continuous Integration
│   ├── cd-staging.yml            # Staging Deployment
│   ├── cd-production.yml         # Production Deployment
│   ├── security-scan.yml         # Security Testing
│   ├── performance-test.yml      # Performance Testing
│   ├── infrastructure.yml        # Infrastructure Changes
│   └── dependency-update.yml     # Automated Updates
├── actions/                      # Custom Actions
│   ├── setup-node/
│   ├── build-docker/
│   └── deploy-k8s/
└── templates/                    # Issue/PR Templates
```

#### Continuous Integration Pipeline
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18.x'
  DOCKER_REGISTRY: ghcr.io
  REGISTRY_USERNAME: ${{ github.actor }}

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint code
      run: |
        npm run lint
        npm run lint:style
    
    - name: Type check
      run: npm run type-check
    
    - name: Check formatting
      run: npm run prettier:check
    
    - name: Audit dependencies
      run: npm audit --audit-level=moderate
    
    - name: License check
      run: npm run license-check

  test:
    runs-on: ubuntu-latest
    needs: code-quality
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: connectkit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/connectkit_test
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/connectkit_test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        fail_ci_if_error: true

  security-scan:
    runs-on: ubuntu-latest
    needs: code-quality
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Semgrep
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/secrets
          p/owasp-top-ten
          p/nodejs
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: typescript, javascript

  build:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: |
        npm run build:frontend
        npm run build:backend
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.DOCKER_REGISTRY }}
        username: ${{ env.REGISTRY_USERNAME }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.DOCKER_REGISTRY }}/connectkit/app
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ./Dockerfile.production
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64,linux/arm64

  e2e-tests:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install Playwright
      run: |
        npm ci
        npx playwright install --with-deps
    
    - name: Start test environment
      run: |
        docker-compose -f docker-compose.test.yml up -d
        npm run wait-for-services
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

#### Continuous Deployment Pipeline
```yaml
# .github/workflows/cd-production.yml
name: Production Deployment

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'production'
        type: choice
        options:
          - staging
          - production

env:
  AWS_REGION: us-west-2
  EKS_CLUSTER_NAME: connectkit-production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'production' }}
      url: https://app.connectkit.com
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig \
          --region ${{ env.AWS_REGION }} \
          --name ${{ env.EKS_CLUSTER_NAME }}
    
    - name: Deploy to Kubernetes
      run: |
        # Update image tag in deployment manifest
        sed -i 's|IMAGE_TAG|${{ github.sha }}|g' k8s/production/deployment.yaml
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/production/
        
        # Wait for rollout to complete
        kubectl rollout status deployment/connectkit-app -n production --timeout=600s
    
    - name: Run smoke tests
      run: |
        # Wait for service to be ready
        kubectl wait --for=condition=ready pod -l app=connectkit-app -n production --timeout=300s
        
        # Run smoke tests
        npm run test:smoke -- --baseURL=https://app.connectkit.com
    
    - name: Notify deployment success
      uses: 8398a7/action-slack@v3
      if: success()
      with:
        status: success
        text: 'Production deployment successful! :rocket:'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    
    - name: Rollback on failure
      if: failure()
      run: |
        kubectl rollout undo deployment/connectkit-app -n production
        kubectl rollout status deployment/connectkit-app -n production --timeout=300s
    
    - name: Notify deployment failure
      uses: 8398a7/action-slack@v3
      if: failure()
      with:
        status: failure
        text: 'Production deployment failed and was rolled back! :warning:'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Advanced Deployment Strategies

#### Blue-Green Deployment Implementation
```yaml
# k8s/blue-green/deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: connectkit-rollout
  namespace: production
spec:
  replicas: 10
  strategy:
    blueGreen:
      activeService: connectkit-active
      previewService: connectkit-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: connectkit-preview
      postPromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: connectkit-active
  selector:
    matchLabels:
      app: connectkit
  template:
    metadata:
      labels:
        app: connectkit
    spec:
      containers:
      - name: connectkit
        image: ghcr.io/connectkit/app:IMAGE_TAG
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: production
spec:
  args:
  - name: service-name
  metrics:
  - name: success-rate
    interval: 2m
    successCondition: result[0] >= 0.95
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus.monitoring:9090
        query: |
          sum(rate(http_requests_total{service="{{args.service-name}}", status!~"5.*"}[2m])) /
          sum(rate(http_requests_total{service="{{args.service-name}}"}[2m]))
```

#### Canary Deployment Configuration
```yaml
# k8s/canary/deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: connectkit-canary
  namespace: production
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: connectkit-canary
      stableService: connectkit-stable
      trafficRouting:
        nginx:
          stableIngress: connectkit-stable
          annotationPrefix: nginx.ingress.kubernetes.io
          additionalIngressAnnotations:
            canary-by-header: X-Canary-User
      steps:
      - setWeight: 5
      - pause: {duration: 2m}
      - analysis:
          templates:
          - templateName: success-rate
          args:
          - name: service-name
            value: connectkit-canary
      - setWeight: 25
      - pause: {duration: 5m}
      - analysis:
          templates:
          - templateName: success-rate
          - templateName: latency
          args:
          - name: service-name
            value: connectkit-canary
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 75
      - pause: {duration: 5m}
```

## Infrastructure as Code Strategy

### Terraform Architecture

#### Project Structure
```
terraform/
├── environments/
│   ├── development/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── outputs.tf
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   ├── eks/
│   ├── rds/
│   ├── elasticache/
│   ├── monitoring/
│   └── security/
├── global/
│   ├── s3-backend/
│   ├── iam/
│   └── route53/
└── scripts/
    ├── deploy.sh
    ├── destroy.sh
    └── plan.sh
```

#### Core Infrastructure Module
```hcl
# terraform/modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-igw"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name                              = "${var.environment}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name                             = "${var.environment}-public-${count.index + 1}"
    "kubernetes.io/role/elb"         = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  })
}

resource "aws_nat_gateway" "main" {
  count         = length(aws_subnet.public)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "nat" {
  count  = length(aws_subnet.public)
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-eip-${count.index + 1}"
  })
}
```

#### EKS Module
```hcl
# terraform/modules/eks/main.tf
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.allowed_cidr_blocks
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.vpc_resource_controller,
  ]

  tags = var.common_tags
}

resource "aws_eks_node_group" "main" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = each.key
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnet_ids

  capacity_type  = each.value.capacity_type
  instance_types = each.value.instance_types
  ami_type       = each.value.ami_type
  disk_size      = each.value.disk_size

  scaling_config {
    desired_size = each.value.desired_size
    max_size     = each.value.max_size
    min_size     = each.value.min_size
  }

  update_config {
    max_unavailable_percentage = 25
  }

  launch_template {
    id      = aws_launch_template.node_group[each.key].id
    version = aws_launch_template.node_group[each.key].latest_version
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_policy,
    aws_iam_role_policy_attachment.cni_policy,
    aws_iam_role_policy_attachment.registry_policy,
  ]

  tags = merge(var.common_tags, {
    Name = "${var.cluster_name}-${each.key}"
  })

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

# Launch template for node groups
resource "aws_launch_template" "node_group" {
  for_each = var.node_groups

  name_prefix   = "${var.cluster_name}-${each.key}-"
  image_id      = data.aws_ssm_parameter.eks_ami_release_version.value
  instance_type = each.value.instance_types[0]

  vpc_security_group_ids = [aws_security_group.node_group.id]

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    container_runtime   = "containerd"
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    bootstrap_arguments = each.value.bootstrap_arguments
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = each.value.disk_size
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ebs.arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.cluster_name}-${each.key}-node"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name = "${var.cluster_name}-${each.key}-volume"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

#### RDS Module with Security
```hcl
# terraform/modules/rds/main.tf
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-subnet-group"
  })
}

resource "aws_db_instance" "main" {
  identifier = "${var.environment}-postgres"

  # Engine configuration
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.instance_class

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn

  # Database configuration
  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  copy_tags_to_snapshot  = true
  delete_automated_backups = false

  # Performance insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Security
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.environment}-postgres-final-snapshot" : null

  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name

  # Enable logging
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-postgres"
  })

  lifecycle {
    ignore_changes = [password]
  }
}

resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.environment}-postgres-params"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = var.common_tags
}

resource "random_password" "master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.environment}/rds/master-password"
  description = "Master password for ${var.environment} RDS instance"
  kms_key_id = aws_kms_key.secrets.arn
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.master.result
    endpoint = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}
```

### GitOps with ArgoCD

#### ArgoCD Application Configuration
```yaml
# k8s/applications/connectkit-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: connectkit-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: connectkit
  source:
    repoURL: https://github.com/connectkit/k8s-manifests
    targetRevision: main
    path: applications/connectkit
    helm:
      valueFiles:
        - values.yaml
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10

---
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: connectkit
  namespace: argocd
spec:
  description: ConnectKit project
  sourceRepos:
    - 'https://github.com/connectkit/*'
    - 'https://charts.bitnami.com/bitnami'
  destinations:
    - namespace: '*'
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: rbac.authorization.k8s.io
      kind: ClusterRole
    - group: rbac.authorization.k8s.io
      kind: ClusterRoleBinding
  namespaceResourceWhitelist:
    - group: '*'
      kind: '*'
  roles:
    - name: developers
      policies:
        - p, proj:connectkit:developers, applications, get, connectkit/*, allow
        - p, proj:connectkit:developers, applications, sync, connectkit/*, allow
      groups:
        - connectkit:developers
    - name: admins
      policies:
        - p, proj:connectkit:admins, applications, *, connectkit/*, allow
        - p, proj:connectkit:admins, repositories, *, *, allow
      groups:
        - connectkit:admins
```

## Container Orchestration with Kubernetes

### Production-Ready Kubernetes Configuration

#### Deployment with Resource Management
```yaml
# k8s/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: connectkit-app
  namespace: production
  labels:
    app: connectkit
    tier: application
    version: v1
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 2
  selector:
    matchLabels:
      app: connectkit
  template:
    metadata:
      labels:
        app: connectkit
        tier: application
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "3000"
    spec:
      serviceAccountName: connectkit
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
        seccompProfile:
          type: RuntimeDefault
      
      initContainers:
      - name: migration
        image: ghcr.io/connectkit/app:IMAGE_TAG
        command: ["npm", "run", "db:migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: connectkit-secrets
              key: database-url
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
      
      containers:
      - name: connectkit
        image: ghcr.io/connectkit/app:IMAGE_TAG
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: connectkit-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: connectkit-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: connectkit-secrets
              key: jwt-secret
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        startupProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 10
        
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
        - name: cache-volume
          mountPath: /app/.cache
      
      volumes:
      - name: tmp-volume
        emptyDir: {}
      - name: cache-volume
        emptyDir: {}
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values: ["connectkit"]
              topologyKey: kubernetes.io/hostname
      
      tolerations:
      - key: "connectkit-dedicated"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: connectkit-pdb
  namespace: production
spec:
  minAvailable: 3
  selector:
    matchLabels:
      app: connectkit
```

#### Horizontal Pod Autoscaler (HPA)
```yaml
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: connectkit-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: connectkit-app
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 60
```

#### Vertical Pod Autoscaler (VPA)
```yaml
# k8s/production/vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: connectkit-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: connectkit-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: connectkit
      minAllowed:
        cpu: 100m
        memory: 256Mi
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits
```

### Service Mesh with Istio

#### Istio Configuration
```yaml
# k8s/istio/destination-rule.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: connectkit-dr
  namespace: production
spec:
  host: connectkit-service.production.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 10
        maxRetries: 5
        consecutiveGatewayErrors: 5
        interval: 30s
        baseEjectionTime: 30s
    circuitBreaker:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30

---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: connectkit-vs
  namespace: production
spec:
  hosts:
  - connectkit-service.production.svc.cluster.local
  http:
  - match:
    - headers:
        x-canary-user:
          exact: "true"
    route:
    - destination:
        host: connectkit-service.production.svc.cluster.local
        subset: canary
      weight: 100
  - route:
    - destination:
        host: connectkit-service.production.svc.cluster.local
        subset: stable
      weight: 95
    - destination:
        host: connectkit-service.production.svc.cluster.local
        subset: canary
      weight: 5
  retries:
    attempts: 3
    perTryTimeout: 10s
    retryOn: 5xx,gateway-error,connect-failure,refused-stream
  timeout: 30s
```

## Monitoring and Observability

### Prometheus and Grafana Stack

#### Prometheus Configuration
```yaml
# monitoring/prometheus/config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "rules/*.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager.monitoring.svc.cluster.local:9093
    
    scrape_configs:
    - job_name: 'kubernetes-apiservers'
      kubernetes_sd_configs:
      - role: endpoints
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        insecure_skip_verify: true
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
    
    - job_name: 'kubernetes-nodes'
      kubernetes_sd_configs:
      - role: node
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        insecure_skip_verify: true
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
    
    - job_name: 'connectkit-app'
      kubernetes_sd_configs:
      - role: endpoints
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
        action: replace
        target_label: __scheme__
        regex: (https?)
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_service_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_service_name]
        action: replace
        target_label: kubernetes_name

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  connectkit-rules.yml: |
    groups:
    - name: connectkit.rules
      rules:
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{service="connectkit", status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{service="connectkit"}[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="connectkit"}[5m])) by (le)) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s for the last 5 minutes"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total{pod=~"connectkit-.*"}[5m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"
      
      - alert: DatabaseConnectionHigh
        expr: sum(pg_stat_activity_count{datname="connectkit"}) > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Database connection count is high"
          description: "Database has {{ $value }} active connections"
```

#### Grafana Dashboards
```json
{
  "dashboard": {
    "id": null,
    "title": "ConnectKit Application Dashboard",
    "tags": ["connectkit", "application"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{service=\"connectkit\"}[5m]))",
            "legendFormat": "Total Requests/sec",
            "refId": "A"
          },
          {
            "expr": "sum(rate(http_requests_total{service=\"connectkit\", status=~\"5..\"}[5m]))",
            "legendFormat": "Error Requests/sec",
            "refId": "B"
          }
        ],
        "yAxes": [
          {
            "label": "requests/sec",
            "min": 0
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{service=\"connectkit\"}[5m])) by (le))",
            "legendFormat": "50th percentile",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"connectkit\"}[5m])) by (le))",
            "legendFormat": "95th percentile",
            "refId": "B"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service=\"connectkit\"}[5m])) by (le))",
            "legendFormat": "99th percentile",
            "refId": "C"
          }
        ],
        "yAxes": [
          {
            "label": "seconds",
            "min": 0
          }
        ]
      },
      {
        "id": 3,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(pg_stat_activity_count{datname=\"connectkit\"})",
            "legendFormat": "Active Connections",
            "refId": "A"
          },
          {
            "expr": "pg_settings_max_connections{server=\"connectkit-db\"}",
            "legendFormat": "Max Connections",
            "refId": "B"
          }
        ]
      }
    ]
  }
}
```

### Distributed Tracing with Jaeger

#### Jaeger Configuration
```yaml
# monitoring/jaeger/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.45
        env:
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
        - name: SPAN_STORAGE_TYPE
          value: elasticsearch
        - name: ES_SERVER_URLS
          value: http://elasticsearch.monitoring.svc.cluster.local:9200
        - name: ES_INDEX_PREFIX
          value: jaeger
        ports:
        - containerPort: 16686
          name: ui
        - containerPort: 14250
          name: grpc
        - containerPort: 4317
          name: otlp-grpc
        - containerPort: 4318
          name: otlp-http
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

#### OpenTelemetry Instrumentation
```typescript
// src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger.monitoring.svc.cluster.local:14268/api/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'connectkit',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  spanProcessor: new BatchSpanProcessor(jaegerExporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();

// Custom span creation example
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('connectkit');

export function traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Usage in service methods
export class ContactService {
  async createContact(contactData: ContactCreateInput): Promise<Contact> {
    return traceAsync('contact.create', async () => {
      const span = trace.getActiveSpan();
      span?.setAttributes({
        'contact.company': contactData.company,
        'contact.has_email': !!contactData.email,
      });
      
      // Business logic here
      return await this.contactRepository.create(contactData);
    });
  }
}
```

### Centralized Logging with ELK Stack

#### Elasticsearch Configuration
```yaml
# monitoring/elasticsearch/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: monitoring
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
        env:
        - name: cluster.name
          value: "connectkit-logs"
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: "elasticsearch-0.elasticsearch,elasticsearch-1.elasticsearch,elasticsearch-2.elasticsearch"
        - name: cluster.initial_master_nodes
          value: "elasticsearch-0,elasticsearch-1,elasticsearch-2"
        - name: ES_JAVA_OPTS
          value: "-Xms1g -Xmx1g"
        - name: xpack.security.enabled
          value: "false"
        - name: xpack.security.transport.ssl.enabled
          value: "false"
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "gp3"
      resources:
        requests:
          storage: 100Gi
```

#### Fluent Bit Configuration
```yaml
# monitoring/fluent-bit/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: monitoring
data:
  fluent-bit.conf: |
    [SERVICE]
        Daemon Off
        Flush 1
        Log_Level info
        Parsers_File parsers.conf
        Plugins_File plugins.conf
        HTTP_Server On
        HTTP_Listen 0.0.0.0
        HTTP_Port 2020
        Health_Check On

    [INPUT]
        Name tail
        Path /var/log/containers/*.log
        multiline.parser docker, cri
        Tag kube.*
        Mem_Buf_Limit 50MB
        Skip_Long_Lines On

    [INPUT]
        Name systemd
        Tag host.*
        Systemd_Filter _SYSTEMD_UNIT=kubelet.service
        Read_From_Tail On

    [FILTER]
        Name kubernetes
        Match kube.*
        Kube_URL https://kubernetes.default.svc:443
        Kube_CA_File /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix kube.var.log.containers.
        Merge_Log On
        Merge_Log_Key log_processed
        K8S-Logging.Parser On
        K8S-Logging.Exclude Off

    [FILTER]
        Name parser
        Match kube.*connectkit*
        Key_Name log
        Parser connectkit-json
        Reserve_Data On

    [OUTPUT]
        Name es
        Match kube.*connectkit*
        Host elasticsearch.monitoring.svc.cluster.local
        Port 9200
        Index connectkit-logs
        Type _doc
        Logstash_Format On
        Logstash_Prefix connectkit
        Logstash_DateFormat %Y.%m.%d
        Include_Tag_Key Off
        Time_Key @timestamp
        Time_Key_Format %Y-%m-%dT%H:%M:%S.%LZ

    [OUTPUT]
        Name es
        Match kube.*
        Host elasticsearch.monitoring.svc.cluster.local
        Port 9200
        Index kubernetes-logs
        Type _doc
        Logstash_Format On
        Logstash_Prefix kubernetes
        Logstash_DateFormat %Y.%m.%d

  parsers.conf: |
    [PARSER]
        Name connectkit-json
        Format json
        Time_Key timestamp
        Time_Format %Y-%m-%dT%H:%M:%S.%LZ
        Time_Keep On
```

## Cost Optimization Strategies

### Resource Optimization

#### Spot Instances and Mixed Instance Types
```hcl
# terraform/modules/eks/spot-nodes.tf
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "spot-nodes"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnet_ids

  capacity_type  = "SPOT"
  instance_types = [
    "m5.large",
    "m5.xlarge", 
    "m5a.large",
    "m5a.xlarge",
    "m4.large",
    "m4.xlarge"
  ]

  scaling_config {
    desired_size = 3
    max_size     = 20
    min_size     = 1
  }

  # Spot instance handling
  launch_template {
    id      = aws_launch_template.spot_node_group.id
    version = aws_launch_template.spot_node_group.latest_version
  }

  # Handle spot interruptions gracefully
  tags = merge(var.common_tags, {
    "k8s.io/cluster-autoscaler/node-template/label/node-type" = "spot"
    "k8s.io/cluster-autoscaler/node-template/taint/spot-instance" = "true:NoSchedule"
  })

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

resource "aws_launch_template" "spot_node_group" {
  name_prefix   = "${var.cluster_name}-spot-"
  instance_type = "m5.large"

  vpc_security_group_ids = [aws_security_group.node_group.id]

  # Spot instance interruption handling
  instance_market_options {
    market_type = "spot"
    spot_options {
      spot_instance_type             = "persistent"
      instance_interruption_behavior = "terminate"
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.cluster_name}-spot-node"
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    })
  }
}
```

#### Cluster Autoscaler Configuration
```yaml
# k8s/autoscaling/cluster-autoscaler.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '8085'
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.27.0
        name: cluster-autoscaler
        resources:
          limits:
            cpu: 100m
            memory: 300Mi
          requests:
            cpu: 100m
            memory: 300Mi
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/connectkit-production
        - --balance-similar-node-groups
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-utilization-threshold=0.5
        - --skip-nodes-with-system-pods=false
        env:
        - name: AWS_REGION
          value: us-west-2
        volumeMounts:
        - name: ssl-certs
          mountPath: /etc/ssl/certs/ca-certificates.crt
          readOnly: true
        imagePullPolicy: "Always"
      volumes:
      - name: ssl-certs
        hostPath:
          path: "/etc/ssl/certs/ca-bundle.crt"
```

### Cost Monitoring and Alerting

#### AWS Cost Anomaly Detection
```hcl
# terraform/modules/cost-monitoring/main.tf
resource "aws_ce_anomaly_detector" "service_monitor" {
  name         = "connectkit-cost-monitor"
  monitor_type = "DIMENSIONAL"

  specification = jsonencode({
    Dimension = "SERVICE"
    MatchOptions = ["EQUALS"]
    Values = ["Amazon Elastic Compute Cloud - Compute", "Amazon Relational Database Service"]
    Tags = {
      Environment = [var.environment]
      Project     = ["connectkit"]
    }
  })
}

resource "aws_ce_anomaly_subscription" "cost_alerts" {
  name      = "connectkit-cost-alerts"
  frequency = "DAILY"
  
  monitor_arn_list = [
    aws_ce_anomaly_detector.service_monitor.arn,
  ]
  
  subscriber {
    type    = "EMAIL"
    address = var.cost_alert_email
  }
  
  threshold_expression {
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = ["100"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }
}

resource "aws_budgets_budget" "monthly_budget" {
  name         = "connectkit-monthly-budget-${var.environment}"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  time_period_start = "2024-01-01_00:00"
  
  cost_filters {
    tag {
      key = "Environment"
      values = [var.environment]
    }
    tag {
      key = "Project"
      values = ["connectkit"]
    }
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.cost_alert_email]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.cost_alert_email]
  }
}
```

#### Cost Optimization Dashboard
```typescript
// scripts/cost-optimization/cost-analyzer.ts
interface CostOptimizationReport {
  recommendations: CostRecommendation[];
  currentCosts: CostBreakdown;
  potentialSavings: number;
  generatedAt: Date;
}

interface CostRecommendation {
  type: 'right_sizing' | 'spot_instances' | 'reserved_instances' | 'storage_optimization';
  resource: string;
  currentCost: number;
  projectedCost: number;
  savings: number;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  implementation: string[];
}

class CostOptimizationAnalyzer {
  async generateReport(): Promise<CostOptimizationReport> {
    const recommendations: CostRecommendation[] = [];
    
    // Analyze EC2 usage for right-sizing opportunities
    const ec2Recommendations = await this.analyzeEC2Usage();
    recommendations.push(...ec2Recommendations);
    
    // Identify spot instance opportunities
    const spotRecommendations = await this.identifySpotOpportunities();
    recommendations.push(...spotRecommendations);
    
    // Analyze storage costs
    const storageRecommendations = await this.analyzeStorageCosts();
    recommendations.push(...storageRecommendations);
    
    // Calculate Reserved Instance savings
    const riRecommendations = await this.calculateRIOpportunities();
    recommendations.push(...riRecommendations);
    
    const currentCosts = await this.getCurrentCostBreakdown();
    const potentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);
    
    return {
      recommendations: recommendations.sort((a, b) => b.savings - a.savings),
      currentCosts,
      potentialSavings,
      generatedAt: new Date()
    };
  }
  
  private async analyzeEC2Usage(): Promise<CostRecommendation[]> {
    // Analyze CloudWatch metrics for CPU/memory utilization
    const instances = await this.getRunningInstances();
    const recommendations: CostRecommendation[] = [];
    
    for (const instance of instances) {
      const utilization = await this.getInstanceUtilization(instance.instanceId);
      
      if (utilization.avgCpu < 20 && utilization.avgMemory < 30) {
        const currentInstanceType = instance.instanceType;
        const recommendedType = this.getNextSmallerInstance(currentInstanceType);
        
        if (recommendedType) {
          const savings = await this.calculateInstanceTypeSavings(currentInstanceType, recommendedType);
          
          recommendations.push({
            type: 'right_sizing',
            resource: instance.instanceId,
            currentCost: instance.monthlyCost,
            projectedCost: instance.monthlyCost - savings,
            savings,
            confidence: utilization.avgCpu < 10 ? 'high' : 'medium',
            description: `Instance ${instance.instanceId} is underutilized (${utilization.avgCpu}% CPU)`,
            implementation: [
              `Change instance type from ${currentInstanceType} to ${recommendedType}`,
              'Monitor performance after change',
              'Consider auto-scaling policies'
            ]
          });
        }
      }
    }
    
    return recommendations;
  }
}

// Usage in monitoring pipeline
const analyzer = new CostOptimizationAnalyzer();

async function generateWeeklyCostReport() {
  try {
    const report = await analyzer.generateReport();
    
    // Send report to stakeholders
    await sendCostOptimizationReport(report);
    
    // Create Jira tickets for high-confidence recommendations
    for (const recommendation of report.recommendations) {
      if (recommendation.confidence === 'high' && recommendation.savings > 100) {
        await createCostOptimizationTicket(recommendation);
      }
    }
  } catch (error) {
    console.error('Failed to generate cost report:', error);
  }
}

// Schedule weekly reports
setInterval(generateWeeklyCostReport, 7 * 24 * 60 * 60 * 1000); // Weekly
```

## Backup and Disaster Recovery

### Database Backup Strategy

#### Automated PostgreSQL Backups
```hcl
# terraform/modules/rds/backup.tf
resource "aws_db_instance" "main" {
  # ... other configuration ...
  
  # Backup configuration
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"  # UTC
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Enable automated backups
  skip_final_snapshot       = var.environment == "development"
  final_snapshot_identifier = "${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  # Point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Cross-region backup for production
  copy_tags_to_snapshot = true
}

# Cross-region backup for production
resource "aws_db_snapshot_copy" "cross_region" {
  count = var.environment == "production" ? 1 : 0
  
  source_db_snapshot_identifier = "${aws_db_instance.main.identifier}-cross-region-backup"
  target_db_snapshot_identifier = "${aws_db_instance.main.identifier}-cross-region-backup"
  source_region                 = var.source_region
  
  tags = var.common_tags
}

# Backup monitoring
resource "aws_cloudwatch_metric_alarm" "backup_failure" {
  alarm_name          = "${var.environment}-rds-backup-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors rds backup failures"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}
```

#### Application-Level Backups
```typescript
// scripts/backup/database-backup.ts
import { execSync } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

interface BackupConfiguration {
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  s3: {
    bucket: string;
    prefix: string;
    region: string;
  };
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

class DatabaseBackupService {
  private s3Client: S3Client;
  private config: BackupConfiguration;

  constructor(config: BackupConfiguration) {
    this.config = config;
    this.s3Client = new S3Client({ region: config.s3.region });
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `connectkit-backup-${timestamp}`;
    const localPath = `/tmp/${backupName}.sql`;
    const compressedPath = `/tmp/${backupName}.sql.gz`;

    try {
      // Create PostgreSQL dump
      const pgDumpCommand = [
        'pg_dump',
        `--host=${this.config.database.host}`,
        `--port=${this.config.database.port}`,
        `--username=${this.config.database.username}`,
        `--dbname=${this.config.database.database}`,
        '--format=custom',
        '--no-password',
        '--verbose',
        '--file=' + localPath
      ].join(' ');

      execSync(pgDumpCommand, {
        env: {
          ...process.env,
          PGPASSWORD: this.config.database.password
        }
      });

      // Compress the backup
      await pipeline(
        createReadStream(localPath),
        createGzip({ level: 9 }),
        createWriteStream(compressedPath)
      );

      // Upload to S3
      const s3Key = `${this.config.s3.prefix}/${backupName}.sql.gz`;
      await this.uploadToS3(compressedPath, s3Key);

      // Cleanup local files
      execSync(`rm -f ${localPath} ${compressedPath}`);

      // Clean old backups
      await this.cleanupOldBackups();

      console.log(`Backup completed successfully: ${s3Key}`);
      return s3Key;

    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  private async uploadToS3(filePath: string, key: string): Promise<void> {
    const fileStream = createReadStream(filePath);
    
    const command = new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: key,
      Body: fileStream,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA', // Infrequent access for cost optimization
      Metadata: {
        'backup-type': 'database',
        'created-at': new Date().toISOString(),
        'database': this.config.database.database
      }
    });

    await this.s3Client.send(command);
  }

  private async cleanupOldBackups(): Promise<void> {
    // Implementation to remove old backups based on retention policy
    const now = new Date();
    const cutoffDates = {
      daily: new Date(now.getTime() - this.config.retention.daily * 24 * 60 * 60 * 1000),
      weekly: new Date(now.getTime() - this.config.retention.weekly * 7 * 24 * 60 * 60 * 1000),
      monthly: new Date(now.getTime() - this.config.retention.monthly * 30 * 24 * 60 * 60 * 1000)
    };

    // Implementation would list S3 objects and delete based on age and retention policy
  }
}

// Kubernetes CronJob for automated backups
export const backupCronJob = {
  apiVersion: 'batch/v1',
  kind: 'CronJob',
  metadata: {
    name: 'database-backup',
    namespace: 'production'
  },
  spec: {
    schedule: '0 2 * * *', // Daily at 2 AM UTC
    jobTemplate: {
      spec: {
        template: {
          spec: {
            containers: [{
              name: 'backup',
              image: 'ghcr.io/connectkit/backup-tool:latest',
              env: [
                { name: 'DATABASE_URL', valueFrom: { secretKeyRef: { name: 'connectkit-secrets', key: 'database-url' } } },
                { name: 'AWS_REGION', value: 'us-west-2' },
                { name: 'S3_BUCKET', value: 'connectkit-backups' }
              ],
              resources: {
                requests: { memory: '512Mi', cpu: '250m' },
                limits: { memory: '1Gi', cpu: '500m' }
              }
            }],
            restartPolicy: 'OnFailure',
            serviceAccountName: 'backup-service-account'
          }
        }
      }
    },
    successfulJobsHistoryLimit: 3,
    failedJobsHistoryLimit: 1
  }
};
```

### Disaster Recovery Plan

#### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours for complete system recovery
- **Recovery Point Objective (RPO)**: 15 minutes maximum data loss
- **Availability Target**: 99.9% uptime (8.77 hours downtime per year)

#### Multi-Region Architecture
```hcl
# terraform/environments/production/disaster-recovery.tf
# Primary region: us-west-2
# DR region: us-east-1

# Cross-region replication for RDS
resource "aws_db_instance" "primary" {
  provider = aws.primary
  
  identifier = "connectkit-primary"
  # ... other configuration ...
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
}

resource "aws_db_instance" "replica" {
  provider = aws.secondary
  
  identifier                = "connectkit-replica"
  replicate_source_db      = aws_db_instance.primary.identifier
  instance_class           = aws_db_instance.primary.instance_class
  publicly_accessible     = false
  auto_minor_version_upgrade = false
  
  # Enable automated backups for the read replica
  backup_retention_period = 7
  
  tags = {
    Name = "connectkit-replica"
    Environment = "production"
    Role = "disaster-recovery"
  }
}

# S3 cross-region replication for backups
resource "aws_s3_bucket" "primary_backups" {
  provider = aws.primary
  bucket   = "connectkit-backups-primary"
}

resource "aws_s3_bucket" "replica_backups" {
  provider = aws.secondary
  bucket   = "connectkit-backups-replica"
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  provider = aws.primary
  
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary_backups.id

  rule {
    id     = "replicate-backups"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replica_backups.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

#### Automated Failover Procedures
```typescript
// scripts/disaster-recovery/failover-manager.ts
interface FailoverPlan {
  steps: FailoverStep[];
  rollbackSteps: FailoverStep[];
  healthChecks: HealthCheck[];
  notifications: NotificationTarget[];
}

interface FailoverStep {
  id: string;
  description: string;
  execute: () => Promise<void>;
  verify: () => Promise<boolean>;
  rollback: () => Promise<void>;
  timeout: number;
}

class DisasterRecoveryManager {
  private plan: FailoverPlan;
  private isFailoverInProgress = false;

  constructor(plan: FailoverPlan) {
    this.plan = plan;
  }

  async initiateFailover(reason: string): Promise<void> {
    if (this.isFailoverInProgress) {
      throw new Error('Failover already in progress');
    }

    this.isFailoverInProgress = true;
    const failoverId = `failover-${Date.now()}`;

    try {
      await this.notifyFailoverStart(failoverId, reason);
      
      // Execute failover steps
      for (let i = 0; i < this.plan.steps.length; i++) {
        const step = this.plan.steps[i];
        
        console.log(`Executing step ${i + 1}: ${step.description}`);
        await this.executeWithTimeout(step.execute, step.timeout);
        
        // Verify step completion
        const verified = await step.verify();
        if (!verified) {
          throw new Error(`Step ${i + 1} verification failed: ${step.description}`);
        }
      }
      
      // Run health checks
      await this.runHealthChecks();
      
      await this.notifyFailoverComplete(failoverId);
      
    } catch (error) {
      console.error('Failover failed:', error);
      await this.notifyFailoverFailed(failoverId, error);
      
      // Attempt rollback
      await this.rollback();
      throw error;
      
    } finally {
      this.isFailoverInProgress = false;
    }
  }

  private async rollback(): Promise<void> {
    console.log('Initiating rollback...');
    
    for (let i = this.plan.rollbackSteps.length - 1; i >= 0; i--) {
      const step = this.plan.rollbackSteps[i];
      
      try {
        await this.executeWithTimeout(step.rollback, step.timeout);
      } catch (error) {
        console.error(`Rollback step ${i + 1} failed:`, error);
        // Continue with other rollback steps
      }
    }
  }

  private async runHealthChecks(): Promise<void> {
    for (const check of this.plan.healthChecks) {
      const isHealthy = await check.execute();
      if (!isHealthy) {
        throw new Error(`Health check failed: ${check.name}`);
      }
    }
  }
}

// Example failover plan
const failoverPlan: FailoverPlan = {
  steps: [
    {
      id: 'dns-failover',
      description: 'Switch DNS to DR region',
      execute: async () => {
        // Update Route 53 records to point to DR region
        await updateRoute53Records('app.connectkit.com', 'dr-load-balancer.us-east-1.elb.amazonaws.com');
      },
      verify: async () => {
        // Verify DNS resolution
        const resolved = await resolveDNS('app.connectkit.com');
        return resolved.includes('us-east-1');
      },
      rollback: async () => {
        await updateRoute53Records('app.connectkit.com', 'load-balancer.us-west-2.elb.amazonaws.com');
      },
      timeout: 300000 // 5 minutes
    },
    {
      id: 'database-promote',
      description: 'Promote read replica to master',
      execute: async () => {
        await promoteReadReplica('connectkit-replica');
      },
      verify: async () => {
        return await isDatabaseWritable('connectkit-replica');
      },
      rollback: async () => {
        // Create new replica from original master
        await createReadReplica('connectkit-primary', 'connectkit-replica-new');
      },
      timeout: 600000 // 10 minutes
    },
    {
      id: 'k8s-scale-up',
      description: 'Scale up DR Kubernetes cluster',
      execute: async () => {
        await scaleKubernetesCluster('connectkit-dr', { minNodes: 3, maxNodes: 20 });
      },
      verify: async () => {
        return await arePodsRunning('connectkit-dr', 'production', 'app=connectkit');
      },
      rollback: async () => {
        await scaleKubernetesCluster('connectkit-dr', { minNodes: 1, maxNodes: 5 });
      },
      timeout: 900000 // 15 minutes
    }
  ],
  rollbackSteps: [
    // Reverse order of steps above
  ],
  healthChecks: [
    {
      name: 'API Health',
      execute: async () => {
        const response = await fetch('https://app.connectkit.com/health');
        return response.ok;
      }
    },
    {
      name: 'Database Connectivity',
      execute: async () => {
        return await testDatabaseConnection();
      }
    }
  ],
  notifications: [
    { type: 'slack', target: '#ops-alerts' },
    { type: 'pagerduty', target: 'P1234567' },
    { type: 'email', target: 'ops@connectkit.com' }
  ]
};
```

## Conclusion

This comprehensive DevOps automation strategy provides ConnectKit with enterprise-grade operational capabilities, focusing on:

### Key Achievements
1. **Full Automation**: End-to-end automation from code commit to production deployment
2. **Scalability**: Auto-scaling infrastructure that adapts to demand
3. **Reliability**: 99.9% uptime target with comprehensive monitoring
4. **Security**: Security integrated at every layer with continuous scanning
5. **Cost Optimization**: Intelligent resource management and cost monitoring
6. **Disaster Recovery**: Robust backup and recovery procedures

### Implementation Phases
1. **Phase 1**: Basic CI/CD pipeline and infrastructure
2. **Phase 2**: Advanced monitoring and observability  
3. **Phase 3**: Cost optimization and resource management
4. **Phase 4**: Disaster recovery and advanced automation

### Success Metrics
- **Deployment Frequency**: Daily deployments with zero downtime
- **Lead Time**: Code to production in under 2 hours
- **Recovery Time**: Mean time to recovery under 15 minutes
- **Cost Efficiency**: 20% cost reduction through optimization
- **Reliability**: 99.9% uptime with automated healing

This DevOps strategy ensures ConnectKit can scale efficiently while maintaining operational excellence and cost effectiveness.