#!/bin/bash

# Smoke test script for the bot control plane API
# This script tests basic functionality to ensure the system is working

set -e  # Exit on any error

# Configuration
API_BASE_URL=${API_BASE_URL:-"http://localhost:8000"}
TIMEOUT=${TIMEOUT:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5
    
    log_info "Testing $description: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$API_BASE_URL$endpoint" --max-time $TIMEOUT)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint" --max-time $TIMEOUT)
    else
        log_error "Unsupported HTTP method: $method"
        return 1
    fi
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "$expected_status" ]; then
        log_info "✅ $description: HTTP $http_code (expected $expected_status)"
        return 0
    else
        log_error "❌ $description: HTTP $http_code (expected $expected_status)"
        if [ -f /tmp/response.json ]; then
            log_error "Response: $(cat /tmp/response.json)"
        fi
        return 1
    fi
}

# Wait for service to be ready
wait_for_service() {
    log_info "Waiting for API service to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$API_BASE_URL/healthz" --max-time 5 > /dev/null 2>&1; then
            log_info "✅ API service is ready"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Service not ready yet, waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "❌ API service failed to become ready after $max_attempts attempts"
    return 1
}

# Main smoke test function
run_smoke_tests() {
    log_info "Starting smoke tests for Bot Control Plane API"
    log_info "API Base URL: $API_BASE_URL"
    
    # Wait for service to be ready
    if ! wait_for_service; then
        log_error "Service is not ready, aborting smoke tests"
        exit 1
    fi
    
    local failed_tests=0
    local total_tests=0
    
    # Test 1: Health check
    log_info "=== Testing Health Endpoints ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/healthz" "200" "" "Health check endpoint"; then
        ((failed_tests++))
    fi
    
    ((total_tests++))
    if ! test_endpoint "GET" "/readyz" "200" "" "Readiness check endpoint"; then
        ((failed_tests++))
    fi
    
    # Test 2: Create a test invoice (dev mode)
    log_info "=== Testing Billing Endpoints ==="
    
    local invoice_data='{
        "kind": "creator",
        "bots": ["f2f_post", "f2f_dm"]
    }'
    
    ((total_tests++))
    if ! test_endpoint "POST" "/api/billing/invoice" "200" "$invoice_data" "Create invoice"; then
        ((failed_tests++))
    else
        # Extract invoice ID from response
        if [ -f /tmp/response.json ]; then
            invoice_id=$(cat /tmp/response.json | jq -r '.invoice_id // empty')
            if [ -n "$invoice_id" ]; then
                log_info "Created invoice ID: $invoice_id"
                
                # Test invoice retrieval
                ((total_tests++))
                if ! test_endpoint "GET" "/api/billing/invoices/$invoice_id" "200" "" "Get invoice"; then
                    ((failed_tests++))
                fi
                
                # Test webhook simulation (dev mode)
                local webhook_data='{
                    "invoice_id": "'$invoice_id'",
                    "event": "paid"
                }'
                
                ((total_tests++))
                if ! test_endpoint "POST" "/api/billing/webhook/stripe" "200" "$webhook_data" "Simulate webhook"; then
                    ((failed_tests++))
                fi
            else
                log_warn "Could not extract invoice ID from response"
            fi
        fi
    fi
    
    # Test 3: Bot instances endpoints
    log_info "=== Testing Bot Instance Endpoints ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/admin/bots" "200" "" "List bot instances"; then
        ((failed_tests++))
    fi
    
    # Test 4: Monitoring endpoints
    log_info "=== Testing Monitoring Endpoints ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/monitoring/overview" "200" "" "Monitoring overview"; then
        ((failed_tests++))
    fi
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/runs" "200" "" "List runs"; then
        ((failed_tests++))
    fi
    
    # Test 5: Admin endpoints
    log_info "=== Testing Admin Endpoints ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/admin/subscriptions" "200" "" "List subscriptions"; then
        ((failed_tests++))
    fi
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/admin/invoices" "200" "" "List invoices"; then
        ((failed_tests++))
    fi
    
    # Test 6: Schedules endpoints
    log_info "=== Testing Schedule Endpoints ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/schedules" "200" "" "List schedules"; then
        ((failed_tests++))
    fi
    
    # Test 7: Phases endpoints
    log_info "=== Testing Phase Endpoints ==="
    
    # This would require a bot instance ID, so we'll just test the endpoint structure
    ((total_tests++))
    if ! test_endpoint "GET" "/api/phases" "422" "" "List phases (should require bot_instance_id)"; then
        ((failed_tests++))
    fi
    
    # Test 8: Affiliate endpoints
    log_info "=== Testing Affiliate Endpoints ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/affiliate" "200" "" "Get affiliate info"; then
        ((failed_tests++))
    fi
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/admin/affiliates" "200" "" "List affiliates"; then
        ((failed_tests++))
    fi
    
    # Test 9: Rate limiting (test that it doesn't break)
    log_info "=== Testing Rate Limiting ==="
    
    # Make multiple requests to test rate limiting doesn't break the service
    for i in {1..5}; do
        ((total_tests++))
        if ! test_endpoint "GET" "/healthz" "200" "" "Rate limit test $i"; then
            ((failed_tests++))
            break
        fi
    done
    
    # Test 10: Error handling
    log_info "=== Testing Error Handling ==="
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/bot-instances/nonexistent" "404" "" "Non-existent bot instance"; then
        ((failed_tests++))
    fi
    
    ((total_tests++))
    if ! test_endpoint "GET" "/api/runs/nonexistent" "404" "" "Non-existent run"; then
        ((failed_tests++))
    fi
    
    # Summary
    log_info "=== Smoke Test Summary ==="
    log_info "Total tests: $total_tests"
    log_info "Failed tests: $failed_tests"
    log_info "Passed tests: $((total_tests - failed_tests))"
    
    if [ $failed_tests -eq 0 ]; then
        log_info "🎉 All smoke tests passed!"
        return 0
    else
        log_error "💥 $failed_tests smoke tests failed!"
        return 1
    fi
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=0
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        ((missing_deps++))
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        ((missing_deps++))
    fi
    
    if [ $missing_deps -gt 0 ]; then
        log_error "Missing dependencies. Please install: curl, jq"
        exit 1
    fi
    
    log_info "✅ All dependencies are available"
}

# Main execution
main() {
    log_info "Bot Control Plane API Smoke Tests"
    log_info "================================"
    
    # Check dependencies
    check_dependencies
    
    # Run smoke tests
    if run_smoke_tests; then
        log_info "✅ Smoke tests completed successfully"
        exit 0
    else
        log_error "❌ Smoke tests failed"
        exit 1
    fi
}

# Run main function
main "$@"