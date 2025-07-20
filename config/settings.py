from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_DEBUG: bool = True
    
    # Selenium settings
    HEADLESS: bool = True
    IMPLICIT_WAIT: int = 20
    PAGE_LOAD_TIMEOUT: int = 60
    
    # Ozon settings
    OZON_BASE_URL: str = "https://www.ozon.ru"
    OZON_API_URL: str = "https://www.ozon.ru/api/composer-api.bx/page/json/v2"
    MAX_ARTICLES_PER_REQUEST: int = 50
    
    # Parser settings
    MAX_RETRIES: int = 5
    RETRY_DELAY: int = 5
    REQUEST_TIMEOUT: int = 30
    
    # Worker settings
    MAX_ARTICLES_PER_WORKER: int = 10
    MAX_WORKERS: int = 5
    
    # Browser settings
    USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    
    class Config:
        env_file = ".env"


settings = Settings()