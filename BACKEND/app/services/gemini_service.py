import google.generativeai as genai
from PIL import Image
import requests
from io import BytesIO
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from app.config.settings import settings
from app.models.product import ObjectIdentification

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.google_api_key)
        # Updated to use the correct model name
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
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
            Return only valid JSON without any additional text or formatting.
            """
            
            # Generate response using async wrapper
            response = await self._generate_content_async([prompt, image])
            
            # Parse the response
            response_text = response.text.strip()
            logger.info(f"Gemini raw response: {response_text}")
            
            # Extract JSON from response
            try:
                # Clean the response text
                response_text = response_text.replace('```json', '').replace('```', '').strip()
                
                # Try to find JSON in the response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    parsed_data = json.loads(json_str)
                else:
                    # Fallback parsing
                    parsed_data = self._parse_fallback_response(response_text)
                
                # Validate and clean the parsed data
                parsed_data = self._validate_identification_data(parsed_data)
                
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
            # Download image with timeout and size limits
            response = requests.get(
                image_url, 
                timeout=10,
                headers={'User-Agent': 'Visual-Product-Matcher/1.0'},
                stream=True
            )
            response.raise_for_status()
            
            # Check content length
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                raise ValueError("Image file too large")
            
            # Check if it's an image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                raise ValueError(f"URL does not point to an image: {content_type}")
            
            # Read content with size limit
            image_data = BytesIO()
            size = 0
            for chunk in response.iter_content(chunk_size=8192):
                size += len(chunk)
                if size > 10 * 1024 * 1024:  # 10MB limit
                    raise ValueError("Image file too large")
                image_data.write(chunk)
            
            return await self.identify_product_from_image(image_data.getvalue())
            
        except Exception as e:
            logger.error(f"Error processing image URL {image_url}: {e}")
            return self._create_error_identification()
    
    async def _generate_content_async(self, content):
        """
        Async wrapper for Gemini's generate_content method
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.model.generate_content, content)
    
    def _validate_identification_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and clean identification data
        """
        # Ensure required fields exist with defaults
        validated_data = {
            "identified_object": data.get("identified_object", "Unknown Product"),
            "category": data.get("category"),
            "brand": data.get("brand"),
            "type": data.get("type", "product"),
            "confidence": max(0.0, min(1.0, float(data.get("confidence", 0.5)))),
            "search_terms": data.get("search_terms", []),
            "attributes": data.get("attributes", {})
        }
        
        # Validate category
        valid_categories = ["Electronics", "Fashion", "Home & Living", "Beauty & Health", "Sports & Outdoors"]
        if validated_data["category"] not in valid_categories:
            validated_data["category"] = None
        
        # Ensure search_terms is a list
        if not isinstance(validated_data["search_terms"], list):
            validated_data["search_terms"] = []
        
        # Ensure attributes is a dict
        if not isinstance(validated_data["attributes"], dict):
            validated_data["attributes"] = {}
        
        return validated_data
    
    def _parse_fallback_response(self, response_text: str) -> Dict[str, Any]:
        """
        Fallback parsing for non-JSON responses
        """
        # Extract key information using simple string parsing
        lines = [line.strip() for line in response_text.split('\n') if line.strip()]
        
        # Try to extract basic information
        identified_object = "Unknown Product"
        if lines:
            # Use first meaningful line as product identification
            for line in lines:
                if len(line) > 5 and not line.startswith('{'):
                    identified_object = line[:100]  # Limit length
                    break
        
        return {
            "identified_object": identified_object,
            "category": None,
            "brand": None,
            "type": "product",
            "confidence": 0.5,
            "search_terms": self._extract_keywords_from_text(response_text),
            "attributes": {
                "description": response_text[:200] + "..." if len(response_text) > 200 else response_text
            }
        }
    
    def _extract_keywords_from_text(self, text: str) -> list:
        """
        Extract potential keywords from text for search
        """
        # Simple keyword extraction
        words = text.lower().split()
        keywords = []
        
        # Filter for potentially useful words
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
        
        for word in words:
            cleaned_word = ''.join(c for c in word if c.isalnum())
            if len(cleaned_word) > 2 and cleaned_word not in stopwords:
                keywords.append(cleaned_word)
                if len(keywords) >= 5:  # Limit keywords
                    break
        
        return keywords[:5]
    
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
            search_terms=self._extract_keywords_from_text(response_text),
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