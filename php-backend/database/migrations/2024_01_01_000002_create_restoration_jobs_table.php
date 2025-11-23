<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('restoration_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('api_key', 64)->nullable();

            // Input information
            $table->string('input_filename');
            $table->string('input_path', 512);
            $table->bigInteger('input_size');
            $table->json('input_dimensions')->nullable();

            // Processing parameters
            $table->string('mode')->default('standard');
            $table->json('parameters')->nullable();

            // Output information
            $table->string('output_filename')->nullable();
            $table->string('output_path', 512)->nullable();
            $table->bigInteger('output_size')->nullable();
            $table->json('output_dimensions')->nullable();

            // Processing metadata
            $table->string('status')->default('pending');
            $table->decimal('progress', 5, 2)->default(0);
            $table->text('error_message')->nullable();

            // Timing information
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('processing_time', 10, 3)->nullable();

            // Quality metrics
            $table->decimal('quality_score', 5, 2)->nullable();
            $table->decimal('improvement_score', 5, 2)->nullable();

            // Webhook
            $table->string('webhook_url', 512)->nullable();
            $table->boolean('webhook_sent')->default(false);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['user_id', 'created_at']);
            $table->index('status');
            $table->index('mode');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restoration_jobs');
    }
};
