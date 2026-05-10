from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import (
    AccountabilityMode,
    CodingLevel,
    GoalStatus,
    GoalType,
    LearningStyle,
    ProgrammingLanguage,
)


class GoalCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    language: str
    goal_type: GoalType
    declared_level: CodingLevel
    learning_style: LearningStyle
    accountability_mode: AccountabilityMode
    target_months: int = Field(ge=1, le=24)


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str | None
    language: str
    goal_type: str
    declared_level: str
    detected_level: str | None
    effective_level: str | None
    learning_style: str
    accountability_mode: str
    target_months: int
    optimal_months: int | None
    status: GoalStatus
    created_at: datetime
    updated_at: datetime
