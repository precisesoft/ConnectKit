#!/bin/bash

# ConnectKit Local Development Startup Script
# This script starts all services locally without Docker

echo "🚀 Starting ConnectKit Application Locally..."
echo "==========================================="

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   MacOS: brew install postgresql"
    exit 1
fi

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is not installed. Please install Redis first."
    echo "   Ubuntu/Debian: sudo apt-get install redis-server"
    echo "   MacOS: brew install redis"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Function to start a service in background
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    
    echo "Starting $name..."
    cd "$dir" || exit
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing $name dependencies..."
        npm install
    fi
    
    # Start the service
    $cmd &
    local pid=$!
    echo "$name started with PID: $pid"
    cd - > /dev/null
    
    return $pid
}

# Create a cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up cleanup on script exit
trap cleanup INT TERM

# Start PostgreSQL if not running
if ! pg_isready -q; then
    echo "Starting PostgreSQL..."
    sudo service postgresql start
fi

# Start Redis if not running
if ! pgrep -x redis-server > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Create database if it doesn't exist
echo "Setting up database..."
sudo -u postgres psql <<EOF
CREATE DATABASE IF NOT EXISTS connectkit;
CREATE USER IF NOT EXISTS admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE connectkit TO admin;
EOF

# Run database migrations
echo "Running database migrations..."
cd database || exit
psql -U admin -d connectkit -f migrations/001_init.sql
cd ..

# Start Backend API
echo ""
echo "📦 Starting Backend API..."
cd backend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
npm run dev &
BACKEND_PID=$!
echo "Backend API started with PID: $BACKEND_PID"
cd ..

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 5
until curl -f http://localhost:3001/health > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " Ready!"

# Start Frontend
echo ""
echo "🎨 Starting Frontend..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
cd ..

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
sleep 5
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " Ready!"

echo ""
echo "==========================================="
echo "✅ ConnectKit is running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001/api"
echo "📊 API Health: http://localhost:3001/health"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@connectkit.com"
echo "  Password: Admin123!"
echo ""
echo "Press Ctrl+C to stop all services"
echo "==========================================="

# Keep script running
wait