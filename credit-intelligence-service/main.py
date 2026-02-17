"""
FastAPI Application - Credit Intelligence Service
Main entry point for the Python microservice
"""

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from app.core.config import settings
from app.api import analyze, recommendations, simulate
from app.ml.models import ml_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    Load ML models on startup
    """
    # Startup
    print("=" * 60)
    print("Starting Credit Intelligence Service...")
    print("=" * 60)
    
    # Load ML models (will load from disk if trained, or use rules-based fallback)
    print("Loading ML models...")
    try:
        ml_models._load_models()
        if ml_models.payment_priority_model:
            print("✓ Payment priority model loaded")
        else:
            print("⚠ Payment priority model not found - using rule-based fallback")
        
        if ml_models.spending_pattern_model:
            print("✓ Spending pattern model loaded")
        else:
            print("⚠ Spending pattern model not found - using rule-based fallback")
        
        if ml_models.utilization_predictor:
            print("✓ Utilization predictor loaded")
        else:
            print("⚠ Utilization predictor not found - using rule-based fallback")
    except Exception as e:
        print(f"⚠ Warning: Could not load ML models: {e}")
        print("Falling back to rule-based analysis")
    
    print("\nService ready!")
    print("=" * 60)
    
    yield
    
    # Shutdown
    print("\nShutting down Credit Intelligence Service...")


app = FastAPI(
    title="Creduman Credit Intelligence Service",
    description="AI-powered credit analysis and recommendations for Creduman platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Creduman Credit Intelligence",
        "version": "0.1.0",
        "status": "running",
        "models": {
            "payment_priority": ml_models.payment_priority_model is not None,
            "spending_pattern": ml_models.spending_pattern_model is not None,
            "utilization_predictor": ml_models.utilization_predictor is not None
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    models_loaded = (
        ml_models.payment_priority_model is not None or
        ml_models.spending_pattern_model is not None or
        ml_models.utilization_predictor is not None
    )
    
    return {
        "status": "healthy",
        "version": "0.1.0",
        "ml_models_loaded": models_loaded,
        "fallback_mode": not models_loaded
    }


# Include API routers
app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["recommendations"])
app.include_router(simulate.router, prefix="/api/v1", tags=["simulate"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Set to False in production
    )

