import aiomysql
from typing import List, Optional, Dict, Any, Tuple
import logging
import time
from decimal import Decimal
from app.models.product import Product, ProductWithSimilarity, ObjectIdentification, ProductSearchFilter
from app.config.database import get_db_connection

logger = logging.getLogger(__name__)

class ProductService:
    def __init__(self):
        self.search_strategies = [
            self._exact_brand_category_search,
            self._category_keyword_search, 
            self._keyword_search,  # Renamed from fulltext_search
            self._tag_based_search
        ]
    
    async def find_similar_products_by_identification(
        self, 
        identification: ObjectIdentification,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Find similar products based on object identification
        Uses 4-tier search strategy for comprehensive matching
        """
        start_time = time.time()
        
        try:
            async for connection in get_db_connection():
                # Try each search strategy in order of precision
                for i, search_strategy in enumerate(self.search_strategies):
                    try:
                        products = await search_strategy(connection, identification, limit)
                        
                        if products:
                            search_time = time.time() - start_time
                            logger.info(f"Found {len(products)} products using strategy {i+1} in {search_time:.2f}s")
                            
                            return {
                                "status": "found",
                                "message": f"Found {len(products)} similar products",
                                "identification": identification,
                                "similar_products": products,
                                "total_found": len(products),
                                "search_time": search_time,
                                "strategy_used": i + 1
                            }
                    
                    except Exception as e:
                        logger.warning(f"Search strategy {i+1} failed: {e}")
                        continue
                
                # No products found with any strategy
                search_time = time.time() - start_time
                return {
                    "status": "not_found",
                    "message": "This product is not available in the database",
                    "identification": identification,
                    "similar_products": [],
                    "total_found": 0,
                    "search_time": search_time
                }
        
        except Exception as e:
            logger.error(f"Database error in product search: {e}")
            return {
                "status": "error",
                "message": f"Database error: {str(e)}",
                "identification": identification,
                "similar_products": [],
                "total_found": 0,
                "search_time": time.time() - start_time
            }
    
    async def _exact_brand_category_search(
        self, 
        connection: aiomysql.Connection, 
        identification: ObjectIdentification, 
        limit: int
    ) -> List[ProductWithSimilarity]:
        """
        Strategy 1: Exact brand and category match (highest precision)
        """
        if not identification.brand or not identification.category:
            return []
        
        query = """
            SELECT * FROM products 
            WHERE LOWER(brand) = LOWER(%s) 
            AND LOWER(category) = LOWER(%s)
            AND in_stock = 1
            ORDER BY rating DESC, review_count DESC
            LIMIT %s
        """
        
        async with connection.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, (identification.brand, identification.category, limit))
            rows = await cursor.fetchall()
            
            products = []
            for row in rows:
                # Convert Decimal fields to float for Pydantic
                row = self._convert_decimal_fields(row)
                product = Product(**row)
                product_with_similarity = ProductWithSimilarity(
                    **product.dict(),
                    similarity_score=0.95,  # High similarity for exact matches
                    match_reason=f"Exact brand ({identification.brand}) and category match"
                )
                products.append(product_with_similarity)
            
            return products
    
    async def _category_keyword_search(
        self, 
        connection: aiomysql.Connection, 
        identification: ObjectIdentification, 
        limit: int
    ) -> List[ProductWithSimilarity]:
        """
        Strategy 2: Category match with keyword search
        """
        if not identification.category or not identification.search_terms:
            return []
        
        # Build keyword search conditions
        keyword_conditions = []
        params = [identification.brand or '', identification.category]
        
        for term in identification.search_terms[:3]:  # Limit to 3 most relevant terms
            keyword_conditions.append("(LOWER(name) LIKE %s OR LOWER(description) LIKE %s)")
            params.extend([f"%{term.lower()}%", f"%{term.lower()}%"])
        
        if not keyword_conditions:
            return []
        
        query = f"""
            SELECT *, 
            (CASE 
                WHEN LOWER(brand) = LOWER(%s) THEN 0.2 
                ELSE 0 
            END) as brand_bonus
            FROM products 
            WHERE LOWER(category) = LOWER(%s) 
            AND ({' OR '.join(keyword_conditions)})
            AND in_stock = 1
            ORDER BY brand_bonus DESC, rating DESC, review_count DESC
            LIMIT %s
        """
        
        params.append(limit)
        
        async with connection.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, params)
            rows = await cursor.fetchall()
            
            products = []
            for row in rows:
                brand_bonus = row.pop('brand_bonus', 0)
                row = self._convert_decimal_fields(row)
                product = Product(**row)
                similarity_score = 0.8 + brand_bonus  # Base similarity + brand bonus
                
                product_with_similarity = ProductWithSimilarity(
                    **product.dict(),
                    similarity_score=min(similarity_score, 1.0),
                    match_reason=f"Category and keyword match"
                )
                products.append(product_with_similarity)
            
            return products
    
    async def _keyword_search(
        self, 
        connection: aiomysql.Connection, 
        identification: ObjectIdentification, 
        limit: int
    ) -> List[ProductWithSimilarity]:
        """
        Strategy 3: Keyword search on product names and descriptions
        """
        if not identification.search_terms:
            return []
        
        # Build keyword search conditions
        keyword_conditions = []
        params = []
        
        for term in identification.search_terms[:3]:
            keyword_conditions.append("(LOWER(name) LIKE %s OR LOWER(description) LIKE %s OR LOWER(brand) LIKE %s)")
            term_pattern = f"%{term.lower()}%"
            params.extend([term_pattern, term_pattern, term_pattern])
        
        if not keyword_conditions:
            return []
        
        query = f"""
            SELECT * FROM products 
            WHERE ({' OR '.join(keyword_conditions)})
            AND in_stock = 1
            ORDER BY rating DESC, review_count DESC
            LIMIT %s
        """
        
        params.append(limit)
        
        async with connection.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, params)
            rows = await cursor.fetchall()
            
            products = []
            for row in rows:
                row = self._convert_decimal_fields(row)
                product = Product(**row)
                
                product_with_similarity = ProductWithSimilarity(
                    **product.dict(),
                    similarity_score=0.6,  # Medium similarity for keyword matches
                    match_reason=f"Keyword search match"
                )
                products.append(product_with_similarity)
            
            return products
    
    async def _tag_based_search(
        self, 
        connection: aiomysql.Connection, 
        identification: ObjectIdentification, 
        limit: int
    ) -> List[ProductWithSimilarity]:
        """
        Strategy 4: Tag-based search (lowest precision, broadest coverage)
        """
        if not identification.search_terms:
            return []
        
        try:
            # Build tag search conditions
            tag_placeholders = ','.join(['%s'] * len(identification.search_terms[:3]))
            
            query = f"""
                SELECT p.*, COUNT(pt.tag) as tag_matches
                FROM products p
                JOIN product_tags pt ON p.id = pt.product_id
                WHERE LOWER(pt.tag) IN ({tag_placeholders})
                AND p.in_stock = 1
                GROUP BY p.id
                ORDER BY tag_matches DESC, p.rating DESC, p.review_count DESC
                LIMIT %s
            """
            
            params = [term.lower() for term in identification.search_terms[:3]] + [limit]
            
            async with connection.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, params)
                rows = await cursor.fetchall()
                
                products = []
                max_tags = max([row['tag_matches'] for row in rows]) if rows else 1
                
                for row in rows:
                    tag_matches = row.pop('tag_matches')
                    row = self._convert_decimal_fields(row)
                    product = Product(**row)
                    
                    # Calculate similarity based on tag matches
                    tag_similarity = (tag_matches / max_tags) * 0.6  # Max 0.6 for tag-based
                    
                    product_with_similarity = ProductWithSimilarity(
                        **product.dict(),
                        similarity_score=max(0.2, tag_similarity),  # Minimum 0.2
                        match_reason=f"Tag-based match ({tag_matches} matching tags)"
                    )
                    products.append(product_with_similarity)
                
                return products
        
        except Exception as e:
            logger.warning(f"Tag-based search failed: {e}")
            return []
    
    async def get_all_products(self, filters: ProductSearchFilter) -> List[Product]:
        """
        Get all products with optional filtering
        """
        try:
            async for connection in get_db_connection():
                conditions = ["1=1"]  # Base condition
                params = []
                
                # Apply filters
                if filters.category:
                    conditions.append("LOWER(category) = LOWER(%s)")
                    params.append(filters.category)
                
                if filters.brand:
                    conditions.append("LOWER(brand) = LOWER(%s)")
                    params.append(filters.brand)
                
                if filters.min_price:
                    conditions.append("price >= %s")
                    params.append(filters.min_price)
                
                if filters.max_price:
                    conditions.append("price <= %s")
                    params.append(filters.max_price)
                
                if filters.min_rating:
                    conditions.append("rating >= %s")
                    params.append(filters.min_rating)
                
                if filters.in_stock_only:
                    conditions.append("in_stock = 1")
                
                # Build query
                query = f"""
                    SELECT * FROM products 
                    WHERE {' AND '.join(conditions)}
                    ORDER BY rating DESC, review_count DESC, price ASC
                    LIMIT %s OFFSET %s
                """
                
                params.extend([filters.limit, filters.offset])
                
                async with connection.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query, params)
                    rows = await cursor.fetchall()
                    
                    products = []
                    for row in rows:
                        row = self._convert_decimal_fields(row)
                        products.append(Product(**row))
                    
                    return products
        
        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return []
    
    async def get_categories(self) -> List[str]:
        """
        Get all available product categories
        """
        try:
            async for connection in get_db_connection():
                query = "SELECT DISTINCT category FROM products ORDER BY category"
                
                async with connection.cursor() as cursor:
                    await cursor.execute(query)
                    rows = await cursor.fetchall()
                    
                    return [row[0] for row in rows]
        
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """
        Get database statistics
        """
        try:
            async for connection in get_db_connection():
                stats_query = """
                    SELECT 
                        COUNT(*) as total_products,
                        COUNT(DISTINCT category) as total_categories,
                        COUNT(DISTINCT brand) as total_brands,
                        AVG(price) as avg_price,
                        AVG(rating) as avg_rating,
                        SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) as in_stock_count
                    FROM products
                """
                
                async with connection.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(stats_query)
                    stats = await cursor.fetchone()
                    
                    return {
                        "total_products": stats["total_products"] or 0,
                        "total_categories": stats["total_categories"] or 0,
                        "total_brands": stats["total_brands"] or 0,
                        "average_price": float(stats["avg_price"]) if stats["avg_price"] else 0,
                        "average_rating": float(stats["avg_rating"]) if stats["avg_rating"] else 0,
                        "in_stock_products": stats["in_stock_count"] or 0
                    }
        
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {
                "total_products": 0,
                "total_categories": 0,
                "total_brands": 0,
                "average_price": 0,
                "average_rating": 0,
                "in_stock_products": 0
            }
    
    def _convert_decimal_fields(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert Decimal fields to float for Pydantic compatibility
        """
        converted_row = dict(row)
        
        # Convert Decimal fields to float
        decimal_fields = ['price', 'rating']
        for field in decimal_fields:
            if field in converted_row and isinstance(converted_row[field], Decimal):
                converted_row[field] = float(converted_row[field])
        
        return converted_row