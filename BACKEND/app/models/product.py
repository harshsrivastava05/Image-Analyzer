from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    brand: str = Field(..., min_length=1, max_length=100)
    image_url: Optional[HttpUrl] = None
    rating: Optional[Decimal] = Field(None, ge=0, le=5, decimal_places=2)
    review_count: Optional[int] = Field(None, ge=0)
    in_stock: bool = True

class Product(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProductWithSimilarity(Product):
    similarity_score: float = Field(..., ge=0, le=1)
    match_reason: Optional[str] = None

class ObjectIdentification(BaseModel):
    identified_object: str
    category: Optional[str] = None
    brand: Optional[str] = None
    type: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)
    search_terms: List[str] = []
    attributes: Dict[str, Any] = {}

class SearchResponse(BaseModel):
    status: str = Field(..., regex="^(found|not_found|error)$")
    message: str
    identification: Optional[ObjectIdentification] = None
    similar_products: List[ProductWithSimilarity] = []
    total_found: int = 0
    search_time: Optional[float] = None

class ProductSearchFilter(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    min_rating: Optional[Decimal] = None
    in_stock_only: bool = True
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class ImageAnalysisRequest(BaseModel):
    image_url: HttpUrl

class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    total_products: int
    timestamp: datetime
