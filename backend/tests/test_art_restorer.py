"""
Unit tests for ArtRestorer
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

from app.art_restorer import ArtRestorer


class TestArtRestorer(unittest.TestCase):
    """Test cases for ArtRestorer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.restorer = ArtRestorer()
        self.temp_dir = tempfile.mkdtemp()

        # Create a test image with some "damage"
        self.test_image = np.ones((200, 200, 3), dtype=np.uint8) * 128
        # Add some white spots (simulated damage)
        self.test_image[50:60, 50:60] = [255, 255, 255]
        self.test_image[100:105, 100:150] = [255, 255, 255]

        self.test_image_path = os.path.join(self.temp_dir, 'damaged_art.jpg')
        Image.fromarray(self.test_image).save(self.test_image_path)

    def tearDown(self):
        """Clean up test fixtures"""
        for file in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, file))
        os.rmdir(self.temp_dir)

    def test_restore_basic(self):
        """Test basic restoration"""
        restored = self.restorer.restore(
            self.test_image_path,
            enhancement_level='medium'
        )
        self.assertIsInstance(restored, np.ndarray)
        self.assertEqual(restored.shape, self.test_image.shape)

    def test_restore_low_level(self):
        """Test restoration with low enhancement level"""
        restored = self.restorer.restore(
            self.test_image_path,
            enhancement_level='low'
        )
        self.assertIsInstance(restored, np.ndarray)

    def test_restore_high_level(self):
        """Test restoration with high enhancement level"""
        restored = self.restorer.restore(
            self.test_image_path,
            enhancement_level='high'
        )
        self.assertIsInstance(restored, np.ndarray)

    def test_restore_with_all_features(self):
        """Test restoration with all features enabled"""
        restored = self.restorer.restore(
            self.test_image_path,
            enhancement_level='medium',
            denoise_strength=0.7,
            sharpen=True,
            color_correction=True,
            damage_repair=True
        )
        self.assertIsInstance(restored, np.ndarray)
        self.assertEqual(restored.shape, self.test_image.shape)

    def test_restore_without_features(self):
        """Test restoration with features disabled"""
        restored = self.restorer.restore(
            self.test_image_path,
            enhancement_level='low',
            denoise_strength=0.0,
            sharpen=False,
            color_correction=False,
            damage_repair=False
        )
        self.assertIsInstance(restored, np.ndarray)

    def test_repair_damage(self):
        """Test damage repair functionality"""
        repaired = self.restorer._repair_damage(self.test_image)
        self.assertIsInstance(repaired, np.ndarray)
        self.assertEqual(repaired.shape, self.test_image.shape)

    def test_restore_colors(self):
        """Test color restoration"""
        restored = self.restorer._restore_colors(self.test_image, level='medium')
        self.assertIsInstance(restored, np.ndarray)
        self.assertEqual(restored.shape, self.test_image.shape)

    def test_enhance_details(self):
        """Test detail enhancement"""
        enhanced = self.restorer.enhance_details(self.test_image)
        self.assertIsInstance(enhanced, np.ndarray)
        self.assertEqual(enhanced.shape, self.test_image.shape)


if __name__ == '__main__':
    unittest.main()
