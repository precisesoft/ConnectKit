#!/bin/bash

# ConnectKit Setup Test Script
# This script verifies that all components are properly configured

echo "🔍 ConnectKit Setup Verification"
echo "================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to check if a command exists
check_command() {
    local cmd=$1
    local name=$2
    
    if command -v $cmd &> /dev/null; then
        echo -e "${GREEN}✓${NC} $name is installed"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name is not installed"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check if a file exists
check_file() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $name exists"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name is missing"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check if a directory exists
check_dir() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $name directory exists"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name directory is missing"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to validate JSON file
check_json() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $name is valid JSON"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}✗${NC} $name has invalid JSON"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${YELLOW}⚠${NC} $name not found"
        return 1
    fi
}

echo "1. Checking System Requirements"
echo "--------------------------------"
check_command "node" "Node.js"
check_command "npm" "NPM"
check_command "git" "Git"
check_command "curl" "cURL"

echo ""
echo "2. Checking Project Structure"
echo "--------------------------------"
check_dir "backend" "Backend"
check_dir "frontend" "Frontend"
check_dir "database" "Database"
check_dir "docker" "Docker configs"
check_dir "docs" "Documentation"
check_dir "scripts" "Scripts"

echo ""
echo "3. Checking Backend Configuration"
echo "--------------------------------"
check_file "backend/package.json" "Backend package.json"
check_file "backend/tsconfig.json" "Backend TypeScript config"
check_file "backend/jest.config.js" "Backend Jest config"
check_dir "backend/src" "Backend source"
check_dir "backend/src/models" "Backend models"
check_dir "backend/src/controllers" "Backend controllers"
check_dir "backend/src/services" "Backend services"
check_dir "backend/src/routes" "Backend routes"

echo ""
echo "4. Checking Frontend Configuration"
echo "--------------------------------"
check_file "frontend/package.json" "Frontend package.json"
check_file "frontend/tsconfig.json" "Frontend TypeScript config"
check_file "frontend/vite.config.ts" "Frontend Vite config"
check_file "frontend/index.html" "Frontend HTML entry"
check_dir "frontend/src" "Frontend source"
check_dir "frontend/src/components" "Frontend components"
check_dir "frontend/src/pages" "Frontend pages"
check_dir "frontend/src/services" "Frontend services"

echo ""
echo "5. Checking Database Configuration"
echo "--------------------------------"
check_file "database/migrations/001_init.sql" "Database init script"
check_file "docker-compose.yml" "Docker Compose config"

echo ""
echo "6. Checking Environment Configuration"
echo "--------------------------------"
check_file ".env.example" "Environment example"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} .env file not found (creating from .env.example)"
    cp .env.example .env
    if [ -f ".env" ]; then
        echo -e "${GREEN}✓${NC} .env file created"
        ((TESTS_PASSED++))
    fi
fi

echo ""
echo "7. Checking Package.json Validity"
echo "--------------------------------"
check_json "package.json" "Root package.json"
check_json "backend/package.json" "Backend package.json"
check_json "frontend/package.json" "Frontend package.json"

echo ""
echo "8. Checking Documentation"
echo "--------------------------------"
check_file "README.md" "README"
check_file "CLAUDE.md" "Claude documentation"
check_dir "docs/planning" "Planning docs"
check_dir "docs/architecture" "Architecture docs"
check_dir "docs/security" "Security docs"

echo ""
echo "================================="
echo "📊 Test Results Summary"
echo "================================="
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED tests"
echo -e "${RED}Failed:${NC} $TESTS_FAILED tests"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All checks passed! Your ConnectKit setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Install dependencies: npm install (in root, backend, and frontend)"
    echo "2. Start with Docker: docker-compose up"
    echo "3. Or start locally: ./scripts/start-local.sh"
else
    echo ""
    echo -e "${YELLOW}⚠ Some checks failed. Please review the issues above.${NC}"
fi

echo ""
echo "================================="
echo "Quick Start Commands:"
echo "--------------------------------"
echo "📦 Install all dependencies:"
echo "   npm install"
echo ""
echo "🐳 Start with Docker:"
echo "   docker-compose up --build"
echo ""
echo "💻 Start locally (without Docker):"
echo "   ./scripts/start-local.sh"
echo ""
echo "🧪 Run tests:"
echo "   npm test"
echo "================================="