<?php

namespace App\Jobs;

use App\Models\{RestorationJob, ProcessingMode, ProcessingStatus, EnhancementLevel, StyleType};
use App\Services\{ArtRestorerService, ImageProcessorService};
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\{InteractsWithQueue, SerializesModels};
use Illuminate\Support\Facades\{Log, Storage, Http};

/**
 * Process Restoration Job
 *
 * Handles asynchronous image restoration processing
 */
class ProcessRestorationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 minutes
    public int $tries = 3;
    public int $backoff = 60; // 1 minute between retries

    /**
     * Create a new job instance
     */
    public function __construct(
        public RestorationJob $job
    ) {}

    /**
     * Execute the job
     */
    public function handle(
        ArtRestorerService $artRestorer,
        ImageProcessorService $imageProcessor
    ): void {
        Log::info('Processing restoration job', ['job_id' => $this->job->id]);

        $this->job->markAsStarted();

        try {
            // Update progress
            $this->job->updateProgress(10);

            $outputDir = Storage::disk('public')->path('output');
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $outputPath = $outputDir . '/' . $this->job->output_filename;

            // Process based on mode
            $this->job->updateProgress(20);

            $result = match($this->job->mode) {
                ProcessingMode::STANDARD => $this->processStandard($artRestorer),
                ProcessingMode::ADVANCED => $this->processAdvanced($artRestorer),
                ProcessingMode::SUPER_RESOLUTION => $this->processSuperResolution($artRestorer),
                ProcessingMode::COLORIZATION => $this->processColorization($artRestorer),
                ProcessingMode::STYLE_TRANSFER => $this->processStyleTransfer($artRestorer),
                ProcessingMode::HDR => $this->processHDR($artRestorer),
                default => throw new \Exception('Unsupported processing mode: ' . $this->job->mode->value)
            };

            $this->job->updateProgress(80);

            // Save result
            $imageProcessor->saveImage($result, $outputPath);

            $this->job->updateProgress(90);

            // Get output info
            $outputSize = filesize($outputPath);
            $outputDimensions = $imageProcessor->getDimensions($outputPath);

            // Mark as completed
            $this->job->markAsCompleted([
                'output_path' => $outputPath,
                'output_size' => $outputSize,
                'output_dimensions' => $outputDimensions,
                'processing_time' => $this->job->calculateProcessingTime(),
            ]);

            Log::info('Restoration job completed', [
                'job_id' => $this->job->id,
                'processing_time' => $this->job->processing_time
            ]);

            // Send webhook if configured
            if ($this->job->webhook_url) {
                $this->sendWebhook();
            }

        } catch (\Exception $e) {
            Log::error('Restoration job failed', [
                'job_id' => $this->job->id,
                'error' => $e->getMessage()
            ]);

            $this->job->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Process standard restoration
     */
    protected function processStandard(ArtRestorerService $artRestorer)
    {
        $params = $this->job->parameters;

        return $artRestorer->restore(
            $this->job->input_path,
            EnhancementLevel::from($params['enhancement_level'] ?? 'medium'),
            $params['denoise_strength'] ?? 0.5,
            $params['sharpen'] ?? true,
            $params['color_correction'] ?? true,
            $params['damage_repair'] ?? true
        );
    }

    /**
     * Process advanced restoration
     */
    protected function processAdvanced(ArtRestorerService $artRestorer)
    {
        // Advanced mode with all features enabled
        return $artRestorer->restore(
            $this->job->input_path,
            EnhancementLevel::ULTRA,
            0.8,
            true,
            true,
            true
        );
    }

    /**
     * Process super resolution
     */
    protected function processSuperResolution(ArtRestorerService $artRestorer)
    {
        $scale = $this->job->parameters['scale'] ?? 2;
        return $artRestorer->superResolution($this->job->input_path, $scale);
    }

    /**
     * Process colorization
     */
    protected function processColorization(ArtRestorerService $artRestorer)
    {
        $method = $this->job->parameters['method'] ?? 'sepia';
        return $artRestorer->colorize($this->job->input_path, $method);
    }

    /**
     * Process style transfer
     */
    protected function processStyleTransfer(ArtRestorerService $artRestorer)
    {
        $style = StyleType::from($this->job->parameters['style']);
        return $artRestorer->styleTransfer($this->job->input_path, $style);
    }

    /**
     * Process HDR
     */
    protected function processHDR(ArtRestorerService $artRestorer)
    {
        return $artRestorer->createHDR($this->job->input_path);
    }

    /**
     * Send webhook notification
     */
    protected function sendWebhook(): void
    {
        try {
            $payload = [
                'job_id' => $this->job->id,
                'status' => $this->job->status->value,
                'mode' => $this->job->mode->value,
                'output_filename' => $this->job->output_filename,
                'processing_time' => $this->job->processing_time,
                'completed_at' => $this->job->completed_at?->toIso8601String(),
            ];

            $response = Http::timeout(10)
                ->post($this->job->webhook_url, $payload);

            if ($response->successful()) {
                $this->job->update(['webhook_sent' => true]);
                Log::info('Webhook sent successfully', ['job_id' => $this->job->id]);
            } else {
                Log::warning('Webhook failed', [
                    'job_id' => $this->job->id,
                    'status' => $response->status()
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Webhook error', [
                'job_id' => $this->job->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job permanently failed', [
            'job_id' => $this->job->id,
            'error' => $exception->getMessage()
        ]);

        $this->job->markAsFailed($exception->getMessage());

        // Send failure webhook
        if ($this->job->webhook_url) {
            try {
                Http::timeout(10)->post($this->job->webhook_url, [
                    'job_id' => $this->job->id,
                    'status' => 'failed',
                    'error' => $exception->getMessage(),
                ]);
            } catch (\Exception $e) {
                // Ignore webhook errors on failure
            }
        }
    }
}
