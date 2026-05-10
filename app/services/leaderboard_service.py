from datetime import date, timedelta

from sqlalchemy import select

from app.models.goal import Goal
from app.models.leaderboard import LeaderboardEntry
from app.models.streak import UserStreak
from app.models.user import User
from app.models.task_submission import TaskSubmission
from app.repositories.leaderboard_repository import LeaderboardRepository


class LeaderboardService:
    def __init__(self, session) -> None:
        self.session = session
        self.repo = LeaderboardRepository(session)

    def _get_period_start(self, period_type: str) -> date:
        today = date.today()

        if period_type == "daily":
            return today
        if period_type == "weekly":
            return today - timedelta(days=today.weekday())
        if period_type == "monthly":
            return today.replace(day=1)

        raise ValueError("Invalid period type")

    def _get_period_end(self, period_type: str, period_start: date) -> date:
        if period_type == "daily":
            return period_start
        if period_type == "weekly":
            return period_start + timedelta(days=6)
        if period_type == "monthly":
            if period_start.month == 12:
                next_month = period_start.replace(year=period_start.year + 1, month=1, day=1)
            else:
                next_month = period_start.replace(month=period_start.month + 1, day=1)
            return next_month - timedelta(days=1)

        raise ValueError("Invalid period type")

    async def rebuild_period(self, period_type: str):
        period_start = self._get_period_start(period_type)
        period_end = self._get_period_end(period_type, period_start)

        users_result = await self.session.execute(select(User))
        users = list(users_result.scalars().all())

        scored_entries = []

        for user in users:
            subs_result = await self.session.execute(
                select(TaskSubmission).where(
                    TaskSubmission.user_id == user.id,
                    TaskSubmission.status == "verified",
                    TaskSubmission.created_at >= period_start,
                    TaskSubmission.created_at < (period_end + timedelta(days=1)),
                )
            )
            submissions = list(subs_result.scalars().all())

            streak_result = await self.session.execute(
                select(UserStreak).where(UserStreak.user_id == user.id)
            )
            streak = streak_result.scalar_one_or_none()

            score_points = sum(s.earned_points for s in submissions)
            verified_tasks = len(submissions)
            current_streak = streak.current_streak if streak else 0

            scored_entries.append(
                {
                    "user_id": user.id,
                    "score_points": score_points,
                    "verified_tasks": verified_tasks,
                    "current_streak": current_streak,
                }
            )

        scored_entries.sort(
            key=lambda x: (x["score_points"], x["current_streak"], x["verified_tasks"]),
            reverse=True,
        )

        for index, item in enumerate(scored_entries, start=1):
            existing = await self.repo.get_existing(item["user_id"], period_type, period_start)

            if existing:
                existing.period_end = period_end
                existing.score_points = item["score_points"]
                existing.verified_tasks = item["verified_tasks"]
                existing.rank = index
                await self.repo.update(existing)
            else:
                await self.repo.create(
                    LeaderboardEntry(
                        user_id=item["user_id"],
                        period_type=period_type,
                        period_start=period_start,
                        period_end=period_end,
                        score_points=item["score_points"],
                        verified_tasks=item["verified_tasks"],
                        rank=index,
                    )
                )

        return await self.get_period(period_type, None)

    async def get_period(self, period_type: str, current_user_id: int | None):
        period_start = self._get_period_start(period_type)

        entries = await self.repo.get_period_entries(period_type, period_start)
        current_user_entry = None

        if current_user_id is not None:
            current_user_entry = await self.repo.get_user_period_entry(
                current_user_id,
                period_type,
                period_start,
            )

        return {
            "period_type": period_type,
            "period_start": period_start,
            "top_entries": entries[:20],
            "current_user_entry": current_user_entry,
        }
