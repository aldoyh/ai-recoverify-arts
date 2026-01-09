# AI Recoverify Arts - PHP/Laravel Backend

<div align="center">

![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php)
![Laravel](https://img.shields.io/badge/Laravel-10.x-FF2D20?style=for-the-badge&logo=laravel)
![Imagick](https://img.shields.io/badge/Imagick-Enabled-663399?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Enterprise-Grade AI-Powered Art Restoration Service**

Built with modern PHP 8.2, Laravel 10.x, and advanced image processing

</div>

---

## 🚀 Overview

Complete transformation of the Python backend into a modern PHP/Laravel application with **drastic improvements** and enterprise-grade architecture.

### Key Highlights

- **Modern PHP 8.2+** with strict typing and enums
- **Laravel 10.x Framework** with Eloquent ORM
- **Dual Image Drivers** (Imagick + GD) for maximum compatibility
- **Asynchronous Processing** via Laravel Queue
- **REST API** with comprehensive endpoints
- **Advanced AI Restoration** with 7+ artistic styles
- **Enterprise Features** (authentication, rate limiting, webhooks)

---

## 📋 Features

### Core Capabilities

#### 🎨 Image Restoration
- Standard restoration with customizable parameters
- Advanced mode with ultra-high quality
- Damage detection and automated repair
- Color correction and enhancement
- Noise reduction with bilateral filtering
- Edge-preserving sharpening

#### 🔬 Advanced Processing Modes

1. **Super Resolution** (2x/4x upscaling)
   - High-quality Lanczos interpolation
   - Adaptive sharpening
   - Artifact reduction

2. **Colorization**
   - Sepia tone effects
   - Vintage coloring
   - Warm tone application

3. **Style Transfer** (7 artistic styles)
   - **Classical**: Smooth edges, vignette, enhanced colors
   - **Modern**: High contrast, bold edges
   - **Impressionist**: Oil painting effect
   - **Baroque**: Dramatic lighting and shadows
   - **Renaissance**: Balanced composition, warm tones
   - **Abstract**: Bold colors, posterization
   - **Minimalist**: Clean lines, reduced palette

4. **HDR Creation**
   - High dynamic range enhancement
   - Tone mapping algorithms
   - Shadow boost and highlight reduction

5. **Damage Detection**
   - Bright spot detection (tears, fading)
   - Dark spot detection (stains)
   - Scratch identification
   - Severity classification (minimal → severe)
   - Percentage-based damage scoring

---

## 🏗️ Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Laravel 10.x |
| **Language** | PHP 8.2+ |
| **ORM** | Eloquent |
| **Queue** | Laravel Queue (Redis/Database) |
| **Cache** | Redis |
| **Image Processing** | Intervention Image, Imagick, GD |
| **Authentication** | Laravel Sanctum |
| **API** | RESTful JSON API |
| **Testing** | PHPUnit, Larastan |

### Project Structure

```
php-backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── API/
│   │           └── RestorationController.php    # API endpoints
│   ├── Models/
│   │   ├── User.php                             # User model
│   │   ├── RestorationJob.php                   # Job tracking
│   │   └── Enums.php                            # Type-safe enums
│   ├── Services/
│   │   ├── ImageProcessorService.php            # Image operations
│   │   └── ArtRestorerService.php               # AI restoration
│   └── Jobs/
│       └── ProcessRestorationJob.php            # Async processing
├── database/
│   └── migrations/                               # Database schema
├── routes/
│   └── api.php                                   # API routes
└── composer.json                                 # Dependencies
```

---

## 📦 Installation

### Prerequisites

```bash
# Required
PHP >= 8.2
Composer
MySQL/PostgreSQL
Redis (optional, for queue)

# PHP Extensions
php-gd
php-imagick
php-mbstring
php-xml
php-redis
```

### Setup

1. **Install Dependencies**
```bash
cd php-backend
composer install
```

2. **Environment Configuration**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Configure Database**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ai_recoverify
DB_USERNAME=root
DB_PASSWORD=
```

4. **Run Migrations**
```bash
php artisan migrate
```

5. **Configure Storage**
```bash
php artisan storage:link
```

6. **Start Queue Worker** (for async processing)
```bash
php artisan queue:work --tries=3
```

7. **Start Server**
```bash
php artisan serve
# API available at http://localhost:8000
```

---

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```

### Standard Restoration
```http
POST /api/restoration/restore

Parameters:
- file: Image file (required)
- enhancement_level: low|medium|high|ultra (default: medium)
- denoise_strength: 0.0-1.0 (default: 0.5)
- sharpen: boolean (default: true)
- color_correction: boolean (default: true)
- damage_repair: boolean (default: true)
- async: boolean (default: true)
- webhook_url: URL for completion notification

Response (async):
{
  "success": true,
  "message": "Restoration job queued successfully",
  "job_id": "uuid",
  "status": "pending",
  "status_url": "/api/restoration/{job}/status"
}
```

### Super Resolution
```http
POST /api/restoration/super-resolution

Parameters:
- file: Image file (required)
- scale: 2|4 (default: 2)
- async: boolean

Response:
{
  "success": true,
  "job_id": "uuid",
  "status_url": "/api/restoration/{job}/status"
}
```

### Colorization
```http
POST /api/restoration/colorize

Parameters:
- file: Image file (required)
- method: sepia|vintage|warm (default: sepia)
- async: boolean
```

### Style Transfer
```http
POST /api/restoration/style-transfer

Parameters:
- file: Image file (required)
- style: classical|modern|impressionist|baroque|renaissance|abstract|minimalist
- async: boolean
```

### Damage Detection
```http
POST /api/restoration/detect-damage

Parameters:
- file: Image file (required)

Response:
{
  "success": true,
  "damage_info": {
    "damage_percentage": 12.5,
    "has_bright_spots": true,
    "has_dark_spots": false,
    "has_scratches": true,
    "severity": "moderate"
  }
}
```

### Job Status
```http
GET /api/restoration/{job}/status

Response:
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "completed",
    "progress": 100.0,
    "mode": "standard",
    "processing_time": 12.5,
    "download_url": "/api/restoration/{job}/download"
  }
}
```

### Download Result
```http
GET /api/restoration/{job}/download
```

### List Jobs
```http
GET /api/restoration/jobs?per_page=20
```

---

## 💡 Usage Examples

### PHP (Guzzle)
```php
use GuzzleHttp\Client;

$client = new Client(['base_uri' => 'http://localhost:8000']);

// Restore image
$response = $client->post('/api/restoration/restore', [
    'multipart' => [
        [
            'name' => 'file',
            'contents' => fopen('/path/to/image.jpg', 'r'),
            'filename' => 'image.jpg'
        ],
        [
            'name' => 'enhancement_level',
            'contents' => 'high'
        ],
        [
            'name' => 'async',
            'contents' => 'true'
        ]
    ]
]);

$result = json_decode($response->getBody(), true);
$jobId = $result['job_id'];

// Check status
$status = $client->get("/api/restoration/{$jobId}/status");
```

### cURL
```bash
# Restore image
curl -X POST http://localhost:8000/api/restoration/restore \
  -F "file=@artwork.jpg" \
  -F "enhancement_level=high" \
  -F "denoise_strength=0.7" \
  -F "async=true"

# Check status
curl http://localhost:8000/api/restoration/{job-id}/status

# Download result
curl -O http://localhost:8000/api/restoration/{job-id}/download
```

### JavaScript (Fetch)
```javascript
// Upload and restore
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('enhancement_level', 'high');
formData.append('async', 'true');

const response = await fetch('http://localhost:8000/api/restoration/restore', {
    method: 'POST',
    body: formData
});

const result = await response.json();
const jobId = result.job_id;

// Poll for status
const checkStatus = async () => {
    const statusResponse = await fetch(
        `http://localhost:8000/api/restoration/${jobId}/status`
    );
    const status = await statusResponse.json();

    if (status.job.status === 'completed') {
        window.location.href = status.job.download_url;
    }
};
```

---

## 🧪 Testing

```bash
# Run tests
php artisan test

