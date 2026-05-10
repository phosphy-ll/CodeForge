from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, get_admin_user, get_current_user
from app.models.user import User
from app.schemas.achievement import AchievementResponse, UserAchievementResponse
from app.services.achievement_service import AchievementService

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("", response_model=list[AchievementResponse])
async def get_all_achievements(db: DbSession):
    service = AchievementService(db)
    items = await service.get_all_achievements()
    return [AchievementResponse.model_validate(x) for x in items]


@router.get("/me", response_model=list[UserAchievementResponse])
async def get_my_achievements(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = AchievementService(db)
    await service.evaluate_user_achievements(current_user.id)
    items = await service.get_user_achievements(current_user.id)
    return [UserAchievementResponse.model_validate(x) for x in items]


@router.post("/issue-beta/{user_id}", response_model=UserAchievementResponse)
async def issue_beta(
    user_id: int,
    db: DbSession,
    admin_user: Annotated[User, Depends(get_admin_user)],
):
    service = AchievementService(db)
    item = await service.issue_beta_tester(admin_user, user_id)
    return UserAchievementResponse.model_validate(item)
