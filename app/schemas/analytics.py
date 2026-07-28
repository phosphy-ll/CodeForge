from pydantic import BaseModel, Field


class AnalyticsEventCreate(BaseModel):
    event_name: str = Field(min_length=2, max_length=80)
    session_id: str | None = Field(default=None, max_length=100)
    path: str | None = Field(default=None, max_length=500)
    metadata: dict | None = None