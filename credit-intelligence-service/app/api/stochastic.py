"""
API Routes: Stochastic Planning
- POST /spending-probability (Markov Chain)
- POST /card-choice (MDP)
"""

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_api_key
from app.models.schemas import (
    SpendingProbabilityRequest,
    SpendingProbabilityResponse,
    CardChoiceRequest,
    CardChoiceResponse,
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


@router.post("/card-choice", response_model=CardChoiceResponse)
async def get_card_choice(
    request: CardChoiceRequest,
    api_key: str = Depends(verify_api_key),
):
    """Recommend best card at a merchant using an MDP-style policy."""
    try:
        return stochastic_planner.choose_card_for_merchant(request)
    except InsufficientDataError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "code": e.code,
                "message": str(e),
                "details": e.details,
            },
        )
    except NoRewardDataError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "code": e.code,
                "message": str(e),
                "skipped_cards": e.skipped_cards,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute card choice policy: {str(e)}")


@router.post("/reward-catalog/invalidate")
async def invalidate_reward_catalog(
    api_key: str = Depends(verify_api_key),
):
    """Invalidate cached reward catalog so next card-choice reloads from DB."""
    stochastic_planner.invalidate_reward_catalog_cache()
    return {"success": True, "message": "Reward catalog cache invalidated"}
