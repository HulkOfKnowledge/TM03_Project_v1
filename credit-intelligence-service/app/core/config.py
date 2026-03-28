"""
Configuration Settings
Uses Pydantic Settings for environment variable management
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Configuration
    API_KEY: str = "development-key-change-in-production"
    WEBHOOK_SECRET: str = "webhook-secret-change-in-production"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Service Configuration
    SERVICE_NAME: str = "credit-intelligence-service"
    DEBUG: bool = True
    
    # Next.js Backend URL (for callbacks)
    NEXTJS_API_URL: str = "http://localhost:3000/api"

    # Supabase (reward catalog source for stochastic card-choice)
    SUPABASE_URL: Optional[str] = None
    NEXT_PUBLIC_SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Optional[str] = None
    
    # Database (if needed for caching)
    # DATABASE_URL: str = ""
    
    # ML Model Configuration
    MODEL_PATH: str = "./models"
    USE_ML_MODEL: bool = False  # Set to True when ML model is ready
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
