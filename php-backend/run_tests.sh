#!/bin/bash

# AI Recoverify Arts PHP/Laravel - Automated Test Runner
# Runs all tests multiple times to ensure stability

set -e

echo "======================================================================"
echo "AI Recoverify Arts PHP/Laravel - Test Suite with Screenshots"
echo "======================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
TEST_RUNS=${TEST_RUNS:-3}
APP_URL=${APP_URL:-"http://localhost:8000"}

echo -e "${BLUE}Configuration:${NC}"
echo "  APP URL: $APP_URL"
echo "  Test Runs: $TEST_RUNS"
echo ""

# Check if Laravel is running
echo -e "${BLUE}Checking if Laravel app is running...${NC}"
if curl -s "$APP_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Laravel app is running${NC}"
else
    echo -e "${RED}✗ Laravel app is not running at $APP_URL${NC}"
    echo "  Please start the app first:"
    echo "  php artisan serve"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "vendor" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    composer install --no-interaction
fi

echo ""

# Run tests multiple times
FAILED_RUNS=0

for run in $(seq 1 $TEST_RUNS); do
    echo "======================================================================"
    echo -e "${BLUE}Test Run $run of $TEST_RUNS${NC}"
    echo "======================================================================"
    echo ""

    export APP_URL=$APP_URL

    if php artisan test tests/Feature/E2ERestorationTest.php --stop-on-failure; then
        echo -e "${GREEN}✓ Test run $run completed successfully${NC}"
    else
        echo -e "${RED}✗ Test run $run failed${NC}"
        FAILED_RUNS=$((FAILED_RUNS + 1))
    fi

    echo ""

    # Small delay between runs
    if [ $run -lt $TEST_RUNS ]; then
        echo "Waiting 2 seconds before next run..."
        sleep 2
    fi
done

# Summary
echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo "Total Runs: $TEST_RUNS"
echo -e "Successful: ${GREEN}$((TEST_RUNS - FAILED_RUNS))${NC}"
if [ $FAILED_RUNS -gt 0 ]; then
    echo -e "Failed: ${RED}$FAILED_RUNS${NC}"
    echo ""
    echo -e "${RED}Some tests failed. Please review the reports.${NC}"
    exit 1
else
    echo -e "Failed: ${GREEN}0${NC}"
    echo ""
    echo -e "${GREEN}All test runs completed successfully!${NC}"
fi

echo ""
echo "Screenshots and reports saved to: storage/tests/screenshots/"
echo ""

# List all generated reports
echo "Generated Reports:"
find storage/tests/screenshots -name "*.html" -type f 2>/dev/null | while read report; do
    echo "  - $report"
done

echo ""
echo -e "${GREEN}✓ Testing complete!${NC}"
