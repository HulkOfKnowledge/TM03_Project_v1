"""
API Route: POST /analyze
Analyze credit data and generate insights
"""

from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import (
    AnalyzeCreditRequest, 
    AnalyzeCreditResponse,
    TransactionInsightRequest,
    TransactionInsightResponse,
    TransactionInsight
)
from app.core.security import verify_api_key
from app.services.analyzer import CreditAnalyzer
from app.services.transaction_insights import transaction_insights

router = APIRouter()
analyzer = CreditAnalyzer()


@router.post("/analyze", response_model=AnalyzeCreditResponse)
async def analyze_credit(
    request: AnalyzeCreditRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Analyze user's credit data and generate insights
    
    Returns:
    - Overall credit health score (0-100)
    - Personalized insights (alerts, recommendations, achievements, tips)
    - Payment recommendations
    """
    try:
        # Analyze credit using hybrid rules + ML approach
        result = analyzer.analyze(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/transaction-insight", response_model=TransactionInsightResponse)
async def get_transaction_insight(
    request: TransactionInsightRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Get insights for a specific transaction
    
    Returns insights such as:
    - "You have $X left before reaching 30% utilization"
    - "Large dining expense detected"
    - "Payment due in X days"
    """
    try:
        # Generate transaction-level insight
        insight = transaction_insights.generate_transaction_insight(
            transaction=request.transaction.dict(),
            card_context=request.card_context
        )
        
        insights_list = []
        if insight:
            insights_list.append(TransactionInsight(
                type=insight['type'],
                severity=insight['severity'],
                message=insight['message'],
                metadata=insight.get('metadata')
            ))
        
        return TransactionInsightResponse(
            transaction_id=request.transaction.id,
            insights=insights_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insight: {str(e)}")

