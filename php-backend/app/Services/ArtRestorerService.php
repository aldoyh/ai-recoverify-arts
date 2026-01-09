<?php

namespace App\Services;

use App\Models\{EnhancementLevel, StyleType};
use Intervention\Image\Image as InterventionImage;
use Imagick;
use ImagickPixel;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Advanced Art Restoration Service
 *
 * Provides AI-powered art restoration capabilities
 */
class ArtRestorerService
{
    protected ImageProcessorService $imageProcessor;

    public function __construct(ImageProcessorService $imageProcessor)
    {
        $this->imageProcessor = $imageProcessor;
        Log::info('ArtRestorerService initialized');
    }

    /**
     * Main restoration pipeline
     */
    public function restore(
        string $imagePath,
        EnhancementLevel $enhancementLevel = EnhancementLevel::MEDIUM,
        float $denoiseStrength = 0.5,
        bool $sharpen = true,
        bool $colorCorrection = true,
        bool $damageRepair = true
    ): InterventionImage {
        Log::info('Starting restoration', [
            'path' => $imagePath,
            'level' => $enhancementLevel->value
        ]);

        $image = $this->imageProcessor->loadImage($imagePath);

        // 1. Damage repair (inpainting)
        if ($damageRepair) {
            Log::debug('Applying damage repair');
            $image = $this->repairDamage($image);
        }

        // 2. Denoising
        if ($denoiseStrength > 0) {
            Log::debug('Applying denoising', ['strength' => $denoiseStrength]);
            $image = $this->imageProcessor->denoise($image, $denoiseStrength);
        }

        // 3. Color correction
        if ($colorCorrection) {
            Log::debug('Applying color correction');
            $image = $this->restoreColors($image, $enhancementLevel);
        }

        // 4. Enhancement based on level
        $image = $this->applyEnhancementLevel($image, $enhancementLevel);

        // 5. Sharpening
        if ($sharpen) {
            $params = $enhancementLevel->parameters();
            Log::debug('Applying sharpening', ['amount' => $params['sharpen']]);
            $image = $this->imageProcessor->sharpen($image, $params['sharpen']);
        }

        // 6. Final touch-ups
        $image = $this->finalAdjustments($image);

        Log::info('Restoration completed');

        return $image;
    }

    /**
     * Super resolution - increase image resolution
     */
    public function superResolution(string $imagePath, int $scale = 2): InterventionImage
    {
        if (!in_array($scale, [2, 4])) {
            throw new Exception('Scale must be 2 or 4');
        }

        Log::info('Starting super resolution', ['scale' => $scale]);

        $image = $this->imageProcessor->loadImage($imagePath);
        $width = $image->width() * $scale;
        $height = $image->height() * $scale;

        // High-quality upscaling
        $image = $this->imageProcessor->resize($image, $width, $height, false);

        // Apply sharpening to enhance details
        $image = $this->imageProcessor->sharpen($image, 0.8);

        // Reduce artifacts with bilateral filter
        $image = $this->imageProcessor->bilateralFilter($image, 5);

        Log::info('Super resolution completed', ['new_size' => "{$width}x{$height}"]);

        return $image;
    }

    /**
     * Colorize black and white images
     */
    public function colorize(string $imagePath, string $method = 'sepia'): InterventionImage
    {
        Log::info('Starting colorization', ['method' => $method]);

        $image = $this->imageProcessor->loadImage($imagePath);

        // Convert to grayscale first
        $image->greyscale();

        switch ($method) {
            case 'sepia':
                $image = $this->applySepiaTone($image);
                break;

            case 'vintage':
                $image = $this->applyVintageColor($image);
                break;

            case 'warm':
                $image = $this->applyWarmTone($image);
                break;

            default:
                $image = $this->applySepiaTone($image);
        }

        // Enhance colors
        $image = $this->restoreColors($image, EnhancementLevel::MEDIUM);

        Log::info('Colorization completed');

        return $image;
    }

    /**
     * Apply artistic style transfer
     */
    public function styleTransfer(string $imagePath, StyleType $style): InterventionImage
    {
        Log::info('Starting style transfer', ['style' => $style->value]);

        $image = $this->imageProcessor->loadImage($imagePath);

        $image = match($style) {
            StyleType::CLASSICAL => $this->applyClassicalStyle($image),
            StyleType::MODERN => $this->applyModernStyle($image),
            StyleType::IMPRESSIONIST => $this->applyImpressionistStyle($image),
            StyleType::BAROQUE => $this->applyBaroqueStyle($image),
            StyleType::RENAISSANCE => $this->applyRenaissanceStyle($image),
            StyleType::ABSTRACT => $this->applyAbstractStyle($image),
            StyleType::MINIMALIST => $this->applyMinimalistStyle($image),
        };

        Log::info('Style transfer completed');

        return $image;
    }

