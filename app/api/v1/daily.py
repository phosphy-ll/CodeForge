from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.daily import DailyPlanResponse, DailyRegenerateRequest, DailyReplaceRequest
from app.services.daily_service import DailyService

router = APIRouter(prefix="/daily", tags=["Daily"])


@router.get("/today", response_model=list[DailyPlanResponse])
async def get_today_plans(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DailyService(db)
    return await service.get_today_plans(current_user)


@router.post("/replace-task", response_model=DailyPlanResponse)
async def replace_task(
    data: DailyReplaceRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DailyService(db)
    try:
        return await service.replace_task(
            current_user,
            plan_id=data.plan_id,
            old_task_id=data.old_task_id,
            new_task_id=data.new_task_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/regenerate", response_model=DailyPlanResponse)
async def regenerate_plan(
    data: DailyRegenerateRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DailyService(db)
    try:
        return await service.regenerate_plan(current_user, plan_id=data.plan_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
