from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.domain.enums import SubscriptionTier, UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(300), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    email_verification_code: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    email_verification_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default=UserRole.USER.value,
        nullable=False,
    )

    subscription_tier: Mapped[str] = mapped_column(
        String(20),
        default=SubscriptionTier.FREE.value,
        nullable=False,
    )

    rank: Mapped[str] = mapped_column(
        String(30),
        default="trainee",
        nullable=False,
    )

    hardcore_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)

    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)

    pressure_level: Mapped[str] = mapped_column(
        String(20),
        default="normal",
        nullable=False,
    )

    ai_strictness: Mapped[str] = mapped_column(
        String(20),
        default="balanced",
        nullable=False,
    )

    daily_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    streak_warning_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    inactivity_alert_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    
    weekly_freezes_total: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    weekly_freezes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Almaty", nullable=False)
    daily_reminder_hour: Mapped[int] = mapped_column(Integer, default=12, nullable=False)
    streak_warning_hour: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
 
    password_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    beta_tester: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("TaskSubmission", back_populates="user", cascade="all, delete-orphan")
