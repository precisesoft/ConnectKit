# ConnectKit Docker Startup Script for Windows PowerShell
# This script starts all services using Docker Compose

Write-Host "🚀 Starting ConnectKit with Docker Compose..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running"
    }
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose version > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Try docker compose (newer syntax)
        docker compose version > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose not found"
        }
        $COMPOSE_CMD = "docker compose"
    } else {
        $COMPOSE_CMD = "docker-compose"
    }
} catch {
    Write-Host "❌ Docker Compose is not installed." -ForegroundColor Red
    exit 1
}

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "📁 Working directory: $projectRoot" -ForegroundColor Gray

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Stop any running containers
Write-Host "`n🛑 Stopping any existing containers..." -ForegroundColor Yellow
& $COMPOSE_CMD down 2>$null

# Build and start containers
Write-Host "`n🔨 Building and starting containers..." -ForegroundColor Cyan
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray

& $COMPOSE_CMD up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    
    # Wait for backend health check
    $maxAttempts = 30
    $attempt = 0
    $backendReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $backendReady) {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
            }
        } catch {
            Write-Host "." -NoNewline
            $attempt++
        }
    }
    
    if ($backendReady) {
        Write-Host "`n✅ Backend is ready!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Backend health check timed out. Check logs with: $COMPOSE_CMD logs backend" -ForegroundColor Yellow
    }
    
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "✅ ConnectKit is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Frontend: " -NoNewline -ForegroundColor Cyan
    Write-Host "http://localhost:3000" -ForegroundColor White
    Write-Host "🔧 Backend API: " -NoNewline -ForegroundColor Cyan
    Write-Host "http://localhost:3001/api" -ForegroundColor White
    Write-Host "📊 API Health: " -NoNewline -ForegroundColor Cyan
    Write-Host "http://localhost:3001/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Default admin credentials:" -ForegroundColor Yellow
    Write-Host "  Email: admin@connectkit.com"
    Write-Host "  Password: Admin123!"
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Useful commands:" -ForegroundColor Cyan
    Write-Host "  View logs:       $COMPOSE_CMD logs -f" -ForegroundColor Gray
    Write-Host "  Stop services:   $COMPOSE_CMD down" -ForegroundColor Gray
    Write-Host "  Clean restart:   $COMPOSE_CMD down -v && $COMPOSE_CMD up --build" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "`n❌ Failed to start services. Check Docker logs for details." -ForegroundColor Red
    Write-Host "Run: $COMPOSE_CMD logs" -ForegroundColor Yellow
    exit 1
}