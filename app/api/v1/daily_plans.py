from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.services.daily_service import DailyService

router = APIRouter(prefix="/daily-plans", tags=["Daily Plans"])


@router.get("/today")
async def get_today_daily_plans(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DailyService(db)
    return await service.get_today_plans(current_user)


@router.post("/{plan_id}/regenerate")
async def regenerate_daily_plan(
    plan_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DailyService(db)

    try:
        return await service.regenerate_plan(current_user, plan_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{plan_id}/replace-task")
async def replace_daily_plan_task(
    plan_id: int,
    old_task_id: int,
    new_task_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DailyService(db)

    try:
        return await service.replace_task(
            user=current_user,
            plan_id=plan_id,
            old_task_id=old_task_id,
            new_task_id=new_task_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
