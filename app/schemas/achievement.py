from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    title: str
    description: str
    category: str
    requirement_type: str
    requirement_value: int
    icon: str | None
    is_active: bool
    created_at: datetime


class UserAchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    achievement_id: int
    progress_value: int
    is_completed: bool
    unlocked_at: datetime | None
