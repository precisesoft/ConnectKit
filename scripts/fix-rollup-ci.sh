#!/bin/bash
# Script to fix Rollup native dependency issues in CI environments
# Addresses npm bug: https://github.com/npm/cli/issues/4828

set -e

echo "🔧 Starting Rollup CI fix script..."

# Function to clean npm cache and modules
clean_npm() {
    echo "🧹 Cleaning npm cache and modules..."
    npm cache clean --force || true
    rm -rf node_modules package-lock.json || true
    find . -maxdepth 2 -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -maxdepth 2 -name "package-lock.json" -type f -delete 2>/dev/null || true
}

# Function to install dependencies with Rollup fix
install_with_rollup_fix() {
    echo "📦 Installing dependencies with Rollup native binary fix..."
    
    # Install without optional dependencies first
    npm install --no-optional --verbose || {
        echo "⚠️  Standard install failed, trying alternative approach..."
        npm install --legacy-peer-deps --no-optional || {
            echo "⚠️  Legacy install failed, trying force install..."
            npm install --force --no-optional
        }
    }
    
    # Specifically install the correct Rollup binary for Linux x64
    echo "🎯 Installing correct Rollup binary for Linux x64..."
    npm install --save-dev @rollup/rollup-linux-x64-gnu || {
        echo "⚠️  Failed to install @rollup/rollup-linux-x64-gnu, trying alternative..."
        npm install --force @rollup/rollup-linux-x64-gnu || true
    }
    
    # Ensure Vite and Vitest are properly installed
    echo "⚡ Ensuring Vite and Vitest are properly installed..."
    npm install --save-dev vite@latest vitest@latest || true
    
    # Run npm ci to ensure lockfile consistency
    echo "🔒 Ensuring lockfile consistency..."
    npm ci || {
        echo "⚠️  npm ci failed, regenerating package-lock.json..."
        rm -f package-lock.json
        npm install
        npm ci
    }
}

# Function to verify installation
verify_installation() {
    echo "✅ Verifying installation..."
    
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    
    # Check if Vite is working
    if npx vite --version; then
        echo "✅ Vite is working"
    else
        echo "❌ Vite is not working"
        return 1
    fi
    
    # Check if Vitest is working
    if npx vitest --version; then
        echo "✅ Vitest is working"
    else
        echo "❌ Vitest is not working"
        return 1
    fi
    
    # Check for Rollup binaries
    echo "🔍 Checking for Rollup binaries..."
    find node_modules -name "*rollup*" -type f | head -5 || true
    
    # List critical packages
    echo "📋 Critical package versions:"
    npm list vite vitest @rollup/rollup-linux-x64-gnu 2>/dev/null || true
}

# Function to run tests with error handling
run_tests() {
    echo "🧪 Running tests with error handling..."
    
    if [ -d "frontend" ]; then
        cd frontend
    fi
    
    # Try running tests
    if npm run test:unit -- --reporter=verbose --no-coverage; then
        echo "✅ Tests passed successfully!"
        return 0
    else
        echo "❌ Tests failed, attempting fixes..."
        
        # Try direct vitest command
        if npx vitest run --no-coverage --reporter=verbose; then
            echo "✅ Tests passed with direct vitest!"
            return 0
        else
            echo "❌ Tests still failing, this appears to be the Rollup native dependency issue"
            return 1
        fi
    fi
}

# Main execution
main() {
    echo "🚀 Starting Rollup CI fix process..."
    
    clean_npm
    install_with_rollup_fix
    verify_installation
    
    if [ "$1" = "--run-tests" ]; then
        run_tests
    fi
    
    echo "✅ Rollup CI fix completed successfully!"
}

# Run main function
main "$@"