from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.leaderboard import LeaderboardResponse
from app.services.leaderboard_service import LeaderboardService

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/{period_type}", response_model=LeaderboardResponse)
async def get_leaderboard(
    period_type: str,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = LeaderboardService(db)

    try:
        await service.rebuild_period(period_type)
        data = await service.get_period(period_type, current_user.id)
        return LeaderboardResponse(**data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
