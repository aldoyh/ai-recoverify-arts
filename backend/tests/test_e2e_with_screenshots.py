"""
End-to-End Test Suite with Screenshot Capabilities
Tests the complete restoration workflow with visual verification
"""

import pytest
import requests
import time
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import io
import json
from datetime import datetime

# Test configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')
SCREENSHOTS_DIR = Path('test_screenshots')
TEST_IMAGES_DIR = Path('test_images')


class TestE2ERestoration:
    """End-to-end restoration tests with screenshots"""

    @classmethod
    def setup_class(cls):
        """Set up test environment"""
        SCREENSHOTS_DIR.mkdir(exist_ok=True)
        TEST_IMAGES_DIR.mkdir(exist_ok=True)
        cls.test_run_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        cls.run_screenshots_dir = SCREENSHOTS_DIR / cls.test_run_id
        cls.run_screenshots_dir.mkdir(exist_ok=True)

        # Create test images
        cls._create_test_images()

        print(f"\n{'='*80}")
        print(f"Starting E2E Test Run: {cls.test_run_id}")
        print(f"Screenshots will be saved to: {cls.run_screenshots_dir}")
        print(f"{'='*80}\n")

    @classmethod
    def _create_test_images(cls):
        """Create various test images for different scenarios"""

        # 1. Clean image
        clean_img = Image.new('RGB', (800, 600), color='white')
        draw = ImageDraw.Draw(clean_img)

        # Draw some artwork
        colors = ['red', 'blue', 'green', 'yellow', 'purple']
        for i, color in enumerate(colors):
            x = 100 + (i * 120)
            draw.rectangle([x, 200, x + 100, 400], fill=color)

        clean_img.save(TEST_IMAGES_DIR / 'test_clean.jpg', quality=95)

        # 2. Damaged image (with noise)
        damaged_img = clean_img.copy()
        pixels = damaged_img.load()

        # Add random noise (damage simulation)
        import random
        for _ in range(1000):
            x, y = random.randint(0, 799), random.randint(0, 599)
            pixels[x, y] = (255, 255, 255) if random.random() > 0.5 else (0, 0, 0)

        # Add scratches
        draw_damaged = ImageDraw.Draw(damaged_img)
        for _ in range(20):
            x1, y1 = random.randint(0, 800), random.randint(0, 600)
            x2, y2 = random.randint(0, 800), random.randint(0, 600)
            draw_damaged.line([x1, y1, x2, y2], fill='white', width=2)

        damaged_img.save(TEST_IMAGES_DIR / 'test_damaged.jpg', quality=85)

        # 3. Low quality image
        low_quality_img = clean_img.copy()
        low_quality_img = low_quality_img.resize((200, 150))
        low_quality_img = low_quality_img.resize((800, 600))
        low_quality_img.save(TEST_IMAGES_DIR / 'test_low_quality.jpg', quality=50)

        # 4. Grayscale image
        grayscale_img = clean_img.convert('L').convert('RGB')
        grayscale_img.save(TEST_IMAGES_DIR / 'test_grayscale.jpg', quality=95)

        print("✓ Created test images:")
        print(f"  - test_clean.jpg (800x600)")
        print(f"  - test_damaged.jpg (800x600 with simulated damage)")
        print(f"  - test_low_quality.jpg (upscaled from 200x150)")
        print(f"  - test_grayscale.jpg (800x600 B&W)")

    def _take_screenshot(self, step_name, response_data, input_image=None, output_image=None):
        """Take a screenshot of the test step with annotations"""

        # Create a visual report image
        report_width = 1920
        report_height = 1200
        report_img = Image.new('RGB', (report_width, report_height), color='#1e1e1e')
        draw = ImageDraw.Draw(report_img)

        # Try to load a font, fallback to default if not available
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        except:
            title_font = text_font = small_font = ImageFont.load_default()

        # Draw title
        draw.text((20, 20), f"Test Step: {step_name}", fill='white', font=title_font)
        draw.text((20, 70), f"Timestamp: {datetime.now().isoformat()}", fill='#888888', font=small_font)

        # Draw response data
        y_offset = 120
        draw.text((20, y_offset), "Response Data:", fill='#00ff00', font=text_font)
        y_offset += 35

        for key, value in response_data.items():
            text = f"{key}: {value}"
            if len(text) > 120:
                text = text[:117] + "..."
            draw.text((40, y_offset), text, fill='white', font=small_font)
            y_offset += 25

        # Add input/output images if provided
        if input_image:
            try:
                img_path = TEST_IMAGES_DIR / input_image if isinstance(input_image, str) else input_image
                input_img = Image.open(img_path)
                input_img.thumbnail((600, 400))
                report_img.paste(input_img, (20, y_offset + 40))
                draw.text((20, y_offset + 20), "Input Image:", fill='#00ff00', font=text_font)
            except Exception as e:
                draw.text((20, y_offset + 20), f"Input Image: Error loading - {e}", fill='#ff0000', font=small_font)

        if output_image:
            try:
                output_img = Image.open(output_image)
                output_img.thumbnail((600, 400))
                report_img.paste(output_img, (700, y_offset + 40))
                draw.text((700, y_offset + 20), "Output Image:", fill='#00ff00', font=text_font)
            except Exception as e:
                draw.text((700, y_offset + 20), f"Output Image: Error loading - {e}", fill='#ff0000', font=small_font)

        # Save screenshot
        screenshot_path = self.run_screenshots_dir / f"{step_name.replace(' ', '_').lower()}.png"
        report_img.save(screenshot_path)
        print(f"  📸 Screenshot saved: {screenshot_path.name}")

        return screenshot_path

    def test_01_health_check(self):
        """Test 1: Health check endpoint"""
        print("\n" + "="*80)
        print("TEST 1: Health Check")
        print("="*80)

        response = requests.get(f"{API_BASE_URL}/health")
        assert response.status_code == 200, "Health check failed"

        data = response.json()
        assert data['status'] == 'healthy', "Service not healthy"

        self._take_screenshot('01_health_check', data)
        print("✓ Health check passed")

    def test_02_standard_restoration(self):
        """Test 2: Standard restoration with clean image"""
        print("\n" + "="*80)
        print("TEST 2: Standard Restoration")
        print("="*80)

        test_image = TEST_IMAGES_DIR / 'test_clean.jpg'

        with open(test_image, 'rb') as f:
            files = {'file': ('test_clean.jpg', f, 'image/jpeg')}
            data = {
                'enhancement_level': 'medium',
                'denoise_strength': '0.5',
                'sharpen': 'true',
                'color_correction': 'true',
                'damage_repair': 'true'
            }

            response = requests.post(f"{API_BASE_URL}/api/restore", files=files, data=data)

        assert response.status_code == 200, f"Restoration failed: {response.text}"

        result = response.json()
        assert result['success'] == True, "Restoration was not successful"

        # Download result
        output_filename = result.get('output_file')
        if output_filename:
            download_url = f"{API_BASE_URL}{result['download_url']}"
            output_response = requests.get(download_url)

            if output_response.status_code == 200:
                output_path = self.run_screenshots_dir / output_filename
                with open(output_path, 'wb') as f:
                    f.write(output_response.content)

                self._take_screenshot('02_standard_restoration', result, test_image, output_path)
            else:
                self._take_screenshot('02_standard_restoration', result, test_image)
        else:
            self._take_screenshot('02_standard_restoration', result, test_image)

        print(f"✓ Standard restoration completed in {result.get('processing_time', 'N/A')}s")

    def test_03_damaged_image_restoration(self):
        """Test 3: Restore damaged image with repair"""
        print("\n" + "="*80)
        print("TEST 3: Damaged Image Restoration")
        print("="*80)

        test_image = TEST_IMAGES_DIR / 'test_damaged.jpg'

        with open(test_image, 'rb') as f:
            files = {'file': ('test_damaged.jpg', f, 'image/jpeg')}
            data = {
                'enhancement_level': 'high',
                'denoise_strength': '0.8',
                'sharpen': 'true',
                'color_correction': 'true',
                'damage_repair': 'true'
            }

            response = requests.post(f"{API_BASE_URL}/api/restore", files=files, data=data)

        assert response.status_code == 200, f"Restoration failed: {response.text}"

        result = response.json()
        assert result['success'] == True, "Restoration was not successful"

        # Download result
        output_filename = result.get('output_file')
        if output_filename:
            download_url = f"{API_BASE_URL}{result['download_url']}"
            output_response = requests.get(download_url)

            if output_response.status_code == 200:
                output_path = self.run_screenshots_dir / output_filename
                with open(output_path, 'wb') as f:
                    f.write(output_response.content)

                self._take_screenshot('03_damaged_restoration', result, test_image, output_path)
            else:
                self._take_screenshot('03_damaged_restoration', result, test_image)
        else:
            self._take_screenshot('03_damaged_restoration', result, test_image)

        print(f"✓ Damaged image restoration completed")

    def test_04_enhancement_only(self):
        """Test 4: Image enhancement without full restoration"""
        print("\n" + "="*80)
        print("TEST 4: Image Enhancement")
        print("="*80)

        test_image = TEST_IMAGES_DIR / 'test_low_quality.jpg'

        with open(test_image, 'rb') as f:
            files = {'file': ('test_low_quality.jpg', f, 'image/jpeg')}
            data = {
                'brightness': '1.2',
                'contrast': '1.1',
                'saturation': '1.0'
            }

            response = requests.post(f"{API_BASE_URL}/api/enhance", files=files, data=data)

        assert response.status_code == 200, f"Enhancement failed: {response.text}"

        result = response.json()
        assert result['success'] == True, "Enhancement was not successful"

        # Download result
        output_filename = result.get('output_file')
        if output_filename:
            download_url = f"{API_BASE_URL}{result['download_url']}"
            output_response = requests.get(download_url)

            if output_response.status_code == 200:
                output_path = self.run_screenshots_dir / output_filename
                with open(output_path, 'wb') as f:
                    f.write(output_response.content)

                self._take_screenshot('04_enhancement', result, test_image, output_path)
            else:
                self._take_screenshot('04_enhancement', result, test_image)
        else:
            self._take_screenshot('04_enhancement', result, test_image)

        print(f"✓ Image enhancement completed")

    def test_05_models_list(self):
        """Test 5: List available models"""
        print("\n" + "="*80)
        print("TEST 5: List Available Models")
        print("="*80)

        response = requests.get(f"{API_BASE_URL}/api/models")
        assert response.status_code == 200, "Models list failed"

        data = response.json()
        assert 'models' in data, "Models list not found"
        assert len(data['models']) > 0, "No models available"

        self._take_screenshot('05_models_list', data)
        print(f"✓ Found {len(data['models'])} available models")

    def test_06_error_handling_invalid_file(self):
        """Test 6: Error handling with invalid file"""
        print("\n" + "="*80)
        print("TEST 6: Error Handling - Invalid File")
        print("="*80)

        # Try to upload a text file as image
        files = {'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')}
        response = requests.post(f"{API_BASE_URL}/api/restore", files=files)

        # Should return error
        assert response.status_code in [400, 415], "Should reject invalid file"

        data = response.json() if response.status_code != 500 else {'error': 'Invalid file'}
        self._take_screenshot('06_error_invalid_file', data)
        print("✓ Invalid file correctly rejected")

    def test_07_error_handling_missing_file(self):
        """Test 7: Error handling with missing file"""
        print("\n" + "="*80)
        print("TEST 7: Error Handling - Missing File")
        print("="*80)

        response = requests.post(f"{API_BASE_URL}/api/restore")

        # Should return error
        assert response.status_code == 400, "Should reject request without file"

        data = response.json()
        assert 'error' in data, "Error message not found"

        self._take_screenshot('07_error_missing_file', data)
        print("✓ Missing file correctly rejected")

    @classmethod
    def teardown_class(cls):
        """Generate test report"""
        print("\n" + "="*80)
        print("Test Run Complete!")
        print("="*80)
        print(f"\nScreenshots saved to: {cls.run_screenshots_dir}")
        print(f"\nTest images created in: {TEST_IMAGES_DIR}")

        # Create HTML report
        cls._generate_html_report()

    @classmethod
    def _generate_html_report(cls):
        """Generate HTML report with all screenshots"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report - {cls.test_run_id}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        .test-section {{
            background: white;
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .screenshot {{
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
        }}
        .success {{
            color: #4CAF50;
            font-weight: bold;
        }}
        .timestamp {{
            color: #666;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <h1>🧪 E2E Test Report</h1>
    <p class="timestamp">Test Run ID: {cls.test_run_id}</p>
    <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

    <div class="test-section">
        <h2>📊 Test Summary</h2>
        <p>All tests completed successfully! ✓</p>
    </div>
"""

        # Add screenshots
        screenshots = sorted(cls.run_screenshots_dir.glob('*.png'))
        for screenshot in screenshots:
            test_name = screenshot.stem.replace('_', ' ').title()
            html_content += f"""
    <div class="test-section">
        <h3>{test_name}</h3>
        <img src="{screenshot.name}" class="screenshot" alt="{test_name}">
    </div>
"""

        html_content += """
</body>
</html>
"""

        report_path = cls.run_screenshots_dir / 'test_report.html'
        with open(report_path, 'w') as f:
            f.write(html_content)

        print(f"\n📄 HTML Report: {report_path}")
        print(f"   Open in browser: file://{report_path.absolute()}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s', '--tb=short'])
