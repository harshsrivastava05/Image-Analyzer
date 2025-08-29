from PIL import Image
import io
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self):
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.allowed_formats = {'JPEG', 'PNG', 'WEBP', 'JPG'}
        self.max_dimensions = (2048, 2048)
    
    def validate_and_process_image(self, image_data: bytes, filename: str = None) -> Tuple[bool, str, Optional[bytes]]:
        """
        Validate and process uploaded image
        Returns: (is_valid, message, processed_image_data)
        """
        try:
            # Check file size
            if len(image_data) > self.max_file_size:
                return False, f"Image size exceeds maximum limit of {self.max_file_size // (1024*1024)}MB", None
            
            # Try to open image
            try:
                image = Image.open(io.BytesIO(image_data))
            except Exception as e:
                return False, f"Invalid image format: {str(e)}", None
            
            # Check format
            if image.format not in self.allowed_formats:
                return False, f"Unsupported image format: {image.format}. Allowed: {', '.join(self.allowed_formats)}", None
            
            # Resize if necessary
            if image.width > self.max_dimensions[0] or image.height > self.max_dimensions[1]:
                logger.info(f"Resizing image from {image.width}x{image.height} to fit {self.max_dimensions}")
                image.thumbnail(self.max_dimensions, Image.Resampling.LANCZOS)
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode in ('RGBA', 'P'):
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                rgb_image.paste(image, mask=image.split()[-1] if len(image.split()) == 4 else None)
                image = rgb_image
            
            # Save processed image to bytes
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            processed_data = output.getvalue()
            
            logger.info(f"Image processed successfully: {len(processed_data)} bytes")
            return True, "Image processed successfully", processed_data
            
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return False, f"Image processing failed: {str(e)}", None
    
    def get_image_info(self, image_data: bytes) -> dict:
        """
        Get image information
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            return {
                "format": image.format,
                "mode": image.mode,
                "size": image.size,
                "width": image.width,
                "height": image.height
            }
        except Exception as e:
            logger.error(f"Error getting image info: {e}")
            return {}
