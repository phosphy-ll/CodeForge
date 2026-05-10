from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    goal_id: Mapped[int] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False,
    )

    plan_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="ai_generated", nullable=False)

    replace_used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    regenerate_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    tasks = relationship(
        "DailyPlanTask",
        back_populates="daily_plan",
        cascade="all, delete-orphan",
    )


class DailyPlanTask(Base):
    __tablename__ = "daily_plan_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    daily_plan_id: Mapped[int] = mapped_column(
        ForeignKey("daily_plans.id", ondelete="CASCADE"),
        nullable=False,
    )

    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )

    order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    daily_plan = relationship("DailyPlan", back_populates="tasks")
    task = relationship("Task")
