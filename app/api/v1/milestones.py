from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.milestone import MilestoneCreate, MilestoneResponse
from app.services.milestone_service import MilestoneService

router = APIRouter(prefix="/milestones", tags=["Milestones"])


@router.post("", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    data: MilestoneCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> MilestoneResponse:
    service = MilestoneService(db)
    try:
        milestone = await service.create_milestone(current_user, data)
        return MilestoneResponse.model_validate(milestone)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/goal/{goal_id}", response_model=list[MilestoneResponse])
async def get_goal_milestones(
    goal_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[MilestoneResponse]:
    service = MilestoneService(db)
    try:
        milestones = await service.get_goal_milestones(current_user, goal_id)
        return [MilestoneResponse.model_validate(m) for m in milestones]
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
