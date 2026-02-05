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

# TODO: Import routers when implemented
# from app.api.routes import analyze, recommendations, simulate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    TODO: Load ML models on startup
    TODO: Initialize database connections if needed
    TODO: Set up logging
    """
    # Startup
    print("Starting Credit Intelligence Service...")
    # TODO: Load ML models here
    # TODO: Initialize resources
    
    yield
    
    # Shutdown
    print("Shutting down Credit Intelligence Service...")
    # TODO: Clean up resources


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
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    TODO: Add actual health checks (DB, models loaded, etc.)
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        # TODO: Add model status
        # TODO: Add database connection status
    }


app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["recommendations"])
# app.include_router(simulate.router, prefix="/api/v1", tags=["simulate"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Set to False in production
    )
