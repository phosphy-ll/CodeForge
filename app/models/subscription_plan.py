from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tier: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    price_usd: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    discount_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    features_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
