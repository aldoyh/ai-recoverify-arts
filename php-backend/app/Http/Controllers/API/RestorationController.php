<?php

namespace App\Http\Controllers\API;

use App\Models\{RestorationJob, ProcessingMode, ProcessingStatus};
use App\Services\{ArtRestorerService, ImageProcessorService};
use App\Jobs\ProcessRestorationJob;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\{Storage, Validator, Log};
use Illuminate\Support\Str;

/**
 * Restoration API Controller
 *
 * Handles all image restoration API endpoints
 */
class RestorationController extends Controller
{
    public function __construct(
        protected ArtRestorerService $artRestorer,
        protected ImageProcessorService $imageProcessor
    ) {}

    /**
     * Create a new restoration job
     *
     * POST /api/restore
     */
    public function restore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,bmp,tiff,webp|max:16384',
            'enhancement_level' => 'sometimes|string|in:low,medium,high,ultra',
            'denoise_strength' => 'sometimes|numeric|min:0|max:1',
            'sharpen' => 'sometimes|boolean',
            'color_correction' => 'sometimes|boolean',
            'damage_repair' => 'sometimes|boolean',
            'webhook_url' => 'sometimes|url',
            'async' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check user quota
            if ($request->user() && !$request->user()->hasQuotaAvailable()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Daily quota exceeded'
                ], 429);
            }

            $file = $request->file('file');
            $timestamp = now()->format('YmdHis');
            $filename = $timestamp . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();

            // Store uploaded file
            $inputPath = $file->storeAs('input', $filename, 'public');
            $fullInputPath = Storage::disk('public')->path($inputPath);

            // Get file info
            $fileSize = $file->getSize();
            $dimensions = $this->imageProcessor->getDimensions($fullInputPath);

            // Create job record
            $job = RestorationJob::create([
                'user_id' => $request->user()?->id,
                'api_key' => $request->bearerToken(),
                'input_filename' => $file->getClientOriginalName(),
                'input_path' => $fullInputPath,
                'input_size' => $fileSize,
                'input_dimensions' => $dimensions,
                'mode' => ProcessingMode::STANDARD,
                'parameters' => [
                    'enhancement_level' => $request->input('enhancement_level', 'medium'),
                    'denoise_strength' => $request->input('denoise_strength', 0.5),
                    'sharpen' => $request->input('sharpen', true),
                    'color_correction' => $request->input('color_correction', true),
                    'damage_repair' => $request->input('damage_repair', true),
                ],
                'output_filename' => 'restored_' . $filename,
                'webhook_url' => $request->input('webhook_url'),
            ]);

            // Increment user quota
            if ($request->user()) {
                $request->user()->incrementQuota();
            }

            // Process asynchronously or synchronously
            if ($request->input('async', true)) {
                // Dispatch to queue
                ProcessRestorationJob::dispatch($job);

                return response()->json([
                    'success' => true,
                    'message' => 'Restoration job queued successfully',
                    'job_id' => $job->id,
                    'status' => $job->status->value,
                    'status_url' => route('api.restoration.status', $job->id),
                ], 202);
            } else {
                // Process immediately
                $this->processJobSync($job);

                return response()->json([
                    'success' => true,
                    'message' => 'Restoration completed successfully',
                    'job_id' => $job->id,
                    'output_file' => $job->output_filename,
                    'download_url' => route('api.restoration.download', $job->id),
                    'processing_time' => $job->processing_time,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Restoration failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Super resolution endpoint
     *
     * POST /api/super-resolution
     */
    public function superResolution(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,bmp,tiff,webp|max:16384',
            'scale' => 'sometimes|integer|in:2,4',
            'async' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        return $this->processMode($request, ProcessingMode::SUPER_RESOLUTION);
    }

    /**
     * Colorization endpoint
     *
     * POST /api/colorize
     */
    public function colorize(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,bmp,tiff,webp|max:16384',
            'method' => 'sometimes|string|in:sepia,vintage,warm',
            'async' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        return $this->processMode($request, ProcessingMode::COLORIZATION);
    }

    /**
     * Style transfer endpoint
     *
     * POST /api/style-transfer
     */
    public function styleTransfer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,bmp,tiff,webp|max:16384',
            'style' => 'required|string|in:classical,modern,impressionist,baroque,renaissance,abstract,minimalist',
            'async' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        return $this->processMode($request, ProcessingMode::STYLE_TRANSFER);
    }

    /**
     * Damage detection endpoint
     *
     * POST /api/detect-damage
     */
    public function detectDamage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,bmp,tiff,webp|max:16384',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $tempPath = $file->storeAs('temp', Str::random(16) . '.' . $file->getClientOriginalExtension(), 'local');
            $fullPath = Storage::disk('local')->path($tempPath);

            $damageInfo = $this->artRestorer->detectDamage($fullPath);

            // Clean up temp file
            Storage::disk('local')->delete($tempPath);

            return response()->json([
                'success' => true,
                'damage_info' => $damageInfo,
            ]);

        } catch (\Exception $e) {
            Log::error('Damage detection failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get job status
     *
     * GET /api/restoration/{job}/status
     */
    public function status(RestorationJob $job): JsonResponse
    {
        return response()->json([
            'success' => true,
            'job' => [
                'id' => $job->id,
                'status' => $job->status->value,
                'progress' => $job->progress,
                'mode' => $job->mode->value,
                'created_at' => $job->created_at->toIso8601String(),
                'started_at' => $job->started_at?->toIso8601String(),
                'completed_at' => $job->completed_at?->toIso8601String(),
                'processing_time' => $job->processing_time,
                'error_message' => $job->error_message,
                'download_url' => $job->isCompleted()
                    ? route('api.restoration.download', $job->id)
                    : null,
            ],
        ]);
    }

    /**
     * Download restored image
     *
     * GET /api/restoration/{job}/download
     */
    public function download(RestorationJob $job)
    {
        if (!$job->isCompleted()) {
            return response()->json([
                'success' => false,
                'error' => 'Job not completed yet'
            ], 400);
        }

        if (!file_exists($job->output_path)) {
            return response()->json([
                'success' => false,
                'error' => 'Output file not found'
            ], 404);
        }

        return response()->download($job->output_path, $job->output_filename);
    }

    /**
     * List user's restoration jobs
     *
     * GET /api/restoration/jobs
     */
    public function list(Request $request): JsonResponse
    {
        $query = RestorationJob::query();

        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        }

        $jobs = $query->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'jobs' => $jobs->items(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    /**
     * Process job with specific mode
     */
    protected function processMode(Request $request, ProcessingMode $mode): JsonResponse
    {
        try {
            $file = $request->file('file');
            $timestamp = now()->format('YmdHis');
            $filename = $timestamp . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();

            $inputPath = $file->storeAs('input', $filename, 'public');
            $fullInputPath = Storage::disk('public')->path($inputPath);

            $fileSize = $file->getSize();
            $dimensions = $this->imageProcessor->getDimensions($fullInputPath);

            $job = RestorationJob::create([
                'user_id' => $request->user()?->id,
                'input_filename' => $file->getClientOriginalName(),
                'input_path' => $fullInputPath,
                'input_size' => $fileSize,
                'input_dimensions' => $dimensions,
                'mode' => $mode,
                'parameters' => $request->except(['file', 'async']),
                'output_filename' => $mode->value . '_' . $filename,
            ]);

            if ($request->input('async', true)) {
                ProcessRestorationJob::dispatch($job);

                return response()->json([
                    'success' => true,
                    'message' => 'Job queued successfully',
                    'job_id' => $job->id,
                    'status_url' => route('api.restoration.status', $job->id),
                ], 202);
            } else {
                $this->processJobSync($job);

                return response()->json([
                    'success' => true,
                    'job_id' => $job->id,
                    'download_url' => route('api.restoration.download', $job->id),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Processing failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process job synchronously
     */
    protected function processJobSync(RestorationJob $job): void
    {
        $job->markAsStarted();

        try {
            $outputPath = Storage::disk('public')->path('output/' . $job->output_filename);

            $result = match($job->mode) {
                ProcessingMode::STANDARD => $this->artRestorer->restore(
                    $job->input_path,
                    \App\Models\EnhancementLevel::from($job->parameters['enhancement_level'] ?? 'medium'),
                    $job->parameters['denoise_strength'] ?? 0.5,
                    $job->parameters['sharpen'] ?? true,
                    $job->parameters['color_correction'] ?? true,
                    $job->parameters['damage_repair'] ?? true
                ),
                ProcessingMode::SUPER_RESOLUTION => $this->artRestorer->superResolution(
                    $job->input_path,
                    $job->parameters['scale'] ?? 2
                ),
                ProcessingMode::COLORIZATION => $this->artRestorer->colorize(
                    $job->input_path,
                    $job->parameters['method'] ?? 'sepia'
                ),
                ProcessingMode::STYLE_TRANSFER => $this->artRestorer->styleTransfer(
                    $job->input_path,
                    \App\Models\StyleType::from($job->parameters['style'])
                ),
                default => throw new \Exception('Unsupported processing mode')
            };

            $this->imageProcessor->saveImage($result, $outputPath);

            $outputSize = filesize($outputPath);
            $outputDimensions = $this->imageProcessor->getDimensions($outputPath);

            $job->markAsCompleted([
                'output_path' => $outputPath,
                'output_size' => $outputSize,
                'output_dimensions' => $outputDimensions,
                'processing_time' => $job->calculateProcessingTime(),
            ]);

        } catch (\Exception $e) {
            $job->markAsFailed($e->getMessage());
            throw $e;
        }
    }
}
