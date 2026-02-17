"""
API Route: POST /recommendations
Generate payment recommendations
"""

from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import (
    PaymentRecommendationRequest,
    PaymentRecommendationResponse
)
from app.core.security import verify_api_key
from app.services.recommender import PaymentRecommender

router = APIRouter()
recommender = PaymentRecommender()


@router.post("/recommendations", response_model=PaymentRecommendationResponse)
async def get_payment_recommendations(
    request: PaymentRecommendationRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Generate personalized payment recommendations
    
    Handles scenarios like:
    - User owes $2000 across 3 cards but has only $1000 to pay
    
    Optimization strategies:
    - minimize_interest: Pay highest APR cards first (Avalanche method)
    - improve_score: Pay highest utilization cards first  
    - balanced: Use ML + rules for optimal allocation
    
    Returns:
    - Prioritized payment recommendations for each card
    - Expected impact (interest saved, utilization improvement, score impact)
    - Projected savings (monthly and annual)
    """
    try:
        # Generate payment recommendations using hybrid approach
        result = recommender.recommend(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

