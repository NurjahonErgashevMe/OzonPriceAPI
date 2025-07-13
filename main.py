import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.parser_routes import router as parser_router
from config.settings import settings
import time


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Ozon Price Parser API",
    description="API for parsing product prices from Ozon",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.2f}s")
    
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(parser_router, prefix="/api/v1", tags=["parser"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Ozon Price Parser API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Ozon Price Parser API...")
    logger.info(f"Settings: Headless={settings.HEADLESS}, Max articles={settings.MAX_ARTICLES_PER_REQUEST}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Ozon Price Parser API...")
    
    # Clean up parser instance
    from routes.parser_routes import parser_instance
    if parser_instance:
        parser_instance.close()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_DEBUG,
        log_level="info"
    )