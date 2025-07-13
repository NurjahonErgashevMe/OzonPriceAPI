import logging
import time
from fastapi import APIRouter, HTTPException, status
from models.schemas import ArticlesRequest, ParseResponse, ArticleResult
from parser.ozon_parser import OzonParser
from typing import List


logger = logging.getLogger(__name__)
router = APIRouter()

# Global parser instance (будет заменено на pool в будущем)
parser_instance = None


def get_parser():
    """
    Get or create parser instance
    """
    global parser_instance
    if parser_instance is None:
        parser_instance = OzonParser()
        parser_instance.initialize()
    return parser_instance


@router.post("/get_price", response_model=ParseResponse)
async def get_price(request: ArticlesRequest):
    """
    Parse prices for given articles
    """
    try:
        start_time = time.time()
        logger.info(f"Received request to parse {len(request.articles)} articles")
        
        # Get parser instance
        parser = get_parser()
        
        # Parse articles
        results = parser.parse_articles(request.articles)
        
        # Calculate timing
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_article = total_time / len(request.articles) if request.articles else 0
        
        # Calculate statistics
        successful_results = [r for r in results if r.success]
        failed_results = [r for r in results if not r.success]
        
        # Collect errors
        errors = [r.error for r in failed_results if r.error]
        
        response = ParseResponse(
            success=len(successful_results) > 0,
            total_articles=len(request.articles),
            parsed_articles=len(successful_results),
            results=results,
            errors=errors
        )
        
        logger.info(f"Parsing completed in {total_time:.2f}s. Success: {len(successful_results)}, Failed: {len(failed_results)}. Average: {avg_time_per_article:.2f}s per article")
        
        return response
        
    except Exception as e:
        logger.error(f"Error in get_price endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "ok", "message": "Ozon parser API is running"}


@router.post("/restart_parser")
async def restart_parser():
    """
    Restart parser instance (useful for debugging)
    """
    global parser_instance
    try:
        if parser_instance:
            parser_instance.close()
        parser_instance = None
        
        # Initialize new parser
        parser_instance = OzonParser()
        parser_instance.initialize()
        
        return {"status": "success", "message": "Parser restarted successfully"}
        
    except Exception as e:
        logger.error(f"Error restarting parser: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restart parser: {str(e)}"
        )