"""
API Routes: Stochastic Planning
- POST /spending-probability (Markov Chain)
- POST /card-choice-batch (MDP batch)
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.core.security import verify_api_key
from app.models.schemas import (
    SpendingProbabilityRequest,
    SpendingProbabilityResponse,
    CardChoiceRequest,
    CardChoiceBatchRequest,
    CardChoiceBatchResponse,
    CardChoiceBatchItem,
    NewCardOpportunitiesRequest,
    NewCardOpportunitiesResponse,
)
from app.services.stochastic_planner import (
    NoRewardDataError,
    InsufficientDataError,
    stochastic_planner,
)

router = APIRouter()


@router.post("/spending-probability", response_model=SpendingProbabilityResponse)
async def get_spending_probability(
    request: SpendingProbabilityRequest,
    api_key: str = Depends(verify_api_key),
):
    """Predict next spending category probabilities using a Markov Chain."""
    try:
        return stochastic_planner.predict_spending_probability(request)
    except InsufficientDataError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "code": e.code,
                "message": str(e),
                "details": e.details,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute spending probabilities: {str(e)}")


@router.post("/card-choice-batch", response_model=CardChoiceBatchResponse)
async def get_card_choice_batch(
    request: CardChoiceBatchRequest,
    api_key: str = Depends(verify_api_key),
):
    """Evaluate multiple recent transactions in one request and return per-transaction card-choice outputs."""
    results = []

    for txn in request.recent_transactions:
        estimated_amount = abs(float(txn.amount or 0))
        if estimated_amount <= 0:
            continue

        merchant_name = txn.description or "Unknown merchant"
        merchant_category = txn.category

        single_request = CardChoiceRequest(
            user_id=request.user_id,
            merchant_name=merchant_name,
            merchant_category=merchant_category,
            used_card_id=txn.card_id,
            estimated_amount=estimated_amount,
            lookback_days=request.lookback_days,
            cards=request.cards,
            transactions=request.transactions,
        )

        try:
            choice = stochastic_planner.choose_card_for_merchant(single_request)
            results.append(
                CardChoiceBatchItem(
                    transaction_id=txn.id,
                    used_card_id=txn.card_id,
                    merchant_name=merchant_name,
                    merchant_category=merchant_category,
                    estimated_amount=estimated_amount,
                    card_choice=choice,
                )
            )
        except (InsufficientDataError, NoRewardDataError) as e:
            results.append(
                CardChoiceBatchItem(
                    transaction_id=txn.id,
                    used_card_id=txn.card_id,
                    merchant_name=merchant_name,
                    merchant_category=merchant_category,
                    estimated_amount=estimated_amount,
                    skipped_code=e.code,
                    skipped_reason=str(e),
                )
            )

    return CardChoiceBatchResponse(
        user_id=request.user_id,
        results=results,
        computed_at=datetime.utcnow().isoformat(),
    )


@router.post("/new-card-opportunities", response_model=NewCardOpportunitiesResponse)
async def get_new_card_opportunities(
    request: NewCardOpportunitiesRequest,
    api_key: str = Depends(verify_api_key),
):
    """Scenario 2 endpoint: recommend external cards user does not own for top spend categories."""
    try:
        return stochastic_planner.recommend_new_card_opportunities(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute new-card opportunities: {str(e)}")


@router.post("/reward-catalog/invalidate")
async def invalidate_reward_catalog(
    api_key: str = Depends(verify_api_key),
):
    """Invalidate cached reward catalog so next card-choice reloads from DB."""
    stochastic_planner.invalidate_reward_catalog_cache()
    return {"success": True, "message": "Reward catalog cache invalidated"}
