<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * RestorationJob Model
 *
 * Tracks all image restoration jobs with complete metadata
 *
 * @property string $id
 * @property string $user_id
 * @property string $api_key
 * @property string $input_filename
 * @property string $input_path
 * @property int $input_size
 * @property array $input_dimensions
 * @property ProcessingMode $mode
 * @property array $parameters
 * @property string|null $output_filename
 * @property string|null $output_path
 * @property int|null $output_size
 * @property array|null $output_dimensions
 * @property ProcessingStatus $status
 * @property float $progress
 * @property string|null $error_message
 * @property float|null $processing_time
 * @property float|null $quality_score
 * @property float|null $improvement_score
 * @property string|null $webhook_url
 * @property bool $webhook_sent
 */
class RestorationJob extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $fillable = [
        'user_id',
        'api_key',
        'input_filename',
        'input_path',
        'input_size',
        'input_dimensions',
        'mode',
        'parameters',
        'output_filename',
        'output_path',
        'output_size',
        'output_dimensions',
        'status',
        'progress',
        'error_message',
        'processing_time',
        'quality_score',
        'improvement_score',
        'webhook_url',
        'webhook_sent',
    ];

    protected $casts = [
        'input_dimensions' => 'array',
        'parameters' => 'array',
        'output_dimensions' => 'array',
        'mode' => ProcessingMode::class,
        'status' => ProcessingStatus::class,
        'progress' => 'float',
        'processing_time' => 'float',
        'quality_score' => 'float',
        'improvement_score' => 'float',
        'webhook_sent' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => ProcessingStatus::PENDING,
        'progress' => 0.0,
        'webhook_sent' => false,
    ];

    /**
     * Get the user that owns the job
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for pending jobs
     */
    public function scopePending($query)
    {
        return $query->where('status', ProcessingStatus::PENDING);
    }

    /**
     * Scope for processing jobs
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', ProcessingStatus::PROCESSING);
    }

    /**
     * Scope for completed jobs
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', ProcessingStatus::COMPLETED);
    }

    /**
     * Scope for failed jobs
     */
    public function scopeFailed($query)
    {
        return $query->where('status', ProcessingStatus::FAILED);
    }

    /**
     * Check if job is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === ProcessingStatus::COMPLETED;
    }

    /**
     * Check if job is failed
     */
    public function isFailed(): bool
    {
        return $this->status === ProcessingStatus::FAILED;
    }

    /**
     * Check if job is processing
     */
    public function isProcessing(): bool
    {
        return $this->status === ProcessingStatus::PROCESSING;
    }

    /**
     * Mark job as started
     */
    public function markAsStarted(): void
    {
        $this->update([
            'status' => ProcessingStatus::PROCESSING,
            'started_at' => now(),
        ]);
    }

    /**
     * Mark job as completed
     */
    public function markAsCompleted(array $data = []): void
    {
        $this->update(array_merge($data, [
            'status' => ProcessingStatus::COMPLETED,
            'completed_at' => now(),
            'progress' => 100.0,
        ]));
    }

    /**
     * Mark job as failed
     */
    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => ProcessingStatus::FAILED,
            'error_message' => $error,
            'completed_at' => now(),
        ]);
    }

    /**
     * Update progress
     */
    public function updateProgress(float $progress): void
    {
        $this->update(['progress' => min(100.0, max(0.0, $progress))]);
    }

    /**
     * Calculate processing time
     */
    public function calculateProcessingTime(): ?float
    {
        if ($this->started_at && $this->completed_at) {
            return $this->completed_at->diffInSeconds($this->started_at);
        }
        return null;
    }
}
