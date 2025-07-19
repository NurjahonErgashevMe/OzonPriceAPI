import json
import re
import logging
from typing import Optional, Dict, Any
from models.schemas import PriceInfo, SellerInfo


logger = logging.getLogger(__name__)


def extract_price_from_string(price_str: str) -> Optional[int]:
    """
    Extract numeric price from string like '55 325 ₽' or '61 472 ₽'
    """
    if not price_str:
        return None
    
    # Remove currency symbols and spaces
    cleaned = re.sub(r'[^\d]', '', price_str)
    
    try:
        return int(cleaned) if cleaned else None
    except ValueError:
        logger.warning(f"Failed to parse price: {price_str}")
        return None


def parse_price_data(price_json_str: str) -> Optional[PriceInfo]:
    """
    Parse price data from JSON string
    """
    try:
        price_data = json.loads(price_json_str)
        
        return PriceInfo(
            cardPrice=extract_price_from_string(price_data.get('cardPrice')),
            price=extract_price_from_string(price_data.get('price')),
            originalPrice=extract_price_from_string(price_data.get('originalPrice'))
        )
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error(f"Failed to parse price data: {e}")
        return None


def find_web_price_property(widget_states: Dict[str, Any]) -> Optional[str]:
    """
    Find webPrice property in widgetStates
    """
    for key, value in widget_states.items():
        if key.startswith('webPrice-') and isinstance(value, str):
            return value
    return None


def find_product_title(widget_states: Dict[str, Any]) -> Optional[str]:
    """
    Find product title in webProductHeading property
    """
    for key, value in widget_states.items():
        if key.startswith('webProductHeading-') and isinstance(value, str):
            try:
                heading_data = json.loads(value)
                return heading_data.get('title')
            except (json.JSONDecodeError, KeyError):
                continue
    return None


def find_seller_name(widget_states: Dict[str, Any]) -> Optional[str]:
    """
    Find seller name in webStickyProducts property
    """
    for key, value in widget_states.items():
        if key.startswith('webStickyProducts-') and isinstance(value, str):
            try:
                # Replace HTML entities before parsing
                cleaned_value = value.replace('&quot;', '"')
                sticky_data = json.loads(cleaned_value)
                if 'seller' in sticky_data and 'name' in sticky_data['seller']:
                    return sticky_data['seller']['name']
            except (json.JSONDecodeError, KeyError):
                continue
    return None



def build_ozon_api_url(article: int) -> str:
    """
    Build Ozon API URL for article
    """
    base_url = "https://www.ozon.ru/api/composer-api.bx/page/json/v2"
    
    params = {
        "url": f"/product/{article}/"
    }
    
    # Build full URL
    url = f"{base_url}?url={params['url']}"
    
    logger.info(f"Built URL for article {article}: {url}")
    return url


def is_valid_json_response(response_text: str) -> bool:
    """
    Check if response is valid JSON
    """
    try:
        json.loads(response_text)
        return True
    except json.JSONDecodeError:
        return False