from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class LeaderboardEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    username: str | None = None

    period_type: str
    period_start: date
    period_end: date
    score_points: int
    verified_tasks: int
    rank: int | None
    created_at: datetime
    updated_at: datetime


class LeaderboardResponse(BaseModel):
    period_type: str
    period_start: date
    top_entries: list[LeaderboardEntryResponse]
    current_user_entry: LeaderboardEntryResponse | None