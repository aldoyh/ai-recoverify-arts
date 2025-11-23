"""
Integration tests for Flask API
"""

import unittest
import json
import tempfile
import os
from pathlib import Path
from PIL import Image
import numpy as np

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app


class TestAPI(unittest.TestCase):
    """Test cases for Flask API endpoints"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = app.test_client()
        self.app.testing = True
        self.temp_dir = tempfile.mkdtemp()

        # Create a test image
        test_image = np.ones((200, 200, 3), dtype=np.uint8) * 128
        self.test_image_path = os.path.join(self.temp_dir, 'test.jpg')
        Image.fromarray(test_image).save(self.test_image_path)

    def tearDown(self):
        """Clean up test fixtures"""
        for file in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, file))
        os.rmdir(self.temp_dir)

    def test_health_check(self):
        """Test health check endpoint"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'AI Recoverify Arts')

    def test_list_models(self):
        """Test models listing endpoint"""
        response = self.app.get('/api/models')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('models', data)
        self.assertIsInstance(data['models'], list)
        self.assertGreater(len(data['models']), 0)

    def test_restore_no_file(self):
        """Test restore endpoint without file"""
        response = self.app.post('/api/restore')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_restore_with_file(self):
        """Test restore endpoint with file"""
        with open(self.test_image_path, 'rb') as f:
            response = self.app.post(
                '/api/restore',
                data={
                    'file': (f, 'test.jpg'),
                    'enhancement_level': 'medium',
                    'denoise_strength': '0.5',
                    'sharpen': 'true',
                    'color_correction': 'true',
                    'damage_repair': 'true'
                },
                content_type='multipart/form-data'
            )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('output_file', data)
        self.assertIn('download_url', data)

    def test_enhance_with_file(self):
        """Test enhance endpoint with file"""
        with open(self.test_image_path, 'rb') as f:
            response = self.app.post(
                '/api/enhance',
                data={
                    'file': (f, 'test.jpg'),
                    'brightness': '1.2',
                    'contrast': '1.1',
                    'saturation': '1.0'
                },
                content_type='multipart/form-data'
            )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])

    def test_download_nonexistent_file(self):
        """Test download endpoint with nonexistent file"""
        response = self.app.get('/api/download/nonexistent.jpg')
        self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    unittest.main()
