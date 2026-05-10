from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    milestone_id: Mapped[int] = mapped_column(
        ForeignKey("milestones.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    task_type: Mapped[str] = mapped_column(String(20), nullable=False)
    verification_type: Mapped[str] = mapped_column(String(20), nullable=False)
    skill_tag: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    
    max_attempts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    required_score: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    reward_points: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="available", nullable=False)

    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    unlock_condition_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    difficulty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

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

    milestone = relationship("Milestone", back_populates="tasks")
    submissions = relationship(
        "TaskSubmission",
        back_populates="task",
        cascade="all, delete-orphan",
    )
