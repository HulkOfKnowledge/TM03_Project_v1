"""
API Route: POST /analyze
Analyze credit data and generate insights
"""

from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import AnalyzeCreditRequest, AnalyzeCreditResponse
from app.core.security import verify_api_key
from app.services.analyzer import CreditAnalyzer

router = APIRouter()
analyzer = CreditAnalyzer()


@router.post("/analyze", response_model=AnalyzeCreditResponse)
async def analyze_credit(
    request: AnalyzeCreditRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Analyze user's credit data and generate insights
    
    TODO: Implement credit analysis logic
    - Call CreditAnalyzer service
    - Generate insights based on credit data
    - Calculate overall credit score
    - Return structured insights and recommendations
    """
    try:
        return analyzer.analyze(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
