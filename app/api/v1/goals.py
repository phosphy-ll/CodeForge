from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse
from app.services.goal_service import GoalService
from app.domain.subscription import (
    get_allowed_languages_for_user,
    get_user_limits,
)

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> GoalResponse:
    service = GoalService(db)
    try:
        goal = await service.create_goal(current_user, data)
        return GoalResponse.model_validate(goal)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[GoalResponse])
async def get_my_goals(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[GoalResponse]:
    service = GoalService(db)
    goals = await service.get_user_goals(current_user)
    return [GoalResponse.model_validate(goal) for goal in goals]

@router.get("/allowed-languages")
async def get_allowed_languages(
    current_user: Annotated[User, Depends(get_current_user)],
):
    limits = get_user_limits(current_user)

    return {
        "subscription_tier": current_user.subscription_tier,
        "languages": get_allowed_languages_for_user(current_user),
        "custom_language_allowed": limits.get(
            "custom_language_allowed",
            False,
        ),
    }
    
@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal_by_id(
    goal_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> GoalResponse:
    service = GoalService(db)
    try:
        goal = await service.get_goal_for_user(current_user, goal_id)
        return GoalResponse.model_validate(goal)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


