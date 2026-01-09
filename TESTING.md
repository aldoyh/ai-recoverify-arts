# AI Recoverify Arts - Comprehensive Testing Guide

Complete guide for running E2E tests with screenshot verification across all components.

---

## 🧪 Overview

This project includes comprehensive End-to-End (E2E) tests with **automatic screenshot capture** to verify that:

1. **Python Backend** - All API endpoints work correctly
2. **PHP/Laravel Backend** - All restoration features function properly
3. **React Frontend** - Complete user workflow operates smoothly

All tests run **multiple times** to ensure stability and generate **visual reports** with screenshots.

---

## 🚀 Quick Start

### Run All Tests (Recommended)

```bash
./run_all_tests.sh
```

This master script will:
- ✅ Test Python backend (if running)
- ✅ Test PHP backend (if running)
- ✅ Test React frontend (if running)
- ✅ Run each suite 3 times for stability
- ✅ Generate HTML reports with screenshots
- ✅ Display comprehensive summary

### Configuration

```bash
# Customize number of test runs
export TEST_RUNS=5

# Customize URLs
export PYTHON_API_URL="http://localhost:5000"
export PHP_API_URL="http://localhost:8000"
export FRONTEND_URL="http://localhost:3000"

# Then run tests
./run_all_tests.sh
```

---

## 🐍 Python Backend Tests

### Prerequisites

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r tests/requirements-test.txt
```

### Start Backend

```bash
python -m app.main
```

### Run Tests

```bash
# From backend directory
./run_tests.sh

# Or run directly
pytest tests/test_e2e_with_screenshots.py -v -s
```

### Test Features

The Python E2E test suite includes:

1. **Health Check** - Verify service is running
2. **Standard Restoration** - Test basic restoration pipeline
3. **Damaged Image Restoration** - Test with simulated damage
4. **Image Enhancement** - Test brightness/contrast adjustments
5. **Models List** - Verify available AI models
6. **Error Handling** - Test invalid file rejection
7. **Error Handling** - Test missing file handling

### Screenshots Location

```
backend/test_screenshots/
└── YYYYMMDD_HHMMSS/
    ├── 01_health_check.png
    ├── 02_standard_restoration.png
    ├── 03_damaged_restoration.png
    ├── 04_enhancement.png
    ├── 05_models_list.png
    ├── 06_error_invalid_file.png
    ├── 07_error_missing_file.png
    └── test_report.html
```

### Test Images

Tests automatically create:
- `test_clean.jpg` - Clean artwork with colored rectangles
- `test_damaged.jpg` - Image with simulated scratches and noise
- `test_low_quality.jpg` - Low resolution upscaled image
- `test_grayscale.jpg` - Black and white image

---

## 🐘 PHP/Laravel Backend Tests

### Prerequisites

```bash
cd php-backend
composer install
```

### Start Backend

```bash
php artisan serve
```

### Run Migrations

```bash
php artisan migrate:fresh
```

### Run Tests

```bash
# From php-backend directory
./run_tests.sh

# Or run directly
php artisan test tests/Feature/E2ERestorationTest.php
```

### Test Features

The PHP E2E test suite includes:

1. **Health Check** - Laravel app status
2. **Standard Restoration** - Full restoration pipeline
3. **Damaged Image Restoration** - With damage repair enabled
4. **Damage Detection** - Analyze damage percentage
5. **Error Handling** - Invalid file type
6. **Error Handling** - Missing file

### Screenshots Location

```
php-backend/storage/tests/screenshots/
└── YYYYMMDD_HHMMSS/
    ├── 01_health_check.png
    ├── 02_standard_restoration.png
    ├── 03_damaged_restoration.png
    ├── 04_damage_detection.png
    ├── 05_error_invalid_file.png
    ├── 06_error_missing_file.png
    └── test_report.html
```

---

## ⚛️ React Frontend Tests

### Prerequisites

```bash
cd frontend
npm install
npm install @playwright/test canvas --save-dev
npx playwright install
```

### Start Frontend

```bash
npm start
```

### Run Tests

```bash
# From frontend directory
npm run test:e2e

# Or with UI mode
npm run test:e2e:ui

