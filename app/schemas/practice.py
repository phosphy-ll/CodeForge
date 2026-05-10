from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PracticeRequest(BaseModel):
    content_text: str | None = Field(default=None, max_length=5000)
    content_code: str | None = Field(default=None, max_length=30000)


class PracticeResponse(BaseModel):
    mode: str
    score: int
    feedback: str | None
    suspicion_score: int
    followup_question: str | None
    earned_points: int
    potential_reward_points: int
    affects_streak: bool
    task_title: str


class PracticeAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    task_id: int
    task_title_snapshot: str
    content_text: str | None
    content_code: str | None
    score: int
    feedback: str | None
    suspicion_score: int
    followup_question: str | None
    potential_reward_points: int
    created_at: datetime


class PracticeSkillFocus(BaseModel):
    skill_name: str
    weakness_score: float
    weakness_percent: int
    tier: str


class PracticeDrill(BaseModel):
    id: str
    skill_name: str
    tier: str
    title: str
    description: str
    difficulty: int
    estimated_minutes: int
    reward_points: int
    reason: str
    action_type: str


class PracticeDrillsResponse(BaseModel):
    focus_skill: PracticeSkillFocus | None
    recovery_drills: list[PracticeDrill]
    stabilization_drills: list[PracticeDrill]
    mastery_drills: list[PracticeDrill]