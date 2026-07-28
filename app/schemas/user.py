from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic import Field
from app.domain.enums import SubscriptionTier, UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    avatar_url: str | None = None
    bio: str | None = None
    is_email_verified: bool
    role: UserRole
    subscription_tier: SubscriptionTier
    rank: str
    hardcore_enabled: bool
    is_active: bool
    rating: int
    weekly_freezes_total: int
    weekly_freezes_used: int
    subscription_expires_at: datetime | None
    polar_subscription_cancel_at_period_end: bool = False
    polar_subscription_current_period_end: datetime | None = None
    beta_tester: bool

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

class UserProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=500)
    bio: str | None = Field(default=None, max_length=300)