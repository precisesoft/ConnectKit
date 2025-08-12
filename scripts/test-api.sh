#!/bin/bash

# ConnectKit API Test Script
# This script tests the API endpoints to ensure they're working

API_URL="http://localhost:3001/api/v1"
TOKEN=""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 ConnectKit API Test Suite"
echo "============================"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ -n "$data" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data" \
                "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint")
        fi
    else
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Authorization: Bearer $TOKEN" \
                "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
        fi
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (Status: $status_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status_code)"
        echo "  Response: $body"
        return 1
    fi
}

# Function to extract token from response
extract_token() {
    local response=$1
    echo "$response" | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$'
}

echo "1. Testing Health Endpoints"
echo "----------------------------"
test_endpoint "GET" "/../health" "" "200" "Health check"
test_endpoint "GET" "/../health/liveness" "" "200" "Liveness probe"
test_endpoint "GET" "/../health/readiness" "" "200" "Readiness probe"

echo ""
echo "2. Testing Authentication Endpoints"
echo "------------------------------------"

# Register a test user
TEST_USER_EMAIL="test_$(date +%s)@example.com"
TEST_USER_PASS="TestPass123!"

register_data='{
    "email": "'$TEST_USER_EMAIL'",
    "username": "testuser'$(date +%s)'",
    "password": "'$TEST_USER_PASS'",
    "firstName": "Test",
    "lastName": "User"
}'

echo -n "Testing: User registration... "
register_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$register_data" \
    "$API_URL/auth/register")

if echo "$register_response" | grep -q "accessToken"; then
    echo -e "${GREEN}✓${NC}"
    TOKEN=$(extract_token "$register_response")
else
    echo -e "${RED}✗${NC}"
    echo "  Response: $register_response"
fi

# Login with the test user
login_data='{
    "email": "'$TEST_USER_EMAIL'",
    "password": "'$TEST_USER_PASS'"
}'

echo -n "Testing: User login... "
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$API_URL/auth/login")

if echo "$login_response" | grep -q "accessToken"; then
    echo -e "${GREEN}✓${NC}"
    TOKEN=$(extract_token "$login_response")
else
    echo -e "${RED}✗${NC}"
    echo "  Response: $login_response"
fi

# Test authenticated endpoints
if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/auth/profile" "" "200" "Get user profile"
    test_endpoint "POST" "/auth/logout" "" "200" "User logout"
fi

echo ""
echo "3. Testing Contact Endpoints"
echo "-----------------------------"

# Create a contact
contact_data='{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Test Corp",
    "jobTitle": "Developer"
}'

if [ -n "$TOKEN" ]; then
    echo -n "Testing: Create contact... "
    create_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$contact_data" \
        "$API_URL/contacts")
    
    status_code=$(echo "$create_response" | tail -n 1)
    body=$(echo "$create_response" | sed '$d')
    
    if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓${NC} (Status: $status_code)"
        contact_id=$(echo "$body" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
        
        # Test other contact endpoints
        test_endpoint "GET" "/contacts" "" "200" "List contacts"
        if [ -n "$contact_id" ]; then
            test_endpoint "GET" "/contacts/$contact_id" "" "200" "Get contact by ID"
            test_endpoint "DELETE" "/contacts/$contact_id" "" "200" "Delete contact"
        fi
    else
        echo -e "${RED}✗${NC} (Status: $status_code)"
        echo "  Response: $body"
    fi
else
    echo -e "${YELLOW}⚠${NC} Skipping contact tests (no auth token)"
fi

echo ""
echo "============================"
echo "📊 API Test Summary"
echo "============================"
echo ""
echo -e "${BLUE}Note:${NC} Some tests may fail if the backend is not running."
echo "Start the backend with: cd backend && npm run dev"
echo ""
echo "To run full application tests:"
echo "1. Start all services: docker-compose up"
echo "2. Or use: ./scripts/start-local.sh"
echo "3. Then run this test again"
echo "============================"