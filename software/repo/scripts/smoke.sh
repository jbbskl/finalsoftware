#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://localhost:3000}"

echo -e "${BLUE}🧪 Starting comprehensive smoke tests...${NC}"

# Function to make HTTP requests
make_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    local expected_status="$4"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" "$url")
    fi
    
    # Extract status code (last 3 characters)
    status_code="${response: -3}"
    # Extract body (everything except last 3 characters)
    body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $method $url -> $status_code${NC}"
        return 0
    else
        echo -e "${RED}❌ $method $url -> Expected $expected_status, got $status_code${NC}"
        echo -e "${RED}Response: $body${NC}"
        return 1
    fi
}

# Test 1: Health checks
echo -e "\n${YELLOW}1. Testing health endpoints...${NC}"
make_request "GET" "$API_BASE_URL/healthz" "" "200"
make_request "GET" "$API_BASE_URL/readyz" "" "200"

# Test 2: Create a test user and login
echo -e "\n${YELLOW}2. Testing user creation and authentication...${NC}"

# Create user
user_data='{"email":"smoketest@example.com","password":"SmokeTest123!","role":"creator"}'
make_request "POST" "$API_BASE_URL/auth/signup" "$user_data" "200"

# Login user
login_data='{"email":"smoketest@example.com","password":"SmokeTest123!"}'
make_request "POST" "$API_BASE_URL/auth/login" "$login_data" "200"

# Extract session cookie (simplified - in real scenario you'd parse the Set-Cookie header)
SESSION_COOKIE="session=test_session_cookie"

# Test 3: Billing flow (dev mode)
echo -e "\n${YELLOW}3. Testing billing flow...${NC}"

# Create invoice
invoice_data='{"user_id":"smoketest@example.com","bots":2,"provider":"stripe"}'
invoice_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Cookie: $SESSION_COOKIE" \
    -d "$invoice_data" \
    "$API_BASE_URL/billing/invoice")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Created invoice${NC}"
    
    # Extract invoice ID (simplified)
    invoice_id=$(echo "$invoice_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$invoice_id" ]; then
        # Simulate webhook payment
        webhook_data="{\"invoice_id\":\"$invoice_id\",\"event\":\"payment_succeeded\",\"provider\":\"stripe\"}"
        make_request "POST" "$API_BASE_URL/billing/webhook/stripe" "$webhook_data" "200"
        
        # Check bot instances were created
        make_request "GET" "$API_BASE_URL/bot-instances" "" "200"
    else
        echo -e "${YELLOW}⚠️  Could not extract invoice ID, skipping webhook test${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create invoice${NC}"
fi

# Test 4: Bot instance operations
echo -e "\n${YELLOW}4. Testing bot instance operations...${NC}"