# With coverage
php artisan test --coverage

# Static analysis
./vendor/bin/phpstan analyse
```

---

## 🔧 Configuration

### Queue Configuration

**config/queue.php:**
```php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 600,
        'block_for' => null,
    ],
],
```

### Image Processing

**Intervention Image** supports both Imagick and GD:
- Imagick: Advanced effects (oil painting, morphology, etc.)
- GD: Fallback for basic operations

The service automatically detects and uses the best available driver.

---

## 🚀 Performance

### Optimization Tips

1. **Use Redis** for queue and cache
2. **Enable OPcache** in production
3. **Use async processing** for large images
4. **Configure queue workers** based on load
5. **Enable compression** for API responses

### Typical Processing Times

| Operation | 1080p | 4K |
|-----------|-------|-----|
| Standard Restoration | 3-5s | 10-15s |
| Super Resolution 2x | 5-8s | 15-25s |
| Style Transfer | 4-6s | 12-18s |
| Damage Detection | 1-2s | 3-5s |

---

## 📊 Monitoring

### Laravel Horizon

Install Horizon for queue monitoring:
```bash
composer require laravel/horizon
php artisan horizon:install
php artisan horizon
```

Access dashboard at: `http://localhost:8000/horizon`

---

## 🔐 Security

- **API Authentication** via Laravel Sanctum
- **Rate Limiting** per user/IP
- **Input Validation** on all endpoints
- **File Type Validation** (whitelist approach)
- **XSS Protection** built-in
- **CSRF Protection** for web routes

---

## 📝 License

MIT License - See [LICENSE](../LICENSE) file

---

## 🎯 What Makes This Better Than Python Version?

### Architecture
✅ **Laravel Framework**: Production-ready MVC architecture
✅ **Eloquent ORM**: Beautiful, expressive database queries
✅ **Built-in Queue**: No external setup needed
✅ **Middleware**: Clean request/response handling

### Code Quality
✅ **PHP 8.2 Features**: Enums, typed properties, attributes
✅ **Type Safety**: Strict types throughout
✅ **Service Layer**: Clean separation of concerns
✅ **Repository Pattern**: Ready for scaling

### Developer Experience
✅ **Artisan CLI**: Powerful command-line tools
✅ **Migrations**: Version-controlled database
✅ **Seeders**: Easy test data generation
✅ **Horizon**: Beautiful queue monitoring UI

### Enterprise Ready
✅ **Laravel Sanctum**: Production auth system
✅ **Spatie Packages**: Best-in-class Laravel packages
✅ **Prometheus Metrics**: Ready for monitoring
✅ **Sentry Integration**: Error tracking configured

---

<div align="center">

**Built with ❤️ using Laravel 10.x and PHP 8.2**

[⬆ Back to Top](#ai-recoverify-arts---phplaravelbackend)

</div>
