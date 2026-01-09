<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\RestorationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'AI Recoverify Arts - PHP/Laravel',
        'version' => '2.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Restoration API routes
Route::prefix('restoration')->group(function () {

    // Job operations
    Route::post('/restore', [RestorationController::class, 'restore'])
        ->name('api.restoration.restore');

    Route::post('/super-resolution', [RestorationController::class, 'superResolution'])
        ->name('api.restoration.superResolution');

    Route::post('/colorize', [RestorationController::class, 'colorize'])
        ->name('api.restoration.colorize');

    Route::post('/style-transfer', [RestorationController::class, 'styleTransfer'])
        ->name('api.restoration.styleTransfer');

    Route::post('/detect-damage', [RestorationController::class, 'detectDamage'])
        ->name('api.restoration.detectDamage');

    // Job status and results
    Route::get('/jobs', [RestorationController::class, 'list'])
        ->name('api.restoration.list');

    Route::get('/{job}/status', [RestorationController::class, 'status'])
        ->name('api.restoration.status');

    Route::get('/{job}/download', [RestorationController::class, 'download'])
        ->name('api.restoration.download');
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/user/generate-api-key', function (Request $request) {
        $apiKey = $request->user()->generateApiKey();

        return response()->json([
            'success' => true,
            'api_key' => $apiKey,
        ]);
    });
});
