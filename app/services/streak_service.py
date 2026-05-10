from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.constants import (
    DAILY_STREAK_REQUIRED_POINTS,
    DAILY_STREAK_BONUS_THRESHOLD,
)
from app.models.streak import StreakLog
from app.repositories.streak_repository import StreakRepository


class StreakService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = StreakRepository(session)

    async def apply_points(self, user_id: int, earned_points_today: int):
        streak = await self.repo.get_or_create(user_id)
        today = date.today()

        if earned_points_today < DAILY_STREAK_REQUIRED_POINTS:
            return streak

        if streak.last_streak_date == today:
            return streak

        days_added = 1

        if earned_points_today >= DAILY_STREAK_BONUS_THRESHOLD:
            days_added += 1

        streak.current_streak += days_added

        if streak.current_streak > streak.best_streak:
            streak.best_streak = streak.current_streak

        streak.last_streak_date = today

        log = StreakLog(
            user_id=user_id,
            date=today,
            earned_points=earned_points_today,
            streak_days_added=days_added,
        )

        self.session.add(log)

        return await self.repo.update(streak)
