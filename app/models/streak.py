from datetime import datetime, date

from sqlalchemy import Date, DateTime, ForeignKey, Integer, func, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserStreak(Base):
    __tablename__ = "user_streaks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    today_verified_points = Column(Integer, default=0, nullable=False)

    last_streak_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship("User")


class StreakLog(Base):
    __tablename__ = "streak_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    date: Mapped[date] = mapped_column(Date, nullable=False)
    earned_points: Mapped[int] = mapped_column(Integer, default=0)

    streak_days_added: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
