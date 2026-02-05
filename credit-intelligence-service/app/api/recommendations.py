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
    
    TODO: Implement payment recommendation logic
    - Call PaymentRecommender service
    - Optimize payment allocation based on goal
    - Calculate projected savings
    - Return prioritized payment strategy
    """
    try:
        return recommender.recommend(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
