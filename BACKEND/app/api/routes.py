from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
from datetime import datetime

from app.services.gemini_service import GeminiService
from app.services.product_service import ProductService
from app.services.image_service import ImageService
from app.models.product import (
    SearchResponse, 
    ImageAnalysisRequest, 
    ProductSearchFilter, 
    Product,
    HealthResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
gemini_service = GeminiService()
product_service = ProductService()
image_service = ImageService()

@router.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Visual Product Matcher API",
        "version": "1.0.0",
        "description": "AI-powered visual product matching using Google Gemini Vision and MySQL",
        "endpoints": {
            "analyze_image": "POST /analyze-image",
            "analyze_image_url": "POST /analyze-image-url",
            "get_products": "GET /products",
            "get_categories": "GET /categories",
            "database_stats": "GET /database/stats",
            "health_check": "GET /health"
        }
    }

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with database connectivity test"""
    try:
        stats = await product_service.get_database_stats()
        database_connected = stats["total_products"] >= 0
        
        return HealthResponse(
            status="healthy" if database_connected else "unhealthy",
            database_connected=database_connected,
            total_products=stats["total_products"],
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            database_connected=False,
            total_products=0,
            timestamp=datetime.now()
        )

@router.post("/analyze-image", response_model=SearchResponse)
async def analyze_uploaded_image(file: UploadFile = File(...)):
    """
    Analyze uploaded image file for product identification and matching
    """
    try:
        # Validate file
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_data = await file.read()
        
        is_valid, message, processed_image = image_service.validate_and_process_image(
            image_data, file.filename
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Step 1: Identify object using Google Gemini
        logger.info("Starting object identification with Google Gemini...")
        identification = await gemini_service.identify_product_from_image(processed_image)
        
        # Step 2: Search database for similar products
        logger.info(f"Searching database for: {identification.identified_object}")
        search_result = await product_service.find_similar_products_by_identification(identification)
        
        return SearchResponse(**search_result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/analyze-image-url", response_model=SearchResponse)
async def analyze_image_from_url(request: ImageAnalysisRequest):
    """
    Analyze image from URL for product identification and matching
    """
    try:
        # Step 1: Identify object using Google Gemini
        logger.info(f"Starting object identification from URL: {request.image_url}")
        identification = await gemini_service.identify_product_from_url(str(request.image_url))
        
        # Step 2: Search database for similar products
        logger.info(f"Searching database for: {identification.identified_object}")
        search_result = await product_service.find_similar_products_by_identification(identification)
        
        return SearchResponse(**search_result)
    
    except Exception as e:
        logger.error(f"URL image analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    min_rating: Optional[float] = Query(None, description="Minimum rating filter"),
    in_stock_only: bool = Query(True, description="Show only in-stock products"),
    limit: int = Query(20, ge=1, le=100, description="Number of products to return"),
    offset: int = Query(0, ge=0, description="Number of products to skip")
):
    """
    Get products with optional filtering and pagination
    """
    try:
        filters = ProductSearchFilter(
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            in_stock_only=in_stock_only,
            limit=limit,
            offset=offset
        )
        
        products = await product_service.get_all_products(filters)
        return products
    
    except Exception as e:
        logger.error(f"Error getting products: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get products: {str(e)}")

@router.get("/categories", response_model=List[str])
async def get_categories():
    """
    Get all available product categories
    """
    try:
        categories = await product_service.get_categories()
        return categories
    
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@router.get("/database/stats", response_model=dict)
async def get_database_statistics():
    """
    Get database statistics and metrics
    """
    try:
        stats = await product_service.get_database_stats()
        return {
            "database_stats": stats,
            "timestamp": datetime.now(),
            "status": "healthy"
        }
    
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get database stats: {str(e)}")

@router.get("/products/search", response_model=List[Product])
async def search_products_by_text(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return")
):
    """
    Text-based product search
    """
    try:
        # Create a simple text search using the existing product service
        filters = ProductSearchFilter(
            category=category,
            limit=limit,
            offset=0
        )
        
        # Get all products and filter by search query
        all_products = await product_service.get_all_products(filters)
        
        # Simple text matching
        query_lower = q.lower()
        matching_products = [
            product for product in all_products
            if query_lower in product.name.lower() or 
               (product.description and query_lower in product.description.lower()) or
               query_lower in product.brand.lower() or
               query_lower in product.category.lower()
        ]
        
        return matching_products[:limit]
    
    except Exception as e:
        logger.error(f"Error searching products: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
