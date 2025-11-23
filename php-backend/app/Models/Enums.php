<?php

namespace App\Models;

/**
 * Processing Status Enum
 */
enum ProcessingStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';

    /**
     * Get all values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get color for status
     */
    public function color(): string
    {
        return match($this) {
            self::PENDING => 'gray',
            self::PROCESSING => 'blue',
            self::COMPLETED => 'green',
            self::FAILED => 'red',
            self::CANCELLED => 'orange',
        };
    }

    /**
     * Check if status is final
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::COMPLETED, self::FAILED, self::CANCELLED]);
    }
}

/**
 * Processing Mode Enum
 */
enum ProcessingMode: string
{
    case STANDARD = 'standard';
    case ADVANCED = 'advanced';
    case COLORIZATION = 'colorization';
    case SUPER_RESOLUTION = 'super_resolution';
    case STYLE_TRANSFER = 'style_transfer';
    case BATCH = 'batch';
    case DAMAGE_DETECTION = 'damage_detection';
    case HDR = 'hdr';
    case PANORAMA = 'panorama';

    /**
     * Get all values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get description
     */
    public function description(): string
    {
        return match($this) {
            self::STANDARD => 'Standard restoration with damage repair',
            self::ADVANCED => 'Advanced restoration with AI enhancement',
            self::COLORIZATION => 'Black and white to color conversion',
            self::SUPER_RESOLUTION => 'Increase image resolution (2x/4x)',
            self::STYLE_TRANSFER => 'Apply artistic style transfer',
            self::BATCH => 'Process multiple images',
            self::DAMAGE_DETECTION => 'Detect and analyze damage',
            self::HDR => 'High Dynamic Range enhancement',
            self::PANORAMA => 'Create panorama from multiple images',
        };
    }

    /**
     * Check if mode requires multiple images
     */
    public function requiresMultipleImages(): bool
    {
        return in_array($this, [self::BATCH, self::PANORAMA]);
    }
}

/**
 * Enhancement Level Enum
 */
enum EnhancementLevel: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case ULTRA = 'ultra';

    /**
     * Get processing parameters for level
     */
    public function parameters(): array
    {
        return match($this) {
            self::LOW => ['gamma' => 1.05, 'contrast' => 1.05, 'saturation' => 1.1, 'sharpen' => 0.3],
            self::MEDIUM => ['gamma' => 1.1, 'contrast' => 1.1, 'saturation' => 1.2, 'sharpen' => 0.5],
            self::HIGH => ['gamma' => 1.15, 'contrast' => 1.15, 'saturation' => 1.3, 'sharpen' => 0.7],
            self::ULTRA => ['gamma' => 1.2, 'contrast' => 1.2, 'saturation' => 1.4, 'sharpen' => 0.9],
        };
    }
}

/**
 * Style Type Enum
 */
enum StyleType: string
{
    case CLASSICAL = 'classical';
    case MODERN = 'modern';
    case IMPRESSIONIST = 'impressionist';
    case BAROQUE = 'baroque';
    case RENAISSANCE = 'renaissance';
    case ABSTRACT = 'abstract';
    case MINIMALIST = 'minimalist';

    /**
     * Get description
     */
    public function description(): string
    {
        return match($this) {
            self::CLASSICAL => 'Classical painting style with smooth edges',
            self::MODERN => 'Modern art with high contrast',
            self::IMPRESSIONIST => 'Impressionist style with brush strokes',
            self::BAROQUE => 'Baroque style with dramatic lighting',
            self::RENAISSANCE => 'Renaissance style with balanced composition',
            self::ABSTRACT => 'Abstract art with bold colors',
            self::MINIMALIST => 'Minimalist style with clean lines',
        };
    }
}
