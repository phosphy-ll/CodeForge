from datetime import datetime
from pydantic import BaseModel


class ExecutionFeedItem(BaseModel):
    id: int
    source: str  # task | practice | quiz | exam
    title: str
    skill_name: str | None = None
    status: str
    score: int | None = None
    earned_points: int = 0
    max_points: int | None = None
    suspicion_score: int | None = None
    feedback: str | None = None
    manual_review_requested: bool = False
    created_at: datetime


class ExecutionFeedResponse(BaseModel):
    total_items: int
    avg_score: int | None
    total_earned_points: int
    rejected_count: int
    partial_count: int
    verified_count: int
    items: list[ExecutionFeedItem]