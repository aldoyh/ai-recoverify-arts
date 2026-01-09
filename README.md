# AI Recoverify Arts

<div align="center">

![AI Recoverify Arts](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**AI-Powered Art Restoration and Recovery Service**

Transform damaged, faded, or degraded artwork into pristine masterpieces using advanced AI technology.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API Documentation](#api-documentation) • [Contributing](#contributing)

</div>

---

## Overview

AI Recoverify Arts is a comprehensive art restoration platform that leverages cutting-edge artificial intelligence and computer vision techniques to restore and enhance damaged or degraded artwork. Whether dealing with scratches, tears, faded colors, or general deterioration, our system provides professional-grade restoration capabilities.

## Features

### Core Restoration Capabilities

- **🎨 Damage Repair**: Automatically detect and repair scratches, tears, and physical damage
- **🌈 Color Restoration**: Restore faded colors to their original vibrancy
- **✨ Image Enhancement**: Multi-level enhancement (low, medium, high) for optimal results
- **🔍 Detail Preservation**: Advanced sharpening while maintaining artistic integrity
- **🎯 Noise Reduction**: Remove noise and artifacts without losing detail
- **⚖️ Color Balance**: Automatic white balance and color correction

### User Interface

- **Drag & Drop Upload**: Intuitive file upload with drag-and-drop support
- **Real-time Preview**: Side-by-side comparison with interactive slider
- **Custom Controls**: Fine-tune restoration parameters
- **Progress Tracking**: Visual feedback during processing
- **One-Click Download**: Export restored artwork instantly

### Technical Features

- **REST API**: Full-featured API for integration
- **Multiple Formats**: Support for JPG, PNG, BMP, TIFF, WEBP
- **Scalable Architecture**: Built for performance and reliability
- **Advanced Algorithms**: State-of-the-art image processing techniques

## Architecture

```
ai-recoverify-arts/
├── backend/              # Python Flask backend
│   ├── app/
│   │   ├── main.py      # Flask application and API endpoints
│   │   ├── image_processor.py   # Image processing utilities
│   │   └── art_restorer.py      # AI restoration engine
│   ├── tests/           # Backend tests
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.js       # Main application
│   │   └── App.css      # Styling
│   ├── public/          # Static assets
│   └── package.json     # Node dependencies
├── assets/              # Asset storage
│   ├── input/          # Uploaded images
│   ├── output/         # Restored images
│   └── samples/        # Sample images
└── docs/               # Documentation
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-recoverify-arts.git
   cd ai-recoverify-arts
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server**
   ```bash
   python -m app.main
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

## Usage

### Web Interface

1. **Upload Artwork**
   - Drag and drop an image or click to browse
   - Supported formats: JPG, PNG, BMP, TIFF, WEBP
   - Maximum file size: 16MB

2. **Configure Settings**
   - **Enhancement Level**: Choose low, medium, or high
   - **Denoise Strength**: Adjust noise reduction (0.0 - 1.0)
   - **Sharpen**: Enable/disable sharpening
   - **Color Correction**: Enable/disable color correction
   - **Damage Repair**: Enable/disable automatic damage repair

3. **Restore**
   - Click "Restore Artwork" to process
   - Monitor progress in real-time
   - Use slider to compare original and restored versions

4. **Download**
   - Click "Download Restored Image" to save your work

### Command Line (Python)

```python
from app.art_restorer import ArtRestorer
from app.image_processor import ImageProcessor

# Initialize
restorer = ArtRestorer()
processor = ImageProcessor()

# Restore artwork
restored = restorer.restore(
    'path/to/artwork.jpg',
    enhancement_level='high',
    denoise_strength=0.7,
    sharpen=True,
    color_correction=True,
    damage_repair=True
)

# Save result
processor.save_image(restored, 'path/to/output.jpg')
```

## API Documentation

### Endpoints

#### Health Check
```http
GET /health
```

Returns service health status.

#### Restore Artwork
```http
POST /api/restore
Content-Type: multipart/form-data

Parameters:
- file: Image file (required)
- enhancement_level: low|medium|high (default: medium)
- denoise_strength: 0.0-1.0 (default: 0.5)
- sharpen: true|false (default: true)
- color_correction: true|false (default: true)
- damage_repair: true|false (default: true)

Response:
{
  "success": true,
  "message": "Art restored successfully",
  "output_file": "restored_20231128_123456_artwork.jpg",
  "download_url": "/api/download/restored_20231128_123456_artwork.jpg"
}
```

#### Enhance Image
```http
POST /api/enhance
Content-Type: multipart/form-data

Parameters:
- file: Image file (required)
- brightness: float (default: 1.0)
- contrast: float (default: 1.0)
- saturation: float (default: 1.0)
```

#### Download File
```http
GET /api/download/{filename}
```

#### Preview File
```http
GET /api/preview/{filename}
```

#### List Models
```http
GET /api/models
```

### Example: Using cURL

```bash
curl -X POST http://localhost:5000/api/restore \
  -F "file=@artwork.jpg" \
  -F "enhancement_level=high" \
  -F "denoise_strength=0.7" \
  -F "sharpen=true" \
  -F "color_correction=true" \
  -F "damage_repair=true"
```

## Technology Stack

### Backend
- **Flask**: Web framework
- **OpenCV**: Computer vision and image processing
- **Pillow**: Python Imaging Library
- **NumPy**: Numerical computing
- **scikit-image**: Image processing algorithms

### Frontend
- **React**: UI framework
- **Axios**: HTTP client
- **CSS3**: Modern styling with gradients and animations

### AI/ML Techniques
- **CLAHE**: Contrast Limited Adaptive Histogram Equalization
- **Non-local Means Denoising**: Advanced noise reduction
- **Bilateral Filtering**: Edge-preserving smoothing
- **Inpainting**: Damage repair algorithm
- **Color Space Transformations**: LAB color space processing

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
FLASK_ENV=development
FLASK_DEBUG=True
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=assets/input
OUTPUT_FOLDER=assets/output
```

Frontend `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

## Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Performance

- **Processing Time**: 2-10 seconds per image (depending on size and settings)
- **Supported Resolutions**: Up to 8K (7680×4320)
- **Concurrent Users**: Scales horizontally
- **API Rate Limit**: Configurable

## Best Practices

1. **Image Quality**: Use high-resolution source images for best results
2. **Enhancement Level**: Start with medium and adjust as needed
3. **Damage Repair**: Works best on clearly defined scratches and tears
4. **Color Correction**: Most effective on uniformly faded images
5. **File Formats**: PNG for lossless quality, JPEG for smaller file sizes

## Troubleshooting

### Common Issues

**Issue**: "Could not load image"
- **Solution**: Ensure file is a valid image format and not corrupted

**Issue**: "Processing takes too long"
- **Solution**: Reduce enhancement level or image resolution

**Issue**: "Colors look unnatural"
- **Solution**: Disable color correction or reduce enhancement level

**Issue**: "Backend connection failed"
- **Solution**: Ensure backend is running on port 5000

## Roadmap

- [ ] AI model training for specific art styles
- [ ] Batch processing support
- [ ] Cloud deployment guides
- [ ] Mobile application
- [ ] Advanced inpainting with deep learning
- [ ] Support for historical artwork restoration
- [ ] Integration with museum databases

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write tests for new features
- Update documentation as needed
- Maintain backward compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenCV community for computer vision tools
- React team for the amazing frontend framework
- Contributors and testers who helped improve this project

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-recoverify-arts/issues)
- **Documentation**: [Full Documentation](docs/)
- **Email**: support@recoverifyarts.com

## Citation

If you use this software in your research, please cite:

```bibtex
@software{ai_recoverify_arts,
  title = {AI Recoverify Arts: AI-Powered Art Restoration},
  author = {Your Name},
  year = {2024},
  url = {https://github.com/yourusername/ai-recoverify-arts}
}
```

---

<div align="center">

**Made with ❤️ for Art Preservation**

[⬆ Back to Top](#ai-recoverify-arts)

</div>
