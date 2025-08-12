@echo off
REM ConnectKit Docker Startup Script for Windows Command Prompt
REM This script starts all services using Docker Compose

echo.
echo ======================================
echo   Starting ConnectKit with Docker
echo ======================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    echo        Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env >nul
    echo .env file created
)

REM Stop any running containers
echo Stopping any existing containers...
docker-compose down 2>nul

REM Build and start containers
echo.
echo Building and starting containers...
echo This may take a few minutes on first run...
echo.

docker-compose up --build -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Waiting for services to be ready...
    timeout /t 10 /nobreak >nul
    
    echo.
    echo ======================================
    echo   ConnectKit is running!
    echo ======================================
    echo.
    echo Frontend:    http://localhost:3000
    echo Backend API: http://localhost:3001/api
    echo API Health:  http://localhost:3001/health
    echo.
    echo Default admin credentials:
    echo   Email:    admin@connectkit.com
    echo   Password: Admin123!
    echo.
    echo ======================================
    echo.
    echo Useful commands:
    echo   View logs:     docker-compose logs -f
    echo   Stop services: docker-compose down
    echo   Clean restart: docker-compose down -v ^&^& docker-compose up --build
    echo.
) else (
    echo.
    echo ERROR: Failed to start services. Check Docker logs for details.
    echo Run: docker-compose logs
    pause
    exit /b 1
)

pause