# Or headed (see browser)
npm run test:e2e:headed
```

### Test Features

The Frontend E2E test suite includes:

1. **Load Homepage** - Application loads correctly
2. **Upload Interface** - File upload UI visible
3. **File Upload** - Upload and preview image
4. **Adjust Settings** - Modify restoration parameters
5. **Start Restoration** - Process image and wait for completion
6. **Before/After Comparison** - Test comparison slider
7. **Download Image** - Download restored result
8. **Responsive Design** - Test desktop, tablet, mobile views

### Screenshots Location

```
frontend/tests/screenshots/
└── YYYYMMDD_HHMMSS/
    ├── 01_homepage.png
    ├── 02_upload_interface.png
    ├── 03_file_uploaded.png
    ├── 04_settings_adjusted.png
    ├── 05_restoration_processing.png
    ├── 05_restoration_complete.png
    ├── 06_comparison_25.png
    ├── 06_comparison_75.png
    ├── 07_ready_to_download.png
    ├── 08_responsive_desktop.png
    ├── 08_responsive_tablet.png
    ├── 08_responsive_mobile.png
    └── test_report.html
```

---

## 📊 Test Reports

### HTML Reports

Each test suite generates an HTML report with:
- ✅ Test step names and descriptions
- ✅ Full-page screenshots of each step
- ✅ Response data visualization
- ✅ Input/output image comparison
- ✅ Timestamps and metadata

Open any `test_report.html` in your browser to view results.

### Console Output

Tests provide color-coded console output:
- 🟢 **Green** - Tests passed
- 🔴 **Red** - Tests failed
- 🟡 **Yellow** - Warnings or skipped tests
- 🔵 **Blue** - Section headers

---

## 🔧 Troubleshooting

### Backend Not Running

```
Error: Connection refused
```

**Solution**: Start the backend first
```bash
# Python
cd backend && python -m app.main

# PHP
cd php-backend && php artisan serve
```

### Port Already in Use

```
Error: Address already in use
```

**Solution**: Change port or kill existing process
```bash
# Find process
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows

# Or use different port
export PYTHON_API_URL="http://localhost:5001"
```

### Playwright Not Installed

```
Error: Executable doesn't exist
```

**Solution**: Install Playwright browsers
```bash
cd frontend
npx playwright install
```

### Missing Dependencies

```
Error: Module not found
```

**Solution**: Install dependencies
```bash
# Python
cd backend && pip install -r tests/requirements-test.txt

# PHP
cd php-backend && composer install

# Frontend
cd frontend && npm install
```

### Tests Failing Consistently

1. **Check logs** - Look for error messages in console output
2. **Check screenshots** - Visual verification of what went wrong
3. **Run individually** - Test one suite at a time
4. **Check services** - Ensure all required services are running

---

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Set up PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install dependencies
        run: |
          pip install -r backend/tests/requirements-test.txt
          composer install --working-dir=php-backend
          cd frontend && npm install

      - name: Start services
        run: |
          cd backend && python -m app.main &
          cd php-backend && php artisan serve &
          cd frontend && npm start &
          sleep 10

      - name: Run tests
        run: ./run_all_tests.sh

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: |
            backend/test_screenshots/
            php-backend/storage/tests/screenshots/
            frontend/tests/screenshots/
```

---

## 📈 Test Metrics

### Coverage Goals

- **Backend APIs**: 80%+ endpoint coverage
- **Frontend**: 70%+ user workflow coverage
- **Integration**: 100% critical path coverage

### Performance Benchmarks

- **Python Tests**: ~30-60 seconds per run
- **PHP Tests**: ~20-40 seconds per run
- **Frontend Tests**: ~60-120 seconds per run
- **Total Suite**: ~2-4 minutes for all tests

---

## 🤝 Contributing

When adding new features, please:

1. ✅ Write E2E tests with screenshot verification
2. ✅ Update test documentation
3. ✅ Ensure all tests pass locally
4. ✅ Include test results in PR

---

## 📝 Best Practices

1. **Run tests before committing** - Catch issues early
2. **Review screenshots** - Visual verification is powerful
3. **Run multiple times** - Ensure stability (default: 3 runs)
4. **Test on different OS** - Cross-platform compatibility
5. **Keep tests updated** - Reflect current functionality

---

## 🎉 Success Criteria

Tests are successful when:

✅ All test suites pass (Python + PHP + Frontend)
✅ No errors in console output
✅ Screenshots show correct UI/behavior
✅ HTML reports generated successfully
✅ Tests pass consistently across multiple runs

---

**Happy Testing! 🧪🚀**

For questions or issues, please open a GitHub issue or check the troubleshooting section above.
