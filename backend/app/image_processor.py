"""
Image Processing Module
Handles basic image operations and enhancements
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import logging

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Handles image processing operations"""

    def __init__(self):
        logger.info("ImageProcessor initialized")

    def load_image(self, image_path):
        """Load image from file"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logger.error(f"Error loading image: {str(e)}")
            raise

    def save_image(self, image, output_path):
        """Save image to file"""
        try:
            if isinstance(image, np.ndarray):
                image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                cv2.imwrite(output_path, image_bgr)
            else:
                image.save(output_path)
            logger.info(f"Image saved to: {output_path}")
        except Exception as e:
            logger.error(f"Error saving image: {str(e)}")
            raise

    def enhance(self, image_path, brightness=1.0, contrast=1.0, saturation=1.0):
        """
        Enhance image with brightness, contrast, and saturation adjustments

        Args:
            image_path: Path to input image
            brightness: Brightness factor (1.0 = no change)
            contrast: Contrast factor (1.0 = no change)
            saturation: Saturation factor (1.0 = no change)

        Returns:
            Enhanced image as numpy array
        """
        try:
            # Load with PIL for easy enhancement
            pil_image = Image.open(image_path)

            # Apply brightness
            if brightness != 1.0:
                enhancer = ImageEnhance.Brightness(pil_image)
                pil_image = enhancer.enhance(brightness)

            # Apply contrast
            if contrast != 1.0:
                enhancer = ImageEnhance.Contrast(pil_image)
                pil_image = enhancer.enhance(contrast)

            # Apply saturation
            if saturation != 1.0:
                enhancer = ImageEnhance.Color(pil_image)
                pil_image = enhancer.enhance(saturation)

            # Convert to numpy array
            return np.array(pil_image)

        except Exception as e:
            logger.error(f"Error enhancing image: {str(e)}")
            raise

    def denoise(self, image, strength=0.5):
        """
        Remove noise from image

        Args:
            image: Input image as numpy array
            strength: Denoising strength (0.0 to 1.0)

        Returns:
            Denoised image
        """
        try:
            h_value = int(10 * strength)
            denoised = cv2.fastNlMeansDenoisingColored(
                image, None, h_value, h_value, 7, 21
            )
            return denoised
        except Exception as e:
            logger.error(f"Error denoising image: {str(e)}")
            raise

    def sharpen(self, image, amount=1.0):
        """
        Sharpen image

        Args:
            image: Input image as numpy array
            amount: Sharpening amount (0.0 to 2.0)

        Returns:
            Sharpened image
        """
        try:
            pil_image = Image.fromarray(image)

            if amount > 0:
                # Apply unsharp mask
                blurred = pil_image.filter(ImageFilter.GaussianBlur(radius=2))
                sharpened = Image.blend(pil_image, blurred, -amount)
                return np.array(sharpened)

            return image
        except Exception as e:
            logger.error(f"Error sharpening image: {str(e)}")
            raise

    def adjust_gamma(self, image, gamma=1.0):
        """
        Adjust image gamma for brightness correction

        Args:
            image: Input image as numpy array
            gamma: Gamma value (< 1.0 = darker, > 1.0 = brighter)

        Returns:
            Gamma-corrected image
        """
        try:
            inv_gamma = 1.0 / gamma
            table = np.array([
                ((i / 255.0) ** inv_gamma) * 255
                for i in np.arange(0, 256)
            ]).astype("uint8")

            return cv2.LUT(image, table)
        except Exception as e:
            logger.error(f"Error adjusting gamma: {str(e)}")
            raise

    def color_balance(self, image):
        """
        Automatic color balance using white balance algorithm

        Args:
            image: Input image as numpy array

        Returns:
            Color-balanced image
        """
        try:
            result = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            avg_a = np.average(result[:, :, 1])
            avg_b = np.average(result[:, :, 2])

            result[:, :, 1] = result[:, :, 1] - ((avg_a - 128) * (result[:, :, 0] / 255.0) * 1.1)
            result[:, :, 2] = result[:, :, 2] - ((avg_b - 128) * (result[:, :, 0] / 255.0) * 1.1)

            result = cv2.cvtColor(result, cv2.COLOR_LAB2RGB)
            return result
        except Exception as e:
            logger.error(f"Error balancing colors: {str(e)}")
            raise

    def resize(self, image, width=None, height=None, maintain_aspect=True):
        """
        Resize image

        Args:
            image: Input image as numpy array
            width: Target width
            height: Target height
            maintain_aspect: Whether to maintain aspect ratio

        Returns:
            Resized image
        """
        try:
            h, w = image.shape[:2]

            if maintain_aspect:
                if width and not height:
                    ratio = width / w
                    height = int(h * ratio)
                elif height and not width:
                    ratio = height / h
                    width = int(w * ratio)

            if width and height:
                resized = cv2.resize(image, (width, height), interpolation=cv2.INTER_LANCZOS4)
                return resized

            return image
        except Exception as e:
            logger.error(f"Error resizing image: {str(e)}")
            raise
