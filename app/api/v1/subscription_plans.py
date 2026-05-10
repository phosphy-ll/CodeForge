from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, get_admin_user, get_current_user
from app.models.user import User
from app.schemas.subscription_plan import GrantTierRequest, SubscriptionPlanResponse
from app.schemas.user import UserResponse
from app.services.subscription_service import SubscriptionService
from app.domain.subscription import get_allowed_languages_for_user

router = APIRouter(prefix="/subscription-plans", tags=["Subscription Plans"])


@router.get("", response_model=list[SubscriptionPlanResponse])
async def get_active_plans(db: DbSession):
    service = SubscriptionService(db)
    plans = await service.get_active_plans()
    return [SubscriptionPlanResponse.model_validate(p) for p in plans]


@router.post("/grant-tier", response_model=UserResponse)
async def grant_tier(
    data: GrantTierRequest,
    db: DbSession,
    admin_user: Annotated[User, Depends(get_admin_user)],
):
    service = SubscriptionService(db)
    user = await service.grant_tier(
        admin_user,
        user_id=data.user_id,
        subscription_tier=data.subscription_tier,
    )
    return UserResponse.model_validate(user)

@router.get("/allowed-languages")
async def get_allowed_languages(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return {
        "subscription_tier": current_user.subscription_tier,
        "languages": get_allowed_languages_for_user(current_user),
    }
