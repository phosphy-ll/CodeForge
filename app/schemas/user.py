from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr

from app.domain.enums import SubscriptionTier, UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    is_email_verified: bool
    role: UserRole
    subscription_tier: SubscriptionTier
    rank: str
    hardcore_enabled: bool
    is_active: bool
    rating: int
    weekly_freezes_total: int
    weekly_freezes_used: int

    theme: str
    pressure_level: str
    ai_strictness: str
    daily_reminder_enabled: bool
    streak_warning_enabled: bool
    inactivity_alert_enabled: bool
    timezone: str
    daily_reminder_hour: int
    streak_warning_hour: int

    created_at: datetime


class UserSettingsUpdate(BaseModel):
    theme: Literal["dark", "light"] | None = None
    pressure_level: Literal["soft", "normal", "hard"] | None = None
    ai_strictness: Literal["lenient", "balanced", "strict"] | None = None
    daily_reminder_enabled: bool | None = None
    streak_warning_enabled: bool | None = None
    inactivity_alert_enabled: bool | None = None
    timezone: str | None = None
    daily_reminder_hour: int | None = None
    streak_warning_hour: int | None = None