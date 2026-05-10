from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizGenerateRequest(BaseModel):
    goal_id: int
    skill_name: str = Field(min_length=2, max_length=200)
    language: str | None = Field(default=None, max_length=64)
    question_count: int = Field(default=5, ge=5, le=15)


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str


class QuizGenerateResponse(BaseModel):
    title: str
    skill_name: str
    question_count: int
    max_points: int
    questions: list[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    goal_id: int | None = None
    skill_name: str = Field(min_length=2, max_length=200)
    question_count: int = Field(ge=5, le=15)
    correct_count: int = Field(ge=0)


class ExamGenerateRequest(BaseModel):
    goal_id: int
    skill_name: str = Field(min_length=2, max_length=200)
    language: str | None = Field(default=None, max_length=64)
    difficulty: int = Field(default=3, ge=1, le=5)


class ExamGenerateResponse(BaseModel):
    title: str
    skill_name: str
    max_points: int
    time_limit_minutes: int
    task_title: str
    task_description: str
    expected_proof: list[str]


class ExamSubmitRequest(BaseModel):
    goal_id: int | None = None
    skill_name: str = Field(min_length=2, max_length=200)
    content_text: str | None = Field(default=None, max_length=8000)
    content_code: str | None = Field(default=None, max_length=40000)


class ExamAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    goal_id: int | None
    attempt_type: str
    skill_name: str
    score: int | None
    earned_points: int
    max_points: int
    status: str
    feedback: str | None
    suspicion_score: int | None
    followup_question: str | None
    affects_streak: bool
    manual_review_requested: bool
    reviewed_at: datetime | None
    created_at: datetime


class AttemptSubmitResponse(BaseModel):
    attempt: ExamAttemptResponse
    best_attempt: ExamAttemptResponse | None
    attempts_used: int
    attempts_allowed: int
    can_retry: bool