from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    goal_id: Mapped[int | None] = mapped_column(ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)

    attempt_type: Mapped[str] = mapped_column(String(20), nullable=False)  # quiz | exam
    skill_name: Mapped[str] = mapped_column(String(200), nullable=False)

    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_code: Mapped[str | None] = mapped_column(Text, nullable=True)

    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    earned_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_points: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(String(40), default="pending_review", nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    suspicion_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    followup_question: Mapped[str | None] = mapped_column(Text, nullable=True)

    affects_streak: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    manual_review_requested: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )