"""
Main Flask application for AI Recoverify Arts
Handles art restoration and recovery requests
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from pathlib import Path
import logging
from datetime import datetime

from .image_processor import ImageProcessor
from .art_restorer import ArtRestorer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = Path("assets/input")
OUTPUT_FOLDER = Path("assets/output")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize processors
image_processor = ImageProcessor()
art_restorer = ArtRestorer()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'webp'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Recoverify Arts',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/restore', methods=['POST'])
def restore_art():
    """
    Main endpoint for art restoration
    Accepts image file and restoration parameters
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Get restoration parameters
        enhancement_level = request.form.get('enhancement_level', 'medium')
        denoise_strength = float(request.form.get('denoise_strength', 0.5))
        sharpen = request.form.get('sharpen', 'true').lower() == 'true'
        color_correction = request.form.get('color_correction', 'true').lower() == 'true'
        damage_repair = request.form.get('damage_repair', 'true').lower() == 'true'

        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_filename = f"input_{timestamp}_{file.filename}"
        input_path = app.config['UPLOAD_FOLDER'] / input_filename
        file.save(input_path)

        logger.info(f"Processing file: {input_filename}")

        # Process the image
        output_filename = f"restored_{timestamp}_{file.filename}"
        output_path = app.config['OUTPUT_FOLDER'] / output_filename

        # Apply restoration pipeline
        restored_image = art_restorer.restore(
            str(input_path),
            enhancement_level=enhancement_level,
            denoise_strength=denoise_strength,
            sharpen=sharpen,
            color_correction=color_correction,
            damage_repair=damage_repair
        )

        # Save restored image
        image_processor.save_image(restored_image, str(output_path))

        logger.info(f"Restoration complete: {output_filename}")

        return jsonify({
            'success': True,
            'message': 'Art restored successfully',
            'output_file': output_filename,
            'download_url': f'/api/download/{output_filename}'
        })

    except Exception as e:
        logger.error(f"Error during restoration: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/enhance', methods=['POST'])
def enhance_image():
    """
    Image enhancement endpoint
    Improves quality without full restoration
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Get enhancement parameters
        brightness = float(request.form.get('brightness', 1.0))
        contrast = float(request.form.get('contrast', 1.0))
        saturation = float(request.form.get('saturation', 1.0))

        # Save and process
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_filename = f"input_{timestamp}_{file.filename}"
        input_path = app.config['UPLOAD_FOLDER'] / input_filename
        file.save(input_path)

        output_filename = f"enhanced_{timestamp}_{file.filename}"
        output_path = app.config['OUTPUT_FOLDER'] / output_filename

        # Apply enhancements
        enhanced_image = image_processor.enhance(
            str(input_path),
            brightness=brightness,
            contrast=contrast,
            saturation=saturation
        )

        image_processor.save_image(enhanced_image, str(output_path))

        return jsonify({
            'success': True,
            'message': 'Image enhanced successfully',
            'output_file': output_filename,
            'download_url': f'/api/download/{output_filename}'
        })

    except Exception as e:
        logger.error(f"Error during enhancement: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download processed file"""
    try:
        file_path = app.config['OUTPUT_FOLDER'] / filename

        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404

        return send_file(file_path, as_attachment=True)

    except Exception as e:
        logger.error(f"Error during download: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/preview/<filename>', methods=['GET'])
def preview_file(filename):
    """Preview processed file"""
    try:
        file_path = app.config['OUTPUT_FOLDER'] / filename

        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404

        return send_file(file_path, mimetype='image/jpeg')

    except Exception as e:
        logger.error(f"Error during preview: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/models', methods=['GET'])
def list_models():
    """List available AI models"""
    return jsonify({
        'models': [
            {
                'name': 'Standard Restoration',
                'type': 'restoration',
                'description': 'General purpose art restoration'
            },
            {
                'name': 'Deep Enhancement',
                'type': 'enhancement',
                'description': 'AI-powered image enhancement'
            },
            {
                'name': 'Damage Repair',
                'type': 'repair',
                'description': 'Repairs scratches, tears, and damage'
            },
            {
                'name': 'Color Restoration',
                'type': 'color',
                'description': 'Restores faded colors'
            }
        ]
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
