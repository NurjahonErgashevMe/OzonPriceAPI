from pydantic import BaseModel, Field, validator
from typing import List, Optional
from config.settings import settings


class ArticlesRequest(BaseModel):
    articles: List[int] = Field(..., min_items=1, max_items=settings.MAX_ARTICLES_PER_REQUEST)
    
    @validator('articles')
    def validate_articles(cls, v):
        if not v:
            raise ValueError('Articles list cannot be empty')
        return v


class SellerInfo(BaseModel):
    name: str


class PriceInfo(BaseModel):
    cardPrice: Optional[int] = None
    price: Optional[int] = None
    originalPrice: Optional[int] = None

class ArticleResult(BaseModel):
    article: int
    success: bool
    isAvailable: Optional[bool] = None
    title: Optional[str] = None
    seller: Optional[SellerInfo] = None
    price_info: Optional[PriceInfo] = None
    error: Optional[str] = None


class ParseResponse(BaseModel):
    success: bool
    total_articles: int
    parsed_articles: int
    results: List[ArticleResult]
    errors: List[str] = []