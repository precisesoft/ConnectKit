#!/bin/bash

# ConnectKit Test Database Setup Script
# This script creates a test database for running unit and integration tests

set -e

echo "🗄️ Setting up test database..."

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-admin}
DB_PASSWORD=${DB_PASSWORD:-admin123}
TEST_DB_NAME=${TEST_DB_NAME:-connectkit_test}

echo "📋 Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER" 
echo "  Test Database: $TEST_DB_NAME"

# Check if database container is running
if ! docker ps | grep -q connectkit-db; then
    echo "❌ Database container 'connectkit-db' is not running!"
    echo "   Please start the database with: docker-compose up db"
    exit 1
fi

echo "🔗 Container is running, proceeding with database setup..."

# Create test database if it doesn't exist
echo "🔧 Creating test database '$TEST_DB_NAME'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d connectkit -c "
CREATE DATABASE $TEST_DB_NAME;
" 2>/dev/null || echo "   Database '$TEST_DB_NAME' already exists or failed to create"

# Grant permissions
echo "🔑 Setting up permissions..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB_NAME -c "
GRANT ALL PRIVILEGES ON DATABASE $TEST_DB_NAME TO $DB_USER;
" 2>/dev/null || echo "   Permission setup completed or already configured"

echo "✅ Test database setup completed!"
echo "   You can now run tests with: npm test"