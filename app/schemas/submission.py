from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.enums import ReviewerType, SubmissionStatus


class SubmissionCreate(BaseModel):
    task_id: int
    content_text: str | None = Field(default=None, max_length=5000)
    content_code: str | None = Field(default=None, max_length=30000)
    content_link: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_content(self):
        if not any([self.content_text, self.content_code, self.content_link]):
            raise ValueError("At least one submission content field must be provided")
        return self


class SubmissionReviewRequest(BaseModel):
    score: int = Field(ge=0, le=100)
    feedback: str | None = Field(default=None, max_length=3000)
    reviewer_type: ReviewerType = ReviewerType.AI
    suspicion_score: int | None = Field(default=None, ge=0, le=100)
    followup_question: str | None = Field(default=None, max_length=2000)


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    attempt_number: int
    content_text: str | None
    content_code: str | None
    content_link: str | None
    score: int | None
    earned_points: int
    status: SubmissionStatus
    reviewer_type: str | None
    feedback: str | None
    why_not_verified: str | None
    improvement_steps: str | None
    suspicion_score: int | None
    followup_question: str | None
    followup_answer: str | None
    reviewed_at: datetime | None
    manual_review_requested: bool
    created_at: datetime

class SubmissionPrecheckRequest(BaseModel):
    task_id: int
    content_text: str | None = Field(default=None, max_length=5000)
    content_code: str | None = Field(default=None, max_length=30000)
    content_link: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_content(self):
        if not any([self.content_text, self.content_code, self.content_link]):
            raise ValueError("At least one submission content field must be provided")
        return self


class SubmissionPrecheckResponse(BaseModel):
    can_submit: bool
    confidence_score: float
    confidence_label: str
    rejection_risk: str
    likely_issues: list[str]
    tips: list[str]

class SubmissionFollowupAnswerRequest(BaseModel):
    answer: str = Field(min_length=2, max_length=5000)

class SubmissionManualReviewRequest(BaseModel):
    status: SubmissionStatus
    score: int = Field(ge=0, le=100)
    earned_points: int | None = Field(default=None, ge=0, le=1000)
    feedback: str = Field(min_length=2, max_length=3000)
    why_not_verified: str | None = Field(default=None, max_length=3000)
    improvement_steps: str | None = Field(default=None, max_length=3000)
    suspicion_score: int | None = Field(default=0, ge=0, le=100)