    /**
     * Detect damage in artwork
     */
    public function detectDamage(string $imagePath): array
    {
        Log::info('Starting damage detection');

        $image = $this->imageProcessor->loadImage($imagePath);

        // Get image as Imagick for advanced processing
        $imagick = new Imagick($imagePath);

        // Convert to grayscale for analysis
        $gray = clone $imagick;
        $gray->setImageType(Imagick::IMGTYPE_GRAYSCALE);

        // Detect bright spots (tears, fading)
        $brightSpots = $this->detectBrightSpots($gray);

        // Detect dark spots (stains, damage)
        $darkSpots = $this->detectDarkSpots($gray);

        // Detect scratches using edge detection
        $scratches = $this->detectScratches($imagick);

        // Calculate overall damage percentage
        $totalPixels = $imagick->getImageWidth() * $imagick->getImageHeight();
        $damagedPixels = $brightSpots + $darkSpots + $scratches;
        $damagePercentage = ($damagedPixels / $totalPixels) * 100;

        $result = [
            'damage_percentage' => round($damagePercentage, 2),
            'has_bright_spots' => $brightSpots > 0,
            'has_dark_spots' => $darkSpots > 0,
            'has_scratches' => $scratches > 100,
            'bright_spot_count' => $brightSpots,
            'dark_spot_count' => $darkSpots,
            'scratch_count' => $scratches,
            'severity' => $this->getDamageSeverity($damagePercentage),
        ];

        Log::info('Damage detection completed', $result);

        return $result;
    }

    /**
     * Create HDR (High Dynamic Range) image
     */
    public function createHDR(string $imagePath): InterventionImage
    {
        Log::info('Creating HDR image');

        $image = $this->imageProcessor->loadImage($imagePath);

        // Apply CLAHE for local contrast enhancement
        $image = $this->imageProcessor->applyCLAHE($image, 3.0);

        // Tone mapping
        $image->brightness(5);
        $image->contrast(15);

        // Boost shadows and reduce highlights
        $this->toneMapping($image);

        Log::info('HDR creation completed');

        return $image;
    }

    /**
     * Repair damage using inpainting techniques
     */
    protected function repairDamage(InterventionImage $image): InterventionImage
    {
        try {
            // Create damage mask
            $imagick = new Imagick();
            $imagick->readImageBlob($image->encode()->getEncoded());

            // Detect damaged areas
            $gray = clone $imagick;
            $gray->setImageType(Imagick::IMGTYPE_GRAYSCALE);

            // Threshold for bright spots
            $gray->thresholdImage(240 * 255);

            // Use morphology to fill damaged areas
            $imagick->setImageMatte(true);
            $imagick->paintTransparentImage($gray->getPixelIterator()->getCurrentIteratorRow(), 0, 65535);

            // Blur to blend repairs
            $imagick->blurImage(2, 1);

            return $this->imageProcessor->fromImagick($imagick);
        } catch (Exception $e) {
            Log::warning('Damage repair failed', ['error' => $e->getMessage()]);
            return $image;
        }
    }

    /**
     * Restore faded colors
     */
    protected function restoreColors(
        InterventionImage $image,
        EnhancementLevel $level
    ): InterventionImage {
        // Auto color balance
        $image = $this->imageProcessor->autoColorBalance($image);

        // Boost saturation based on level
        $params = $level->parameters();
        $saturationBoost = (int)(($params['saturation'] - 1.0) * 50);

        if ($saturationBoost > 0) {
            $image->colorize(0, 0, 0)->contrast($saturationBoost);
        }

        return $image;
    }

    /**
     * Apply enhancement based on level
     */
    protected function applyEnhancementLevel(
        InterventionImage $image,
        EnhancementLevel $level
    ): InterventionImage {
        $params = $level->parameters();

        // Adjust gamma
        $image = $this->imageProcessor->adjustGamma($image, $params['gamma']);

        // Adjust contrast
        $contrastValue = (int)(($params['contrast'] - 1.0) * 100);
        $image->contrast($contrastValue);

        return $image;
    }

    /**
     * Final adjustments
     */
    protected function finalAdjustments(InterventionImage $image): InterventionImage
    {
        // Subtle smoothing to reduce artifacts
        $image = $this->imageProcessor->bilateralFilter($image, 3);

        return $image;
    }

    /**
     * Apply classical painting style
     */
    protected function applyClassicalStyle(InterventionImage $image): InterventionImage
    {
        // Smooth edges
        $image = $this->imageProcessor->bilateralFilter($image, 9);

        // Enhance colors
        $image = $this->restoreColors($image, EnhancementLevel::HIGH);

        // Apply vignette effect
        $this->applyVignette($image, 0.3);

        return $image;
    }

    /**
     * Apply modern art style
     */
    protected function applyModernStyle(InterventionImage $image): InterventionImage
    {
        // Increase contrast
        $image->contrast(30);

        // Boost saturation
        $image->colorize(0, 0, 0)->contrast(25);

        // Edge enhancement
        $image->sharpen(80);

        return $image;
    }

    /**
     * Apply impressionist style
     */
    protected function applyImpressionistStyle(InterventionImage $image): InterventionImage
    {
        // Oil painting effect
        $image = $this->imageProcessor->oilPainting($image, 7.0);

        // Enhance colors
        $image = $this->restoreColors($image, EnhancementLevel::MEDIUM);

        return $image;
    }

