from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    language: Mapped[str] = mapped_column(String(30), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)

    declared_level: Mapped[str] = mapped_column(String(30), nullable=False)
    detected_level: Mapped[str | None] = mapped_column(String(30), nullable=True)
    effective_level: Mapped[str | None] = mapped_column(String(30), nullable=True)

    learning_style: Mapped[str] = mapped_column(String(30), nullable=False)
    accountability_mode: Mapped[str] = mapped_column(String(20), nullable=False)

    target_months: Mapped[int] = mapped_column(Integer, nullable=False)
    optimal_months: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="goals")
    milestones = relationship(
        "Milestone",
        back_populates="goal",
        cascade="all, delete-orphan",
    )
