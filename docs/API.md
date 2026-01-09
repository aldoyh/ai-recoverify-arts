# API Documentation

Complete API reference for AI Recoverify Arts backend.

## Base URL

```
http://localhost:5000
```

For production, replace with your deployed API URL.

## Authentication

Currently, the API does not require authentication. For production use, consider implementing:
- API keys
- OAuth 2.0
- JWT tokens

## Rate Limiting

No rate limiting is currently implemented. For production, consider adding rate limiting to prevent abuse.

## Endpoints

### Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "AI Recoverify Arts",
  "version": "1.0.0",
  "timestamp": "2024-01-28T12:00:00.000000"
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### Restore Artwork

Main endpoint for art restoration with full processing pipeline.

**Endpoint:** `POST /api/restore`

**Headers:**
- `Content-Type: multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| file | File | Yes | - | Image file to restore |
| enhancement_level | String | No | "medium" | Enhancement level: "low", "medium", or "high" |
| denoise_strength | Float | No | 0.5 | Noise reduction strength (0.0-1.0) |
| sharpen | Boolean | No | true | Apply sharpening |
| color_correction | Boolean | No | true | Apply color correction |
| damage_repair | Boolean | No | true | Repair damage automatically |

**Request Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/restore \
  -F "file=@damaged_painting.jpg" \
  -F "enhancement_level=high" \
  -F "denoise_strength=0.7" \
  -F "sharpen=true" \
  -F "color_correction=true" \
  -F "damage_repair=true"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Art restored successfully",
  "output_file": "restored_20240128_120000_painting.jpg",
  "download_url": "/api/download/restored_20240128_120000_painting.jpg"
}
```

**Response (Error):**
```json
{
  "error": "No file provided"
}
```

**Status Codes:**
- `200 OK`: Restoration successful
- `400 Bad Request`: Invalid parameters or no file provided
- `500 Internal Server Error`: Processing error

---

### Enhance Image

Quick image enhancement without full restoration.

**Endpoint:** `POST /api/enhance`

**Headers:**
- `Content-Type: multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| file | File | Yes | - | Image file to enhance |
| brightness | Float | No | 1.0 | Brightness adjustment (0.5-2.0) |
| contrast | Float | No | 1.0 | Contrast adjustment (0.5-2.0) |
| saturation | Float | No | 1.0 | Saturation adjustment (0.0-2.0) |

**Request Example (Python):**
```python
import requests

url = "http://localhost:5000/api/enhance"
files = {'file': open('image.jpg', 'rb')}
data = {
    'brightness': 1.2,
    'contrast': 1.1,
    'saturation': 1.0
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

**Response:**
```json
{
  "success": true,
  "message": "Image enhanced successfully",
  "output_file": "enhanced_20240128_120000_image.jpg",
  "download_url": "/api/download/enhanced_20240128_120000_image.jpg"
}
```

**Status Codes:**
- `200 OK`: Enhancement successful
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Processing error

---

### Download File

Download a processed image.

**Endpoint:** `GET /api/download/{filename}`

**Path Parameters:**
- `filename`: Name of the processed file

**Response:**
- Binary image data with appropriate MIME type
- `Content-Disposition: attachment`

**Status Codes:**
- `200 OK`: File found and returned
- `404 Not Found`: File does not exist

**Example:**
```bash
curl -O http://localhost:5000/api/download/restored_20240128_120000_painting.jpg
```

---

### Preview File

Preview a processed image in the browser.

**Endpoint:** `GET /api/preview/{filename}`

**Path Parameters:**
- `filename`: Name of the processed file

**Response:**
- Binary image data with MIME type `image/jpeg`
- Displays in browser

**Status Codes:**
- `200 OK`: File found and returned
- `404 Not Found`: File does not exist

---

### List Models

Get information about available AI models.

**Endpoint:** `GET /api/models`

**Response:**
```json
{
  "models": [
    {
      "name": "Standard Restoration",
      "type": "restoration",
      "description": "General purpose art restoration"
    },
    {
      "name": "Deep Enhancement",
      "type": "enhancement",
      "description": "AI-powered image enhancement"
    },
    {
      "name": "Damage Repair",
      "type": "repair",
      "description": "Repairs scratches, tears, and damage"
    },
    {
      "name": "Color Restoration",
      "type": "color",
      "description": "Restores faded colors"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Models list returned

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Description of what went wrong"
}
```

### Common Error Codes

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid parameters or missing required fields |
| 404 | Not Found - Resource does not exist |
| 413 | Payload Too Large - File exceeds maximum size (16MB) |
| 415 | Unsupported Media Type - Invalid file format |
| 500 | Internal Server Error - Processing error |

---

## File Formats

### Supported Input Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff, .tif)
- WebP (.webp)

### Output Format
- JPEG (default)

### Size Limits
- Maximum file size: 16 MB
- Maximum resolution: 8K (7680×4320)

---

## Response Times

Typical processing times:

| Image Resolution | Low Level | Medium Level | High Level |
|-----------------|-----------|--------------|------------|
| 1080p (1920×1080) | 2-3s | 3-5s | 5-8s |
| 4K (3840×2160) | 5-7s | 8-12s | 12-18s |
| 8K (7680×4320) | 15-20s | 25-35s | 35-50s |

*Times may vary based on server hardware and image complexity*

---

## Code Examples

### Python

```python
import requests

# Restore artwork
def restore_artwork(image_path):
    url = "http://localhost:5000/api/restore"

    with open(image_path, 'rb') as f:
        files = {'file': f}
        data = {
            'enhancement_level': 'high',
            'denoise_strength': 0.7,
            'sharpen': 'true',
            'color_correction': 'true',
            'damage_repair': 'true'
        }

        response = requests.post(url, files=files, data=data)
        return response.json()

# Download restored image
def download_restored(filename, output_path):
    url = f"http://localhost:5000/api/download/{filename}"
    response = requests.get(url)

    with open(output_path, 'wb') as f:
        f.write(response.content)

# Usage
result = restore_artwork('damaged_art.jpg')
if result['success']:
    download_restored(result['output_file'], 'restored_art.jpg')
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Restore artwork
async function restoreArtwork(imagePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  form.append('enhancement_level', 'high');
  form.append('denoise_strength', '0.7');
  form.append('sharpen', 'true');

  const response = await axios.post(
    'http://localhost:5000/api/restore',
    form,
    { headers: form.getHeaders() }
  );

  return response.data;
}

// Usage
restoreArtwork('damaged_art.jpg')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### JavaScript (Browser)

```javascript
// Restore artwork from file input
async function restoreArtwork(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('enhancement_level', 'medium');
  formData.append('denoise_strength', '0.5');

  const response = await fetch('http://localhost:5000/api/restore', {
    method: 'POST',
    body: formData
  });

  return await response.json();
}

// Usage with file input
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const result = await restoreArtwork(file);
  console.log(result);
});
```

---

## Best Practices

1. **File Size**: Compress images before upload if possible
2. **Error Handling**: Always check response status and handle errors
3. **Timeouts**: Set appropriate timeouts for large images
4. **Progress**: Implement progress indicators for better UX
5. **Validation**: Validate file types on client-side before upload

---

## Versioning

Current API version: **1.0.0**

Future versions will maintain backward compatibility when possible. Breaking changes will be announced with major version updates.
