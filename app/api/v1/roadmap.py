from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.services.roadmap_service import RoadmapService

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


@router.get("/goal/{goal_id}")
async def get_goal_roadmap(
    goal_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = RoadmapService(db)
    try:
        return await service.get_goal_roadmap(current_user, goal_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