    /**
     * Apply baroque style (dramatic lighting)
     */
    protected function applyBaroqueStyle(InterventionImage $image): InterventionImage
    {
        // Increase contrast dramatically
        $image->contrast(40);

        // Darken overall
        $image->brightness(-10);

        // Create dramatic lighting with vignette
        $this->applyVignette($image, 0.5);

        return $image;
    }

    /**
     * Apply renaissance style
     */
    protected function applyRenaissanceStyle(InterventionImage $image): InterventionImage
    {
        // Balanced colors and soft edges
        $image = $this->imageProcessor->bilateralFilter($image, 7);

        // Subtle color enhancement
        $image = $this->restoreColors($image, EnhancementLevel::MEDIUM);

        // Add warm tone
        $image->colorize(10, -5, -10);

        return $image;
    }

    /**
     * Apply abstract style
     */
    protected function applyAbstractStyle(InterventionImage $image): InterventionImage
    {
        // Bold colors
        $image->contrast(50);
        $image->colorize(0, 0, 0)->contrast(40);

        // Posterize effect
        $image->limitColors(32);

        return $image;
    }

    /**
     * Apply minimalist style
     */
    protected function applyMinimalistStyle(InterventionImage $image): InterventionImage
    {
        // Reduce color palette
        $image->limitColors(16);

        // Increase contrast for clean lines
        $image->contrast(20);

        // Slight desaturation
        $image->greyscale()->colorize(0, 0, 0, 0.3);

        return $image;
    }

    /**
     * Apply sepia tone
     */
    protected function applySepiaTone(InterventionImage $image): InterventionImage
    {
        $image->colorize(38, 27, 12);
        return $image;
    }

    /**
     * Apply vintage coloring
     */
    protected function applyVintageColor(InterventionImage $image): InterventionImage
    {
        $image->colorize(30, 10, -10);
        $image->contrast(-10);
        return $image;
    }

    /**
     * Apply warm tone
     */
    protected function applyWarmTone(InterventionImage $image): InterventionImage
    {
        $image->colorize(20, 0, -15);
        return $image;
    }

    /**
     * Apply vignette effect
     */
    protected function applyVignette(InterventionImage &$image, float $strength = 0.3): void
    {
        $width = $image->width();
        $height = $image->height();

        // Create vignette overlay
        $vignette = \Intervention\Image\Facades\Image::canvas($width, $height, '#000000');

        // Create radial gradient (simulated with ellipse)
        $vignette->ellipse(
            (int)($width * 1.5),
            (int)($height * 1.5),
            (int)($width / 2),
            (int)($height / 2),
            function ($draw) {
                $draw->background('#ffffff');
            }
        );

        $vignette->blur(50);

        // Blend with original
        $image->insert($vignette, 'top-left', 0, 0);
    }

    /**
     * Tone mapping for HDR
     */
    protected function toneMapping(InterventionImage &$image): void
    {
        // This is a simplified tone mapping
        // In production, you'd use more sophisticated algorithms

        $image->gamma(0.8); // Boost shadows
        $image->brightness(10);
        $image->contrast(20);
    }

    /**
     * Detect bright spots
     */
    protected function detectBrightSpots(Imagick $gray): int
    {
        $clone = clone $gray;
        $clone->thresholdImage(240 * 255);

        // Count white pixels
        $histogram = $clone->getImageHistogram();
        $whitePixels = 0;

        foreach ($histogram as $pixel) {
            $color = $pixel->getColor();
            if ($color['r'] > 250) {
                $whitePixels += $pixel->getColorCount();
            }
        }

        return $whitePixels;
    }

    /**
     * Detect dark spots
     */
    protected function detectDarkSpots(Imagick $gray): int
    {
        $clone = clone $gray;
        $clone->thresholdImage(15 * 255);
        $clone->negateImage(false);

        $histogram = $clone->getImageHistogram();
        $darkPixels = 0;

        foreach ($histogram as $pixel) {
            $color = $pixel->getColor();
            if ($color['r'] < 20) {
                $darkPixels += $pixel->getColorCount();
            }
        }

        return $darkPixels;
    }

    /**
     * Detect scratches using edge detection
     */
    protected function detectScratches(Imagick $imagick): int
    {
        $clone = clone $imagick;
        $clone->edgeImage(1);

        $histogram = $clone->getImageHistogram();
        $edgePixels = 0;

        foreach ($histogram as $pixel) {
            $color = $pixel->getColor();
            if ($color['r'] > 128) {
                $edgePixels += $pixel->getColorCount();
            }
        }

        return $edgePixels;
    }

    /**
     * Get damage severity level
     */
    protected function getDamageSeverity(float $percentage): string
    {
        return match(true) {
            $percentage < 1 => 'minimal',
            $percentage < 5 => 'low',
            $percentage < 15 => 'moderate',
            $percentage < 30 => 'high',
            default => 'severe'
        };
    }
}
