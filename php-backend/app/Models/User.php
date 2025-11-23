<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * User Model
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property string|null $api_key
 * @property bool $is_active
 * @property bool $is_admin
 * @property int $daily_quota
 * @property int $used_quota
 * @property \DateTime|null $quota_reset_at
 * @property \DateTime|null $last_login_at
 * @property \DateTime|null $last_request_at
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'api_key',
        'is_active',
        'is_admin',
        'daily_quota',
        'used_quota',
        'quota_reset_at',
        'last_login_at',
        'last_request_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'is_admin' => 'boolean',
        'daily_quota' => 'integer',
        'used_quota' => 'integer',
        'quota_reset_at' => 'datetime',
        'last_login_at' => 'datetime',
        'last_request_at' => 'datetime',
    ];

    protected $attributes = [
        'is_active' => true,
        'is_admin' => false,
        'daily_quota' => 100,
        'used_quota' => 0,
    ];

    /**
     * Get restoration jobs for this user
     */
    public function restorationJobs()
    {
        return $this->hasMany(RestorationJob::class);
    }

    /**
     * Generate a new API key
     */
    public function generateApiKey(): string
    {
        $apiKey = bin2hex(random_bytes(32));
        $this->update(['api_key' => $apiKey]);
        return $apiKey;
    }

    /**
     * Check if user has quota available
     */
    public function hasQuotaAvailable(): bool
    {
        $this->resetQuotaIfNeeded();
        return $this->used_quota < $this->daily_quota;
    }

    /**
     * Increment quota usage
     */
    public function incrementQuota(): void
    {
        $this->resetQuotaIfNeeded();
        $this->increment('used_quota');
        $this->update(['last_request_at' => now()]);
    }

    /**
     * Reset quota if needed
     */
    protected function resetQuotaIfNeeded(): void
    {
        if (!$this->quota_reset_at || $this->quota_reset_at->isPast()) {
            $this->update([
                'used_quota' => 0,
                'quota_reset_at' => now()->addDay(),
            ]);
        }
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->is_admin;
    }

    /**
     * Update last login timestamp
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    /**
     * Scope for active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for admin users
     */
    public function scopeAdmins($query)
    {
        return $query->where('is_admin', true);
    }
}
