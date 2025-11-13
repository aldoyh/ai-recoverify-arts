"""
Art Restoration Module
Advanced AI-powered art restoration and recovery
"""

import cv2
import numpy as np
from PIL import Image
import logging
from .image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class ArtRestorer:
    """Handles art restoration using AI techniques"""

    def __init__(self):
        self.image_processor = ImageProcessor()
        logger.info("ArtRestorer initialized")

    def restore(
        self,
        image_path,
        enhancement_level="medium",
        denoise_strength=0.5,
        sharpen=True,
        color_correction=True,
        damage_repair=True
    ):
        """
        Main restoration pipeline

        Args:
            image_path: Path to input image
            enhancement_level: low, medium, or high
            denoise_strength: Strength of denoising (0.0 to 1.0)
            sharpen: Whether to apply sharpening
            color_correction: Whether to apply color correction
            damage_repair: Whether to repair damage

        Returns:
            Restored image as numpy array
        """
        try:
            logger.info(f"Starting restoration with level: {enhancement_level}")

            # Load image
            image = self.image_processor.load_image(image_path)
            original_shape = image.shape

            # Apply restoration pipeline
            restored = image.copy()

            # 1. Damage repair (inpainting for scratches and tears)
            if damage_repair:
                logger.info("Applying damage repair...")
                restored = self._repair_damage(restored)

            # 2. Denoising
            if denoise_strength > 0:
                logger.info(f"Applying denoising (strength: {denoise_strength})...")
                restored = self.image_processor.denoise(restored, denoise_strength)

            # 3. Color correction and restoration
            if color_correction:
                logger.info("Applying color correction...")
                restored = self._restore_colors(restored, enhancement_level)

            # 4. Enhancement based on level
            restored = self._apply_enhancement_level(restored, enhancement_level)

            # 5. Sharpening
            if sharpen:
                logger.info("Applying sharpening...")
                sharpen_amount = self._get_sharpen_amount(enhancement_level)
                restored = self.image_processor.sharpen(restored, sharpen_amount)

            # 6. Final touch-ups
            restored = self._final_adjustments(restored)

            logger.info("Restoration complete")
            return restored

        except Exception as e:
            logger.error(f"Error during restoration: {str(e)}")
            raise

    def _repair_damage(self, image):
        """
        Repair scratches, tears, and other damage
        Uses inpainting techniques to fill damaged areas
        """
        try:
            # Convert to grayscale for damage detection
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Detect potential damage (very bright or dark spots)
            _, thresh_bright = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
            _, thresh_dark = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY_INV)

            # Combine masks
            damage_mask = cv2.bitwise_or(thresh_bright, thresh_dark)

            # Dilate to cover surrounding areas
            kernel = np.ones((3, 3), np.uint8)
            damage_mask = cv2.dilate(damage_mask, kernel, iterations=1)

            # Apply inpainting if damage detected
            if np.sum(damage_mask) > 0:
                image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                repaired = cv2.inpaint(image_bgr, damage_mask, 3, cv2.INPAINT_TELEA)
                return cv2.cvtColor(repaired, cv2.COLOR_BGR2RGB)

            return image

        except Exception as e:
            logger.warning(f"Could not repair damage: {str(e)}")
            return image

    def _restore_colors(self, image, level="medium"):
        """
        Restore faded or damaged colors
        """
        try:
            # Apply color balance
            balanced = self.image_processor.color_balance(image)

            # Enhance saturation based on level
            pil_image = Image.fromarray(balanced)

            from PIL import ImageEnhance

            saturation_factors = {
                "low": 1.1,
                "medium": 1.2,
                "high": 1.3
            }

            factor = saturation_factors.get(level, 1.2)
            enhancer = ImageEnhance.Color(pil_image)
            enhanced = enhancer.enhance(factor)

            return np.array(enhanced)

        except Exception as e:
            logger.warning(f"Could not restore colors: {str(e)}")
            return image

    def _apply_enhancement_level(self, image, level):
        """Apply enhancement based on selected level"""
        try:
            enhancement_params = {
                "low": {"gamma": 1.05, "contrast": 1.05},
                "medium": {"gamma": 1.1, "contrast": 1.1},
                "high": {"gamma": 1.15, "contrast": 1.15}
            }

            params = enhancement_params.get(level, enhancement_params["medium"])

            # Adjust gamma
            enhanced = self.image_processor.adjust_gamma(image, params["gamma"])

            # Adjust contrast
            pil_image = Image.fromarray(enhanced)
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(pil_image)
            enhanced = enhancer.enhance(params["contrast"])

            return np.array(enhanced)

        except Exception as e:
            logger.warning(f"Could not apply enhancement: {str(e)}")
            return image

    def _get_sharpen_amount(self, level):
        """Get sharpening amount based on enhancement level"""
        sharpen_amounts = {
            "low": 0.3,
            "medium": 0.5,
            "high": 0.7
        }
        return sharpen_amounts.get(level, 0.5)

    def _final_adjustments(self, image):
        """Apply final adjustments and normalization"""
        try:
            # Ensure values are in valid range
            image = np.clip(image, 0, 255).astype(np.uint8)

            # Slight smoothing to reduce artifacts
            smoothed = cv2.bilateralFilter(image, 5, 50, 50)

            # Blend original and smoothed for natural look
            result = cv2.addWeighted(image, 0.7, smoothed, 0.3, 0)

            return result

        except Exception as e:
            logger.warning(f"Could not apply final adjustments: {str(e)}")
            return image

    def remove_noise_advanced(self, image):
        """
        Advanced noise removal using multiple techniques
        """
        try:
            # Apply Non-local Means Denoising
            denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)

            # Apply bilateral filter for edge-preserving smoothing
            smoothed = cv2.bilateralFilter(denoised, 9, 75, 75)

            return smoothed

        except Exception as e:
            logger.warning(f"Advanced noise removal failed: {str(e)}")
            return image

    def enhance_details(self, image, amount=1.5):
        """
        Enhance fine details in the artwork
        """
        try:
            # Convert to LAB color space
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)

            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l_enhanced = clahe.apply(l)

            # Merge channels
            enhanced_lab = cv2.merge([l_enhanced, a, b])

            # Convert back to RGB
            enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

            # Blend with original based on amount
            result = cv2.addWeighted(image, 1 - (amount * 0.3), enhanced, amount * 0.3, 0)

            return result

        except Exception as e:
            logger.warning(f"Detail enhancement failed: {str(e)}")
            return image

    def super_resolution(self, image_path, scale=2):
        """
        Apply super resolution to increase image resolution

        Args:
            image_path: Path to input image
            scale: Upscaling factor (2 or 4)

        Returns:
            Super-resolved image as numpy array
        """
        try:
            logger.info(f"Starting super resolution with scale: {scale}")

            # Load image
            image = self.image_processor.load_image(image_path)

            # Use OpenCV's DNN Super Resolution (EDSR model)
            sr = cv2.dnn_superres.DnnSuperResImpl_create()

            # For now, use basic interpolation (in production, load pre-trained models)
            h, w = image.shape[:2]
            new_h, new_w = h * scale, w * scale

            # Use Lanczos interpolation for high-quality upscaling
            upscaled = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

            # Apply sharpening to enhance details
            kernel = np.array([[-1,-1,-1],
                             [-1, 9,-1],
                             [-1,-1,-1]])
            sharpened = cv2.filter2D(upscaled, -1, kernel * 0.5)

            # Blend for natural look
            result = cv2.addWeighted(upscaled, 0.7, sharpened, 0.3, 0)

            # Apply bilateral filter to reduce artifacts
            result = cv2.bilateralFilter(result, 5, 50, 50)

            logger.info(f"Super resolution completed: {w}x{h} -> {new_w}x{new_h}")
            return result

        except Exception as e:
            logger.error(f"Super resolution failed: {str(e)}")
            raise

    def colorize(self, image_path):
        """
        Colorize black and white images

        Args:
            image_path: Path to input image

        Returns:
            Colorized image as numpy array
        """
        try:
            logger.info("Starting colorization")

            # Load image
            image = self.image_processor.load_image(image_path)

            # Check if image is grayscale or convert to grayscale
            if len(image.shape) == 2:
                gray = image
            else:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Convert back to 3 channels
            colored = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

            # Apply subtle color tinting for artistic effect
            # In production, this would use a trained deep learning model
            h, w = colored.shape[:2]

            # Create color gradients for artistic colorization
            sepia_kernel = np.array([[0.272, 0.534, 0.131],
                                    [0.349, 0.686, 0.168],
                                    [0.393, 0.769, 0.189]])

            # Apply sepia tone
            sepia = cv2.transform(colored, sepia_kernel)

            # Blend with original for subtle effect
            result = cv2.addWeighted(colored, 0.3, sepia, 0.7, 0)

            # Enhance colors
            result = self._restore_colors(result, level='medium')

            logger.info("Colorization completed")
            return result

        except Exception as e:
            logger.error(f"Colorization failed: {str(e)}")
            raise

    def style_transfer(self, image_path, style='classical'):
        """
        Apply artistic style transfer

        Args:
            image_path: Path to input image
            style: Style to apply (classical, modern, impressionist)

        Returns:
            Styled image as numpy array
        """
        try:
            logger.info(f"Starting style transfer: {style}")

            # Load image
            image = self.image_processor.load_image(image_path)

            # Apply style-specific transformations
            if style == 'classical':
                result = self._apply_classical_style(image)
            elif style == 'modern':
                result = self._apply_modern_style(image)
            elif style == 'impressionist':
                result = self._apply_impressionist_style(image)
            else:
                result = image

            logger.info("Style transfer completed")
            return result

        except Exception as e:
            logger.error(f"Style transfer failed: {str(e)}")
            raise

    def _apply_classical_style(self, image):
        """Apply classical painting style"""
        # Reduce noise and smooth edges
        smoothed = cv2.bilateralFilter(image, 9, 75, 75)

        # Enhance colors
        enhanced = self._restore_colors(smoothed, level='high')

        # Add slight vignette effect
        h, w = enhanced.shape[:2]
        mask = np.zeros((h, w), dtype=np.float32)
        cv2.ellipse(mask, (w//2, h//2), (w//2, h//2), 0, 0, 360, 1, -1)
        mask = cv2.GaussianBlur(mask, (0, 0), w/4)

        result = enhanced.copy()
        for i in range(3):
            result[:, :, i] = result[:, :, i] * mask

        return np.clip(result, 0, 255).astype(np.uint8)

    def _apply_modern_style(self, image):
        """Apply modern art style"""
        # Increase contrast and saturation
        pil_image = Image.fromarray(image)

        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(pil_image)
        contrasted = enhancer.enhance(1.3)

        enhancer = ImageEnhance.Color(contrasted)
        saturated = enhancer.enhance(1.5)

        # Add edge enhancement
        result = np.array(saturated)
        edges = cv2.Canny(cv2.cvtColor(result, cv2.COLOR_RGB2GRAY), 50, 150)
        edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)

        # Blend edges with image
        result = cv2.addWeighted(result, 0.95, edges_colored, 0.05, 0)

        return result

    def _apply_impressionist_style(self, image):
        """Apply impressionist painting style"""
        # Apply oil painting effect
        result = cv2.xphoto.oilPainting(image, 7, 1)

        # Add brush stroke effect using morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        dilated = cv2.dilate(result, kernel, iterations=1)
        eroded = cv2.erode(dilated, kernel, iterations=1)

        # Blend for impressionist effect
        result = cv2.addWeighted(result, 0.6, eroded, 0.4, 0)

        # Enhance colors slightly
        result = self._restore_colors(result, level='medium')

        return result

    def detect_damage(self, image_path):
        """
        Detect damaged areas in artwork

        Args:
            image_path: Path to input image

        Returns:
            Dictionary with damage information and mask
        """
        try:
            logger.info("Detecting damage in artwork")

            # Load image
            image = self.image_processor.load_image(image_path)

            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Detect very bright spots (tears, fading)
            _, bright_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)

            # Detect very dark spots (stains, damage)
            _, dark_mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY_INV)

            # Combine masks
            damage_mask = cv2.bitwise_or(bright_mask, dark_mask)

            # Calculate damage percentage
            total_pixels = damage_mask.size
            damaged_pixels = np.sum(damage_mask > 0)
            damage_percentage = (damaged_pixels / total_pixels) * 100

            # Detect scratches using edge detection
            edges = cv2.Canny(gray, 50, 150)
            scratches = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

            result = {
                "damage_percentage": round(damage_percentage, 2),
                "has_bright_spots": np.sum(bright_mask) > 0,
                "has_dark_spots": np.sum(dark_mask) > 0,
                "has_scratches": np.sum(scratches) > 100,
                "damage_mask": damage_mask,
                "scratch_mask": scratches,
            }

            logger.info(f"Damage detection completed: {damage_percentage:.2f}% damaged")
            return result

        except Exception as e:
            logger.error(f"Damage detection failed: {str(e)}")
            raise
