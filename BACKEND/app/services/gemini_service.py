import google.generativeai as genai
from PIL import Image
import requests
from io import BytesIO
import json
import logging
from typing import Dict, Any, Optional
from app.config.settings import settings
from app.models.product import ObjectIdentification

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel('gemini-pro-vision')
    
    async def identify_product_from_image(self, image_data: bytes) -> ObjectIdentification:
        """
        Use Google Gemini Vision to identify the product in the image
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_data))
            
            # Prepare the prompt for structured output
            prompt = """
            Analyze this image and identify the main product/object shown. 
            
            Please provide a structured response in the following JSON format:
            {
                "identified_object": "exact product name if recognizable, otherwise generic description",
                "category": "one of: Electronics, Fashion, Home & Living, Beauty & Health, Sports & Outdoors",
                "brand": "brand name if clearly visible, otherwise null",
                "type": "specific product type (e.g., smartphone, sneakers, laptop)",
                "confidence": "confidence score between 0 and 1",
                "search_terms": ["array", "of", "relevant", "search", "keywords"],
                "attributes": {
                    "color": "dominant color if applicable",
                    "style": "style description if applicable",
                    "features": "notable features visible"
                }
            }
            
            Focus on providing accurate information that can be used to search a product database.
            If you cannot clearly identify the product, provide a generic description with lower confidence.
            """
            
            # Generate response
            response = self.model.generate_content([prompt, image])
            
            # Parse the response
            response_text = response.text.strip()
            logger.info(f"Gemini raw response: {response_text}")
            
            # Extract JSON from response
            try:
                # Try to find JSON in the response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    parsed_data = json.loads(json_str)
                else:
                    # Fallback parsing
                    parsed_data = self._parse_fallback_response(response_text)
                
                # Create ObjectIdentification instance
                identification = ObjectIdentification(**parsed_data)
                logger.info(f"Successfully identified object: {identification.identified_object}")
                return identification
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {e}")
                return self._create_fallback_identification(response_text)
                
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._create_error_identification()
    
    async def identify_product_from_url(self, image_url: str) -> ObjectIdentification:
        """
        Download image from URL and identify the product
        """
        try:
            # Download image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Check if it's an image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                raise ValueError(f"URL does not point to an image: {content_type}")
            
            return await self.identify_product_from_image(response.content)
            
        except Exception as e:
            logger.error(f"Error processing image URL {image_url}: {e}")
            return self._create_error_identification()
    
    def _parse_fallback_response(self, response_text: str) -> Dict[str, Any]:
        """
        Fallback parsing for non-JSON responses
        """
        # Extract key information using simple string parsing
        lines = response_text.split('\n')
        
        return {
            "identified_object": "Unknown Product",
            "category": None,
            "brand": None,
            "type": "product",
            "confidence": 0.5,
            "search_terms": ["product", "item"],
            "attributes": {
                "description": response_text[:200] + "..." if len(response_text) > 200 else response_text
            }
        }
    
    def _create_fallback_identification(self, response_text: str) -> ObjectIdentification:
        """
        Create a fallback identification when JSON parsing fails
        """
        return ObjectIdentification(
            identified_object="Unidentified Product",
            category=None,
            brand=None,
            type="product",
            confidence=0.3,
            search_terms=["product", "item"],
            attributes={"raw_response": response_text[:200]}
        )
    
    def _create_error_identification(self) -> ObjectIdentification:
        """
        Create an error identification when the service fails
        """
        return ObjectIdentification(
            identified_object="Analysis Failed",
            category=None,
            brand=None,
            type="unknown",
            confidence=0.0,
            search_terms=[],
            attributes={"error": "Failed to analyze image"}
        )
