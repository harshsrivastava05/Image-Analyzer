import aiomysql
from typing import AsyncGenerator
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.pool = None
    
    async def create_pool(self):
        """Create MySQL connection pool"""
        try:
            self.pool = await aiomysql.create_pool(
                host=settings.mysql_host,
                port=settings.mysql_port,
                user=settings.mysql_user,
                password=settings.mysql_password,
                db=settings.mysql_database,
                charset='utf8mb4',
                autocommit=True,
                maxsize=20,
                minsize=5,
                echo=False  # Disable query logging for production
            )
            logger.info("MySQL connection pool created successfully")
            
            # Test the connection
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT 1")
                    result = await cursor.fetchone()
                    logger.info(f"Database connection test successful: {result}")
                    
        except Exception as e:
            logger.error(f"Failed to create MySQL pool: {e}")
            raise
    
    async def close_pool(self):
        """Close MySQL connection pool"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("MySQL connection pool closed")
    
    async def get_connection(self) -> AsyncGenerator:
        """Get database connection from pool"""
        if not self.pool:
            await self.create_pool()
        
        try:
            async with self.pool.acquire() as connection:
                yield connection
        except Exception as e:
            logger.error(f"Error acquiring database connection: {e}")
            raise

# Global database manager instance
db_manager = DatabaseManager()

async def get_db_connection():
    """Dependency to get database connection"""
    async for connection in db_manager.get_connection():
        yield connection