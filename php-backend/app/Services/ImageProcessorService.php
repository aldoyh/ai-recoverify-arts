<?php

namespace App\Services;

use Intervention\Image\Facades\Image;
use Intervention\Image\Image as InterventionImage;
use Imagick;
use ImagickPixel;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Advanced Image Processor Service
 *
 * Handles all image processing operations with PHP GD and Imagick
 */
class ImageProcessorService
{
    protected bool $useImagick;

    public function __construct()
    {
        $this->useImagick = extension_loaded('imagick');

        if (!$this->useImagick && !extension_loaded('gd')) {
            throw new Exception('Neither Imagick nor GD extension is available');
        }

        Log::info('ImageProcessor initialized', ['driver' => $this->useImagick ? 'Imagick' : 'GD']);
    }

    /**
     * Load image from file
     */
    public function loadImage(string $path): InterventionImage
    {
        if (!file_exists($path)) {
            throw new Exception("Image file not found: {$path}");
        }

        return Image::make($path);
    }

    /**
     * Save image to file
     */
    public function saveImage(InterventionImage $image, string $path, int $quality = 90): void
    {
        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $image->save($path, $quality);
        Log::info('Image saved', ['path' => $path, 'size' => filesize($path)]);
    }

    /**
     * Enhance image with brightness, contrast, and saturation
     */
    public function enhance(
        string $imagePath,
        float $brightness = 1.0,
        float $contrast = 1.0,
        float $saturation = 1.0
    ): InterventionImage {
        $image = $this->loadImage($imagePath);

        // Apply brightness
        if ($brightness !== 1.0) {
            $brightnessValue = (int)(($brightness - 1.0) * 100);
            $image->brightness($brightnessValue);
        }

        // Apply contrast
        if ($contrast !== 1.0) {
            $contrastValue = (int)(($contrast - 1.0) * 100);
            $image->contrast($contrastValue);
        }

        // Apply saturation using Imagick if available
        if ($saturation !== 1.0 && $this->useImagick) {
            $this->adjustSaturation($image, $saturation);
        }

        return $image;
    }

    /**
     * Denoise image
     */
    public function denoise(InterventionImage $image, float $strength = 0.5): InterventionImage
    {
        if (!$this->useImagick) {
            // Fallback to blur for GD
            $blurAmount = (int)($strength * 5);
            $image->blur($blurAmount);
            return $image;
        }

        $imagick = $this->toImagick($image);

        // Reduce noise
        $radius = $strength * 3;
        $imagick->reduceNoiseImage($radius);

        // Enhanced noise reduction
        $imagick->enhanceImage();

        return $this->fromImagick($imagick);
    }

    /**
     * Sharpen image
     */
    public function sharpen(InterventionImage $image, float $amount = 1.0): InterventionImage
    {
        if (!$this->useImagick) {
            $sharpenValue = (int)($amount * 100);
            $image->sharpen($sharpenValue);
            return $image;
        }

        $imagick = $this->toImagick($image);

        // Unsharp mask for better quality
        $radius = 0;
        $sigma = $amount;
        $amountVal = $amount * 1.5;
        $threshold = 0.05;

        $imagick->unsharpMaskImage($radius, $sigma, $amountVal, $threshold);

        return $this->fromImagick($imagick);
    }

    /**
     * Adjust gamma
     */
    public function adjustGamma(InterventionImage $image, float $gamma = 1.0): InterventionImage
    {
        if (!$this->useImagick) {
            $image->gamma($gamma);
            return $image;
        }

        $imagick = $this->toImagick($imagick);
        $imagick->gammaImage($gamma);

        return $this->fromImagick($imagick);
    }

    /**
     * Auto color balance
     */
    public function autoColorBalance(InterventionImage $image): InterventionImage
    {
        if (!$this->useImagick) {
            // Basic auto-level for GD
            $image->brightness(0);
            $image->contrast(10);
            return $image;
        }

        $imagick = $this->toImagick($image);

        // Auto level
        $imagick->autoLevelImage();

        // Normalize
        $imagick->normalizeImage();

        // White balance
        $imagick->whiteThresholdImage('white');

        return $this->fromImagick($imagick);
    }

    /**
     * Resize image
     */
    public function resize(
        InterventionImage $image,
        ?int $width = null,
        ?int $height = null,
        bool $maintainAspect = true
    ): InterventionImage {
        if ($maintainAspect) {
            $image->resize($width, $height, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        } else {
            $image->resize($width, $height);
        }

        return $image;
    }

    /**
     * Apply bilateral filter (edge-preserving smoothing)
     */
    public function bilateralFilter(InterventionImage $image, int $diameter = 9): InterventionImage
    {
        if (!$this->useImagick) {
            // Fallback to selective blur for GD
            $image->blur(2);
            return $image;
        }

        $imagick = $this->toImagick($image);

        // Use morphology for edge-preserving blur
        $imagick->morphology(
            Imagick::MORPHOLOGY_CLOSE,
            $diameter,
            $imagick::KERNEL_DISK
        );

        return $this->fromImagick($imagick);
    }

    /**
     * Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
     */
    public function applyCLAHE(InterventionImage $image, float $clipLimit = 2.0): InterventionImage
    {
        if (!$this->useImagick) {
            // Fallback to regular contrast
            $image->contrast(20);
            return $image;
        }

        $imagick = $this->toImagick($image);

        // Adaptive histogram equalization
        $imagick->contrastStretchImage(0, 0);
        $imagick->equalizeImage();

        return $this->fromImagick($imagick);
    }

    /**
     * Detect edges
     */
    public function detectEdges(InterventionImage $image, float $radius = 1.0): Imagick
    {
        if (!$this->useImagick) {
            throw new Exception('Edge detection requires Imagick extension');
        }

        $imagick = $this->toImagick($image);
        $imagick->edgeImage($radius);

        return $imagick;
    }

    /**
     * Apply oil painting effect
     */
    public function oilPainting(InterventionImage $image, float $radius = 7.0): InterventionImage
    {
        if (!$this->useImagick) {
            // Fallback to pixelate for GD
            $image->pixelate(10);
            return $image;
        }

        $imagick = $this->toImagick($image);
        $imagick->oilPaintImage($radius);

        return $this->fromImagick($imagick);
    }

    /**
     * Adjust saturation
     */
    protected function adjustSaturation(InterventionImage &$image, float $saturation): void
    {
        if (!$this->useImagick) {
            return;
        }

        $imagick = $this->toImagick($image);
        $imagick->modulateImage(100, $saturation * 100, 100);
        $image = $this->fromImagick($imagick);
    }

    /**
     * Convert Intervention Image to Imagick
     */
    protected function toImagick(InterventionImage $image): Imagick
    {
        $imagick = new Imagick();
        $imagick->readImageBlob($image->encode()->getEncoded());
        return $imagick;
    }

    /**
     * Convert Imagick to Intervention Image
     */
    protected function fromImagick(Imagick $imagick): InterventionImage
    {
        return Image::make($imagick->getImageBlob());
    }

    /**
     * Get image dimensions
     */
    public function getDimensions(string $path): array
    {
        $image = $this->loadImage($path);

        return [
            'width' => $image->width(),
            'height' => $image->height(),
        ];
    }

    /**
     * Create thumbnail
     */
    public function createThumbnail(
        string $sourcePath,
        string $destinationPath,
        int $width = 200,
        int $height = 200
    ): void {
        $image = $this->loadImage($sourcePath);
        $image->fit($width, $height);
        $this->saveImage($image, $destinationPath);
    }
}
