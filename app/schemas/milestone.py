from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import MilestoneStatus


class MilestoneCreate(BaseModel):
    goal_id: int
    title: str = Field(min_length=2, max_length=100)
    order: int = Field(ge=1)


class MilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    title: str
    order: int
    status: MilestoneStatus
    created_at: datetime
