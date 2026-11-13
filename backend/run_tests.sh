#!/bin/bash

# AI Recoverify Arts - Automated Test Runner with Screenshots
# Runs all tests multiple times to ensure stability

set -e

echo "======================================================================"
echo "AI Recoverify Arts - Comprehensive Test Suite with Screenshots"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TEST_RUNS=${TEST_RUNS:-3}
API_URL=${API_URL:-"http://localhost:5000"}

echo -e "${BLUE}Configuration:${NC}"
echo "  API URL: $API_URL"
echo "  Test Runs: $TEST_RUNS"
echo ""

# Check if backend is running
echo -e "${BLUE}Checking if backend is running...${NC}"
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running at $API_URL${NC}"
    echo "  Please start the backend first:"
    echo "  cd backend && python -m app.main"
    exit 1
fi

# Install test dependencies if needed
if [ ! -f "venv/bin/activate" ]; then
    echo -e "${BLUE}Setting up virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

echo -e "${BLUE}Installing test dependencies...${NC}"
pip install -q -r tests/requirements-test.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Run tests multiple times
FAILED_RUNS=0

for run in $(seq 1 $TEST_RUNS); do
    echo "======================================================================"
    echo -e "${BLUE}Test Run $run of $TEST_RUNS${NC}"
    echo "======================================================================"
    echo ""

    export API_BASE_URL=$API_URL

    if pytest tests/test_e2e_with_screenshots.py -v -s --tb=short --html=test_screenshots/run_${run}_report.html --self-contained-html; then
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
echo "Screenshots and reports saved to: test_screenshots/"
echo ""

# List all generated reports
echo "Generated Reports:"
find test_screenshots -name "*.html" -type f | while read report; do
    echo "  - $report"
done

echo ""
echo -e "${GREEN}✓ Testing complete!${NC}"
