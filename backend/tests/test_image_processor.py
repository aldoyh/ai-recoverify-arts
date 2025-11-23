"""
Unit tests for ImageProcessor
"""

import unittest
import numpy as np
from PIL import Image
import tempfile
import os
from pathlib import Path

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.image_processor import ImageProcessor


class TestImageProcessor(unittest.TestCase):
    """Test cases for ImageProcessor class"""

    def setUp(self):
        """Set up test fixtures"""
        self.processor = ImageProcessor()
        self.temp_dir = tempfile.mkdtemp()

        # Create a test image
        self.test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        self.test_image[:, :] = [100, 150, 200]  # Fill with a color

        self.test_image_path = os.path.join(self.temp_dir, 'test_image.jpg')
        Image.fromarray(self.test_image).save(self.test_image_path)

    def tearDown(self):
        """Clean up test fixtures"""
        # Remove temporary files
        for file in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, file))
        os.rmdir(self.temp_dir)

    def test_load_image(self):
        """Test image loading"""
        image = self.processor.load_image(self.test_image_path)
        self.assertIsInstance(image, np.ndarray)
        self.assertEqual(len(image.shape), 3)
        self.assertEqual(image.shape[2], 3)  # RGB channels

    def test_save_image(self):
        """Test image saving"""
        output_path = os.path.join(self.temp_dir, 'output.jpg')
        self.processor.save_image(self.test_image, output_path)
        self.assertTrue(os.path.exists(output_path))

    def test_enhance(self):
        """Test image enhancement"""
        enhanced = self.processor.enhance(
            self.test_image_path,
            brightness=1.2,
            contrast=1.1,
            saturation=1.0
        )
        self.assertIsInstance(enhanced, np.ndarray)
        self.assertEqual(enhanced.shape, self.test_image.shape)

    def test_denoise(self):
        """Test denoising"""
        denoised = self.processor.denoise(self.test_image, strength=0.5)
        self.assertIsInstance(denoised, np.ndarray)
        self.assertEqual(denoised.shape, self.test_image.shape)

    def test_sharpen(self):
        """Test sharpening"""
        sharpened = self.processor.sharpen(self.test_image, amount=0.5)
        self.assertIsInstance(sharpened, np.ndarray)
        self.assertEqual(sharpened.shape, self.test_image.shape)

    def test_adjust_gamma(self):
        """Test gamma adjustment"""
        adjusted = self.processor.adjust_gamma(self.test_image, gamma=1.2)
        self.assertIsInstance(adjusted, np.ndarray)
        self.assertEqual(adjusted.shape, self.test_image.shape)

    def test_color_balance(self):
        """Test color balancing"""
        balanced = self.processor.color_balance(self.test_image)
        self.assertIsInstance(balanced, np.ndarray)
        self.assertEqual(balanced.shape, self.test_image.shape)

    def test_resize(self):
        """Test image resizing"""
        resized = self.processor.resize(self.test_image, width=50, height=50)
        self.assertEqual(resized.shape[:2], (50, 50))


if __name__ == '__main__':
    unittest.main()
