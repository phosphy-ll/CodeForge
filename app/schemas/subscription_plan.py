from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubscriptionPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tier: str
    price_usd: float
    discount_percent: int
    is_active: bool
    features_json: dict
    created_at: datetime


class GrantTierRequest(BaseModel):
    user_id: int
    subscription_tier: str = Field(min_length=4, max_length=20)
