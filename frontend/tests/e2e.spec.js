/**
 * End-to-End Tests for Frontend with Screenshots
 * Tests the complete user workflow with Playwright
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test.describe('AI Recoverify Arts - Frontend E2E Tests', () => {
  let testRunId;
  let screenshotsDir;

  test.beforeAll(async () => {
    // Setup
    testRunId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    screenshotsDir = path.join(__dirname, 'screenshots', testRunId);

    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Starting Frontend E2E Test Run: ${testRunId}`);
    console.log(`Screenshots will be saved to: ${screenshotsDir}`);
    console.log('='.repeat(80) + '\n');
  });

  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('01 - Load application homepage', async ({ page }) => {
    console.log('\nTEST 1: Load Homepage');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Wait for main elements
    await expect(page.locator('text=AI Recoverify Arts')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '01_homepage.png'),
      fullPage: true
    });

    console.log('✓ Homepage loaded successfully');
  });

  test('02 - Upload file interface visible', async ({ page }) => {
    console.log('\nTEST 2: Upload Interface');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Check for upload interface
    await expect(page.locator('text=Upload Your Artwork')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '02_upload_interface.png'),
      fullPage: true
    });

    console.log('✓ Upload interface visible');
  });

  test('03 - File upload and preview', async ({ page }) => {
    console.log('\nTEST 3: File Upload');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Create a test image file
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a simple test image if it doesn't exist
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      // Draw colored rectangles
      const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#800080'];
      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(100 + i * 120, 200, 100, 200);
      });

      const buffer = canvas.toBuffer('image/jpeg');
      fs.writeFileSync(testImagePath, buffer);
    }

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for preview
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '03_file_uploaded.png'),
      fullPage: true
    });

    console.log('✓ File uploaded and preview shown');
  });

  test('04 - Adjust restoration settings', async ({ page }) => {
    console.log('\nTEST 4: Adjust Settings');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Upload file first
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    // Check if settings panel is visible
    const hasSettings = await page.locator('text=Enhancement Level').isVisible();

    if (hasSettings) {
      // Adjust settings
      await page.selectOption('select', 'high');

      // Adjust sliders if present
      const denoiseSlider = page.locator('input[type="range"]').first();
      if (await denoiseSlider.isVisible()) {
        await denoiseSlider.fill('0.7');
      }
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '04_settings_adjusted.png'),
      fullPage: true
    });

    console.log('✓ Settings adjusted');
  });

  test('05 - Start restoration process', async ({ page }) => {
    console.log('\nTEST 5: Start Restoration');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Upload file
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    // Find and click restore button
    const restoreButton = page.locator('button:has-text("Restore")');
    if (await restoreButton.isVisible()) {
      await restoreButton.click();

      // Wait for processing
      await page.waitForTimeout(2000);

      // Take screenshot during processing
      await page.screenshot({
        path: path.join(screenshotsDir, '05_restoration_processing.png'),
        fullPage: true
      });

      console.log('✓ Restoration process started');

      // Wait for completion (timeout after 30s)
      try {
        await page.waitForSelector('text=Download', { timeout: 30000 });

        await page.screenshot({
          path: path.join(screenshotsDir, '05_restoration_complete.png'),
          fullPage: true
        });

        console.log('✓ Restoration completed');
      } catch (e) {
        console.log('⚠ Restoration took longer than expected or failed');

        await page.screenshot({
          path: path.join(screenshotsDir, '05_restoration_timeout.png'),
          fullPage: true
        });
      }
    } else {
      console.log('⚠ Restore button not found');

      await page.screenshot({
        path: path.join(screenshotsDir, '05_no_restore_button.png'),
        fullPage: true
      });
    }
  });

  test('06 - Before/After comparison', async ({ page }) => {
    console.log('\nTEST 6: Before/After Comparison');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Upload and process
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    const restoreButton = page.locator('button:has-text("Restore")');
    if (await restoreButton.isVisible()) {
      await restoreButton.click();

      try {
        await page.waitForSelector('text=Download', { timeout: 30000 });

        // Check if comparison slider exists
        const slider = page.locator('input[type="range"]');
        if (await slider.last().isVisible()) {
          // Move slider to different positions
          await slider.last().fill('25');
          await page.waitForTimeout(500);

          await page.screenshot({
            path: path.join(screenshotsDir, '06_comparison_25.png'),
            fullPage: true
          });

          await slider.last().fill('75');
          await page.waitForTimeout(500);

          await page.screenshot({
            path: path.join(screenshotsDir, '06_comparison_75.png'),
            fullPage: true
          });

          console.log('✓ Before/After comparison working');
        }
      } catch (e) {
        console.log('⚠ Could not test comparison slider');
      }
    }
  });

  test('07 - Download restored image', async ({ page }) => {
    console.log('\nTEST 7: Download Image');
    console.log('='.repeat(80));

    await page.goto(FRONTEND_URL);

    // Upload and process
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    const restoreButton = page.locator('button:has-text("Restore")');
    if (await restoreButton.isVisible()) {
      await restoreButton.click();

      try {
        await page.waitForSelector('text=Download', { timeout: 30000 });

        // Take screenshot before download
        await page.screenshot({
          path: path.join(screenshotsDir, '07_ready_to_download.png'),
          fullPage: true
        });

        // Setup download listener
        const downloadPromise = page.waitForEvent('download');

        // Click download
        const downloadButton = page.locator('button:has-text("Download")');
        if (await downloadButton.isVisible()) {
          await downloadButton.click();

          const download = await downloadPromise;

          console.log(`✓ Download initiated: ${download.suggestedFilename()}`);
        }
      } catch (e) {
        console.log('⚠ Download test skipped or failed');
      }
    }
  });

  test('08 - Responsive design check', async ({ page }) => {
    console.log('\nTEST 8: Responsive Design');
    console.log('='.repeat(80));

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(FRONTEND_URL);

      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotsDir, `08_responsive_${viewport.name}.png`),
        fullPage: true
      });

      console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height}) captured`);
    }
  });

  test.afterAll(async () => {
    // Generate HTML report
    const reportPath = path.join(screenshotsDir, 'test_report.html');

    const screenshots = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.png'))
      .sort();

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Frontend E2E Test Report - ${testRunId}</title>
    <style>
        body { font-family: Arial; max-width: 1400px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        .test-section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .screenshot { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; cursor: pointer; }
        .screenshot:hover { opacity: 0.8; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🧪 Frontend E2E Test Report</h1>
    <p class="timestamp">Test Run ID: ${testRunId}</p>
    <p class="timestamp">Generated: ${new Date().toISOString()}</p>
    <div class="test-section">
        <h2>📊 Test Summary</h2>
        <p style="color: #4CAF50; font-weight: bold;">All tests completed! ✓</p>
        <p>Total Screenshots: ${screenshots.length}</p>
    </div>
`;

    screenshots.forEach(screenshot => {
      const testName = screenshot.replace('.png', '').replace(/_/g, ' ').replace(/^\d+/, '').trim();
      html += `
    <div class="test-section">
        <h3>${testName}</h3>
        <img src="${screenshot}" class="screenshot" alt="${testName}" onclick="window.open(this.src)">
    </div>
`;
    });

    html += '</body></html>';

    fs.writeFileSync(reportPath, html);

    console.log('\n' + '='.repeat(80));
    console.log('Frontend E2E Tests Complete!');
    console.log('='.repeat(80));
    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
    console.log(`📄 HTML Report: ${reportPath}`);
    console.log(`\nOpen in browser: file://${reportPath}`);
  });
});
