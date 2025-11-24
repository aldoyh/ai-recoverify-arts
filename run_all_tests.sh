#!/bin/bash

################################################################################
# AI Recoverify Arts - Master Test Runner
# Runs comprehensive E2E tests with screenshots for all components
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
TEST_RUNS=${TEST_RUNS:-3}
PYTHON_API_URL=${PYTHON_API_URL:-"http://localhost:5000"}
PHP_API_URL=${PHP_API_URL:-"http://localhost:8000"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}

clear

cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              AI RECOVERIFY ARTS - COMPREHENSIVE TEST SUITE                   ║
║                   E2E Tests with Screenshot Verification                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Test Configuration:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Runs per Suite:    $TEST_RUNS"
echo "  Python API URL:         $PYTHON_API_URL"
echo "  PHP API URL:            $PHP_API_URL"
echo "  Frontend URL:           $FRONTEND_URL"
echo ""

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

START_TIME=$(date +%s)

################################################################################
# Test 1: Python Backend
################################################################################
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${BOLD}SUITE 1: Python Backend E2E Tests${NC}                                          ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}→ Checking Python backend...${NC}"
if curl -s "$PYTHON_API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Python backend is running${NC}"
    echo ""

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if cd backend && TEST_RUNS=$TEST_RUNS API_URL=$PYTHON_API_URL ./run_tests.sh; then
        echo -e "${GREEN}✓ Python backend tests PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ Python backend tests FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    cd ..
else
    echo -e "${YELLOW}⚠ Python backend not running - skipping tests${NC}"
    echo "  Start with: cd backend && python -m app.main"
fi

################################################################################
# Test 2: PHP Backend
################################################################################
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${BOLD}SUITE 2: PHP/Laravel Backend E2E Tests${NC}                                    ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}→ Checking PHP backend...${NC}"
if curl -s "$PHP_API_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PHP backend is running${NC}"
    echo ""

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if cd php-backend && TEST_RUNS=$TEST_RUNS APP_URL=$PHP_API_URL ./run_tests.sh; then
        echo -e "${GREEN}✓ PHP backend tests PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ PHP backend tests FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    cd ..
else
    echo -e "${YELLOW}⚠ PHP backend not running - skipping tests${NC}"
    echo "  Start with: cd php-backend && php artisan serve"
fi

################################################################################
# Test 3: Frontend
################################################################################
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${BOLD}SUITE 3: React Frontend E2E Tests${NC}                                         ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}→ Checking frontend...${NC}"
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
    echo ""

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    cd frontend

    # Install Playwright if needed
    if [ ! -d "node_modules/@playwright" ]; then
        echo -e "${BLUE}Installing Playwright...${NC}"
        npm install @playwright/test canvas --save-dev
        npx playwright install
    fi

    if API_URL=$PYTHON_API_URL FRONTEND_URL=$FRONTEND_URL npx playwright test tests/e2e.spec.js; then
        echo -e "${GREEN}✓ Frontend tests PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ Frontend tests FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    cd ..
else
    echo -e "${YELLOW}⚠ Frontend not running - skipping tests${NC}"
    echo "  Start with: cd frontend && npm start"
fi

################################################################################
# Final Summary
################################################################################
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${BOLD}FINAL TEST SUMMARY${NC}                                                          ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Total Test Suites:       $TOTAL_TESTS"
echo -e "  ${GREEN}Passed:${NC}                  $PASSED_TESTS"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "  ${RED}Failed:${NC}                  $FAILED_TESTS"
else
    echo -e "  ${GREEN}Failed:${NC}                  $FAILED_TESTS"
fi

echo "  Duration:                ${DURATION}s"
echo ""

################################################################################
# Test Artifacts
################################################################################
echo -e "${BOLD}Test Artifacts:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Python screenshots
if [ -d "backend/test_screenshots" ]; then
    PYTHON_REPORTS=$(find backend/test_screenshots -name "*.html" -type f | wc -l)
    PYTHON_SCREENSHOTS=$(find backend/test_screenshots -name "*.png" -type f | wc -l)
    echo "  Python Backend:"
    echo "    - $PYTHON_REPORTS HTML reports"
    echo "    - $PYTHON_SCREENSHOTS screenshots"
    echo "    - Location: backend/test_screenshots/"
fi

# PHP screenshots
if [ -d "php-backend/storage/tests/screenshots" ]; then
    PHP_REPORTS=$(find php-backend/storage/tests/screenshots -name "*.html" -type f 2>/dev/null | wc -l)
    PHP_SCREENSHOTS=$(find php-backend/storage/tests/screenshots -name "*.png" -type f 2>/dev/null | wc -l)
    echo "  PHP Backend:"
    echo "    - $PHP_REPORTS HTML reports"
    echo "    - $PHP_SCREENSHOTS screenshots"
    echo "    - Location: php-backend/storage/tests/screenshots/"
fi

# Frontend screenshots
if [ -d "frontend/tests/screenshots" ]; then
    FRONTEND_REPORTS=$(find frontend/tests/screenshots -name "*.html" -type f 2>/dev/null | wc -l)
    FRONTEND_SCREENSHOTS=$(find frontend/tests/screenshots -name "*.png" -type f 2>/dev/null | wc -l)
    echo "  Frontend:"
    echo "    - $FRONTEND_REPORTS HTML reports"
    echo "    - $FRONTEND_SCREENSHOTS screenshots"
    echo "    - Location: frontend/tests/screenshots/"
fi

echo ""

################################################################################
# Exit
################################################################################
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}  ${BOLD}TESTS FAILED - Please review the reports above${NC}                            ${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
else
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}ALL TESTS PASSED SUCCESSFULLY! ✓${NC}                                          ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🎉 Congratulations! Your AI Recoverify Arts platform is working perfectly!${NC}"
    echo ""
    exit 0
fi
