from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    task_title_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_code: Mapped[str | None] = mapped_column(Text, nullable=True)

    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    suspicion_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    followup_question: Mapped[str | None] = mapped_column(Text, nullable=True)

    potential_reward_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
