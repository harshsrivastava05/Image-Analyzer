from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Google Gemini API
    google_api_key: str
    
    # MySQL Database
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str
    mysql_database: str = "visual_product_matcher"
    
    # FastAPI Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    
    class Config:
        env_file = ".env"

settings = Settings()
