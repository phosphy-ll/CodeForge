import json

from pydantic import BaseModel, Field, field_validator


class AnalyticsEventCreate(BaseModel):
    event_name: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9_]+$")
    session_id: str | None = Field(default=None, max_length=100)
    path: str | None = Field(default=None, max_length=500)
    metadata: dict | None = None

    @field_validator("metadata")
    @classmethod
    def validate_metadata_size(cls, value: dict | None):
        if value is None:
            return value

        encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        if len(encoded.encode("utf-8")) > 4096:
            raise ValueError("Analytics metadata is too large")

        return value
