from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    skill_name: Mapped[str] = mapped_column(String(100))
    weakness_score: Mapped[float] = mapped_column(Float, default=0.5)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )