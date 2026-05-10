from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.constants import (
    DAILY_STREAK_REQUIRED_POINTS,
    DAILY_STREAK_BONUS_THRESHOLD,
)
from app.models.exam_attempt import ExamAttempt
from app.models.streak import StreakLog
from app.models.task_submission import TaskSubmission
from app.repositories.streak_repository import StreakRepository


class StreakService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = StreakRepository(session)

    async def apply_points(self, user_id: int, earned_points: int = 0):
        streak = await self.repo.get_or_create(user_id)
        today = date.today()

        total_today = await self.get_total_streak_points_today(user_id)

        streak.today_verified_points = total_today

        if total_today < DAILY_STREAK_REQUIRED_POINTS:
            return await self.repo.update(streak)

        if streak.last_streak_date == today:
            return await self.repo.update(streak)

        days_added = 1

        if total_today >= DAILY_STREAK_BONUS_THRESHOLD:
            days_added += 1

        streak.current_streak += days_added

        if streak.current_streak > streak.best_streak:
            streak.best_streak = streak.current_streak

        streak.last_streak_date = today

        log = StreakLog(
            user_id=user_id,
            date=today,
            earned_points=total_today,
            streak_days_added=days_added,
        )

        self.session.add(log)

        return await self.repo.update(streak)

    async def get_total_streak_points_today(self, user_id: int) -> int:
        today = date.today()

        task_points_result = await self.session.execute(
            select(func.coalesce(func.sum(TaskSubmission.earned_points), 0)).where(
                TaskSubmission.user_id == user_id,
                func.date(TaskSubmission.created_at) == today,
            )
        )

        exam_points_result = await self.session.execute(
            select(func.coalesce(func.sum(ExamAttempt.earned_points), 0)).where(
                ExamAttempt.user_id == user_id,
                ExamAttempt.affects_streak.is_(True),
                func.date(ExamAttempt.created_at) == today,
            )
        )

        task_points = int(task_points_result.scalar() or 0)
        exam_points = int(exam_points_result.scalar() or 0)

        return task_points + exam_points