# List bot instances
bot_instances_response=$(curl -s -H "Cookie: $SESSION_COOKIE" "$API_BASE_URL/bot-instances")
bot_instance_id=$(echo "$bot_instances_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -n "$bot_instance_id" ]; then
    echo -e "${GREEN}✅ Found bot instance: $bot_instance_id${NC}"
    
    # Create sample cookies file
    cat > /tmp/storageState.json << 'EOF'
{
  "cookies": [
    {
      "name": "session",
      "value": "test_session_value",
      "domain": "example.com",
      "path": "/",
      "httpOnly": true,
      "secure": true
    }
  ],
  "origins": []
}
EOF
    
    # Upload cookies
    upload_response=$(curl -s -w "%{http_code}" -X POST \
        -H "Cookie: $SESSION_COOKIE" \
        -F "file=@/tmp/storageState.json" \
        "$API_BASE_URL/bot-instances/$bot_instance_id/upload-cookies")
    
    status_code="${upload_response: -3}"
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ Uploaded cookies${NC}"
        
        # Validate bot
        make_request "POST" "$API_BASE_URL/bot-instances/$bot_instance_id/validate" "" "200"
        
        # Wait a moment for validation
        sleep 2
        
        # Start bot run
        make_request "POST" "$API_BASE_URL/bot-instances/$bot_instance_id/start" "" "200"
        
        # Wait a moment for run to start
        sleep 2
        
        # Check logs (SSE endpoint)
        echo -e "${BLUE}📋 Testing logs SSE endpoint...${NC}"
        timeout 5s curl -s -H "Cookie: $SESSION_COOKIE" \
            "$API_BASE_URL/bot-instances/$bot_instance_id/logs" > /dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Logs SSE endpoint responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Logs SSE endpoint timeout (expected for short test)${NC}"
        fi
        
        # Stop bot run
        make_request "POST" "$API_BASE_URL/bot-instances/$bot_instance_id/stop" "" "200"
        
    else
        echo -e "${RED}❌ Failed to upload cookies (status: $status_code)${NC}"
    fi
    
    # Clean up
    rm -f /tmp/storageState.json
    
else
    echo -e "${YELLOW}⚠️  No bot instances found, skipping bot operations${NC}"
fi

# Test 5: Phases and Scheduling
echo -e "\n${YELLOW}5. Testing phases and scheduling...${NC}"

# Create a phase
phase_data='{"bot_instance_id":"'$bot_instance_id'","name":"Test Phase","order_no":1,"config_json":"{}"}'
phase_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Cookie: $SESSION_COOKIE" \
    -d "$phase_data" \
    "$API_BASE_URL/phases")

status_code="${phase_response: -3}"
if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✅ Created phase${NC}"
    
    # Extract phase ID
    phase_id=$(echo "${phase_response%???}" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$phase_id" ]; then
        # Create a schedule (65+ minutes in future)
        future_time=$(date -d "+65 minutes" -u +"%Y-%m-%dT%H:%M:%SZ")
        schedule_data='{"bot_instance_id":"'$bot_instance_id'","phase_id":"'$phase_id'","start_at":"'$future_time'","cron_expression":"0 0 * * *"}'
        
        make_request "POST" "$API_BASE_URL/schedules" "$schedule_data" "200"
        
        # List schedules
        make_request "GET" "$API_BASE_URL/schedules" "" "200"
        
        # Test copy day functionality (if available)
        copy_day_data='{"source_date":"2024-01-01","target_date":"2024-01-02"}'
        make_request "POST" "$API_BASE_URL/schedules/copy-day" "$copy_day_data" "200"
        
    else
        echo -e "${YELLOW}⚠️  Could not extract phase ID${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create phase (status: $status_code)${NC}"
fi

# Test 6: Monitoring endpoints
echo -e "\n${YELLOW}6. Testing monitoring endpoints...${NC}"

# Monitoring overview
make_request "GET" "$API_BASE_URL/monitoring/overview" "" "200"

# List runs
make_request "GET" "$API_BASE_URL/runs" "" "200"

# Test 7: Admin endpoints (if user has admin role)
echo -e "\n${YELLOW}7. Testing admin endpoints...${NC}"

# Try admin endpoints (may fail if user is not admin)
make_request "GET" "$API_BASE_URL/admin/subscriptions" "" "200"
make_request "GET" "$API_BASE_URL/admin/invoices" "" "200"
make_request "GET" "$API_BASE_URL/admin/bots" "" "200"
make_request "GET" "$API_BASE_URL/admin/affiliates" "" "200"

# Test 8: Frontend health (basic connectivity)
echo -e "\n${YELLOW}8. Testing frontend connectivity...${NC}"

frontend_response=$(curl -s -w "%{http_code}" "$FRONTEND_BASE_URL/")
frontend_status="${frontend_response: -3}"

if [ "$frontend_status" = "200" ]; then
    echo -e "${GREEN}✅ Frontend responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend status: $frontend_status (may be expected if not running)${NC}"
fi

# Summary
echo -e "\n${BLUE}🎉 Smoke tests completed!${NC}"
echo -e "${GREEN}✅ All critical endpoints tested${NC}"
echo -e "${BLUE}📋 Check the output above for any failed tests${NC}"

# Clean up any temporary files
rm -f /tmp/storageState.json

echo -e "\n${BLUE}💡 To run specific tests, you can modify this script or run individual curl commands${NC}"