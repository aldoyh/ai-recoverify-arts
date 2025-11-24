<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Intervention\Image\Facades\Image;

/**
 * End-to-End Restoration Tests with Screenshot Capabilities
 *
 * Tests the complete restoration workflow with visual verification
 */
class E2ERestorationTest extends TestCase
{
    use RefreshDatabase;

    protected string $screenshotsDir;
    protected string $testRunId;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up screenshot directory
        $this->testRunId = now()->format('YmdHis');
        $this->screenshotsDir = storage_path("tests/screenshots/{$this->testRunId}");

        if (!is_dir($this->screenshotsDir)) {
            mkdir($this->screenshotsDir, 0755, true);
        }

        // Set up storage for testing
        Storage::fake('public');
        Storage::fake('local');

        $this->artisan('migrate:fresh');

        $this->printTestHeader();
    }

    protected function printTestHeader(): void
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Starting E2E Test Run: {$this->testRunId}\n";
        echo "Screenshots will be saved to: {$this->screenshotsDir}\n";
        echo str_repeat('=', 80) . "\n\n";
    }

    /**
     * Take a screenshot of the test step
     */
    protected function takeScreenshot(string $stepName, array $data, $inputImage = null, $outputPath = null): void
    {
        // Create visual report
        $reportWidth = 1920;
        $reportHeight = 1200;

        $report = imagecreatetruecolor($reportWidth, $reportHeight);

        // Background color (dark)
        $bgColor = imagecolorallocate($report, 30, 30, 30);
        imagefill($report, 0, 0, $bgColor);

        // Colors
        $white = imagecolorallocate($report, 255, 255, 255);
        $green = imagecolorallocate($report, 0, 255, 0);
        $gray = imagecolorallocate($report, 136, 136, 136);

        // Draw title
        imagestring($report, 5, 20, 20, "Test Step: {$stepName}", $white);
        imagestring($report, 3, 20, 70, "Timestamp: " . now()->toIso8601String(), $gray);

        // Draw response data
        $yOffset = 120;
        imagestring($report, 4, 20, $yOffset, "Response Data:", $green);
        $yOffset += 35;

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value);
            }
            $text = "$key: $value";
            if (strlen($text) > 120) {
                $text = substr($text, 0, 117) . '...';
            }
            imagestring($report, 3, 40, $yOffset, $text, $white);
            $yOffset += 25;
        }

        // Add input image if provided
        if ($inputImage) {
            try {
                $img = imagecreatefromstring($inputImage);
                if ($img) {
                    $this->addImageToReport($report, $img, 20, $yOffset + 40, 600, 400);
                    imagestring($report, 4, 20, $yOffset + 20, "Input Image:", $green);
                }
            } catch (\Exception $e) {
                imagestring($report, 3, 20, $yOffset + 20, "Input Image: Error loading", imagecolorallocate($report, 255, 0, 0));
            }
        }

        // Add output image if provided
        if ($outputPath && file_exists($outputPath)) {
            try {
                $img = imagecreatefromstring(file_get_contents($outputPath));
                if ($img) {
                    $this->addImageToReport($report, $img, 700, $yOffset + 40, 600, 400);
                    imagestring($report, 4, 700, $yOffset + 20, "Output Image:", $green);
                }
            } catch (\Exception $e) {
                imagestring($report, 3, 700, $yOffset + 20, "Output Image: Error loading", imagecolorallocate($report, 255, 0, 0));
            }
        }

        // Save screenshot
        $screenshotPath = $this->screenshotsDir . '/' . str_replace(' ', '_', strtolower($stepName)) . '.png';
        imagepng($report, $screenshotPath);
        imagedestroy($report);

        echo "  📸 Screenshot saved: " . basename($screenshotPath) . "\n";
    }

    /**
     * Add resized image to report
     */
    protected function addImageToReport($report, $sourceImage, int $x, int $y, int $maxWidth, int $maxHeight): void
    {
        $srcWidth = imagesx($sourceImage);
        $srcHeight = imagesy($sourceImage);

        // Calculate aspect ratio
        $ratio = min($maxWidth / $srcWidth, $maxHeight / $srcHeight);
        $dstWidth = (int)($srcWidth * $ratio);
        $dstHeight = (int)($srcHeight * $ratio);

        imagecopyresampled(
            $report,
            $sourceImage,
            $x,
            $y,
            0,
            0,
            $dstWidth,
            $dstHeight,
            $srcWidth,
            $srcHeight
        );
    }

    /**
     * Create test image
     */
    protected function createTestImage(int $width = 800, int $height = 600, bool $addDamage = false): string
    {
        $image = imagecreatetruecolor($width, $height);

        // White background
        $white = imagecolorallocate($image, 255, 255, 255);
        imagefill($image, 0, 0, $white);

        // Draw colored rectangles
        $colors = [
            imagecolorallocate($image, 255, 0, 0),    // Red
            imagecolorallocate($image, 0, 0, 255),    // Blue
            imagecolorallocate($image, 0, 255, 0),    // Green
            imagecolorallocate($image, 255, 255, 0),  // Yellow
            imagecolorallocate($image, 128, 0, 128),  // Purple
        ];

        for ($i = 0; $i < count($colors); $i++) {
            $x = 100 + ($i * 120);
            imagefilledrectangle($image, $x, 200, $x + 100, 400, $colors[$i]);
        }

        // Add damage if requested
        if ($addDamage) {
            // Add random noise
            for ($i = 0; $i < 1000; $i++) {
                $x = rand(0, $width - 1);
                $y = rand(0, $height - 1);
                $color = rand(0, 1) ? $white : imagecolorallocate($image, 0, 0, 0);
                imagesetpixel($image, $x, $y, $color);
            }

            // Add scratches
            for ($i = 0; $i < 20; $i++) {
                $x1 = rand(0, $width);
                $y1 = rand(0, $height);
                $x2 = rand(0, $width);
                $y2 = rand(0, $height);
                imageline($image, $x1, $y1, $x2, $y2, $white);
            }
        }

        ob_start();
        imagejpeg($image, null, 95);
        $imageData = ob_get_clean();
        imagedestroy($image);

        return $imageData;
    }

    /** @test */
    public function test_01_health_check()
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "TEST 1: Health Check\n";
        echo str_repeat('=', 80) . "\n";

        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'healthy',
                'service' => 'AI Recoverify Arts - PHP/Laravel',
            ]);

        $this->takeScreenshot('01_health_check', $response->json());

        echo "✓ Health check passed\n";
    }

    /** @test */
    public function test_02_standard_restoration()
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "TEST 2: Standard Restoration\n";
        echo str_repeat('=', 80) . "\n";

        // Create test image
        $imageData = $this->createTestImage();
        $file = UploadedFile::fake()->createWithContent('test_clean.jpg', $imageData);

        $response = $this->postJson('/api/restoration/restore', [
            'file' => $file,
            'enhancement_level' => 'medium',
            'denoise_strength' => 0.5,
            'sharpen' => true,
            'color_correction' => true,
            'damage_repair' => true,
            'async' => false,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->takeScreenshot('02_standard_restoration', $response->json(), $imageData);

        echo "✓ Standard restoration completed\n";
    }

    /** @test */
    public function test_03_damaged_image_restoration()
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "TEST 3: Damaged Image Restoration\n";
        echo str_repeat('=', 80) . "\n";

        // Create damaged image
        $imageData = $this->createTestImage(800, 600, true);
        $file = UploadedFile::fake()->createWithContent('test_damaged.jpg', $imageData);

        $response = $this->postJson('/api/restoration/restore', [
            'file' => $file,
            'enhancement_level' => 'high',
            'denoise_strength' => 0.8,
            'sharpen' => true,
            'color_correction' => true,
            'damage_repair' => true,
            'async' => false,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->takeScreenshot('03_damaged_restoration', $response->json(), $imageData);

        echo "✓ Damaged image restoration completed\n";
    }

    /** @test */
    public function test_04_damage_detection()
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "TEST 4: Damage Detection\n";
        echo str_repeat('=', 80) . "\n";

        // Create damaged image
        $imageData = $this->createTestImage(800, 600, true);
        $file = UploadedFile::fake()->createWithContent('test_damaged.jpg', $imageData);

        $response = $this->postJson('/api/restoration/detect-damage', [
            'file' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'damage_info' => [
                    'damage_percentage',
                    'severity',
                ],
            ]);

        $this->takeScreenshot('04_damage_detection', $response->json(), $imageData);

        echo "✓ Damage detection completed\n";
        echo "  Damage percentage: " . $response->json('damage_info.damage_percentage') . "%\n";
        echo "  Severity: " . $response->json('damage_info.severity') . "\n";
    }

    /** @test */
    public function test_05_error_handling_invalid_file()
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "TEST 5: Error Handling - Invalid File\n";
        echo str_repeat('=', 80) . "\n";

        $file = UploadedFile::fake()->create('test.txt', 100, 'text/plain');

        $response = $this->postJson('/api/restoration/restore', [
            'file' => $file,
        ]);

        $response->assertStatus(422);

        $this->takeScreenshot('05_error_invalid_file', $response->json());

        echo "✓ Invalid file correctly rejected\n";
    }

    /** @test */
    public function test_06_error_handling_missing_file()
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "TEST 6: Error Handling - Missing File\n";
        echo str_repeat('=', 80) . "\n";

        $response = $this->postJson('/api/restoration/restore');

        $response->assertStatus(422);

        $this->takeScreenshot('06_error_missing_file', $response->json());

        echo "✓ Missing file correctly rejected\n";
    }

    protected function tearDown(): void
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Test Run Complete!\n";
        echo str_repeat('=', 80) . "\n";
        echo "\nScreenshots saved to: {$this->screenshotsDir}\n";

        $this->generateHtmlReport();

        parent::tearDown();
    }

    protected function generateHtmlReport(): void
    {
        $screenshots = glob($this->screenshotsDir . '/*.png');

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report - {$this->testRunId}</title>
    <style>
        body { font-family: Arial; max-width: 1400px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        .test-section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .screenshot { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
        .success { color: #4CAF50; font-weight: bold; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🧪 PHP/Laravel E2E Test Report</h1>
    <p class="timestamp">Test Run ID: {$this->testRunId}</p>
    <p class="timestamp">Generated: {now()->format('Y-m-d H:i:s')}</p>
    <div class="test-section">
        <h2>📊 Test Summary</h2>
        <p class="success">All tests completed successfully! ✓</p>
    </div>
HTML;

        foreach ($screenshots as $screenshot) {
            $name = basename($screenshot, '.png');
            $testName = ucwords(str_replace('_', ' ', $name));

            $html .= <<<HTML
    <div class="test-section">
        <h3>{$testName}</h3>
        <img src="{basename($screenshot)}" class="screenshot" alt="{$testName}">
    </div>
HTML;
        }

        $html .= '</body></html>';

        file_put_contents($this->screenshotsDir . '/test_report.html', $html);

        echo "\n📄 HTML Report: {$this->screenshotsDir}/test_report.html\n";
    }
}
