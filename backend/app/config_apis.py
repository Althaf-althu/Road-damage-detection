import os
from pydantic_settings import BaseSettings
from typing import Optional


class APIKeysConfig(BaseSettings):
    # Region Configuration
    REGION_NAME: str = "kerala"
    REGION_DISPLAY_NAME: str = "Kerala"
    REGION_AUTHORITY: str = "Kerala Public Works Department"
    REGION_AUTHORITY_SHORT: str = "Kerala PWD"
    REGION_OSM_RELATION_ID: int = 1263070
    REGION_BBOX: str = "8.17,74.85,12.78,77.42"

    # LLM Provider
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Maps
    NEXT_PUBLIC_MAPBOX_TOKEN: Optional[str] = None

    # Email (Gmail SMTP primary)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_APP_PASSWORD: Optional[str] = None
    EMAIL_FROM_ADDRESS: str = "noreply@keralaroads.gov.in"
    EMAIL_FROM_NAME: str = "Kerala PWD Road Maintenance"

    # Email alternatives
    RESEND_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None

    # Storage
    STORAGE_BACKEND: str = "local"
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    class Config:
        env_file = ["api_keys.env", ".env", "../api_keys.env", "../.env"]
        env_file_encoding = "utf-8"
        extra = "ignore"


class AppConfig(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/road_damage_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "change_this_to_a_random_secret_key_minimum_32_chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Spatial defaults (admin-overridable per complaint for mis-snap correction)
    DEFAULT_SNAP_RADIUS_M: float = 25.0
    DEFAULT_DEDUP_RADIUS_M: float = 30.0
    RESOLVED_GREEN_DAYS: int = 90

    class Config:
        env_file = [".env", "../.env"]
        env_file_encoding = "utf-8"
        extra = "ignore"


api_keys = APIKeysConfig()
app_config = AppConfig()

