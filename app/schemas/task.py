from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import TaskStatus, TaskType, VerificationType


class TaskCreate(BaseModel):
    milestone_id: int
    title: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    task_type: TaskType
    verification_type: VerificationType
    max_attempts: int = Field(default=5, ge=1, le=10)
    required_score: int = Field(default=70, ge=0, le=100)
    reward_points: int = Field(ge=1, le=1000)

    is_required: bool = True
    unlock_condition_text: str | None = Field(default=None, max_length=255)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    estimated_minutes: int | None = Field(default=None, ge=1, le=1440)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    milestone_id: int
    title: str
    description: str | None
    task_type: str
    verification_type: str
    max_attempts: int
    required_score: int
    reward_points: int
    status: TaskStatus

    is_required: bool
    unlock_condition_text: str | None
    difficulty: int | None
    estimated_minutes: int | None

    created_at: datetime
    updated_at: datetime

class TaskCardResponse(BaseModel):
    id: int
    title: str
    description: str | None

    task_type: str
    verification_type: str
    status: str

    difficulty: int | None
    estimated_minutes: int | None

    reward_points: int
    required_score: int

    is_required: bool
    unlock_condition_text: str | None

    attempts_used: int
    failed_attempts: int
    attempts_left: int

    last_submission_status: str | None
    last_submission_score: int | None
    last_submission_feedback: str | None

    manual_review_requested: bool

    can_submit: bool
    can_skip: bool
    can_request_manual_review: bool
