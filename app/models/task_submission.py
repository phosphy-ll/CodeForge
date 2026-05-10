from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)

    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    earned_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    status: Mapped[str] = mapped_column(String(30), default="pending_review", nullable=False)
    reviewer_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_not_verified: Mapped[str | None] = mapped_column(Text, nullable=True)
    improvement_steps: Mapped[str | None] = mapped_column(Text, nullable=True)

    suspicion_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    followup_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    followup_answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    manual_review_requested: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    task = relationship("Task", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
