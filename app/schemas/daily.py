from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DailyPlanTaskShortResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    daily_plan_id: int
    task_id: int
    order: int
    is_required: bool


class DailyPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    goal_id: int
    plan_date: date
    source: str
    replace_used_count: int
    regenerate_used: bool
    is_locked: bool
    created_at: datetime
    tasks: list[DailyPlanTaskShortResponse]

    can_replace_task_today: bool
    can_regenerate_today: bool


class DailyReplaceRequest(BaseModel):
    plan_id: int
    old_task_id: int
    new_task_id: int


class DailyRegenerateRequest(BaseModel):
    plan_id: int
