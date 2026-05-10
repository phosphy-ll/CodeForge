from datetime import datetime, timezone

from sqlalchemy import select

from app.models.achievement import Achievement, UserAchievement
from app.models.goal import Goal
from app.models.streak import UserStreak
from app.models.task_submission import TaskSubmission
from app.models.user import User
from app.repositories.achievement_repository import AchievementRepository


class AchievementService:
    def __init__(self, session) -> None:
        self.session = session
        self.repo = AchievementRepository(session)

    async def get_all_achievements(self):
        return await self.repo.get_all_active()

    async def get_user_achievements(self, user_id: int):
        return await self.repo.get_user_achievements(user_id)

    async def issue_beta_tester(self, admin_user: User, user_id: int):
        if admin_user.role != "admin":
            raise ValueError("Only admin can issue beta tester")

        achievement = await self.repo.get_by_key("beta_tester")
        if not achievement:
            raise ValueError("Achievement beta_tester not found")

        existing = await self.repo.get_user_achievement(user_id, achievement.id)
        if existing:
            return existing

        return await self.repo.create_user_achievement(
            UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                progress_value=1,
                is_completed=True,
                unlocked_at=datetime.now(timezone.utc),
            )
        )

    async def evaluate_user_achievements(self, user_id: int):
        achievements = await self.repo.get_all_active()

        submissions_result = await self.session.execute(
            select(TaskSubmission).where(TaskSubmission.user_id == user_id)
        )
        submissions = list(submissions_result.scalars().all())

        verified_submissions = [s for s in submissions if s.status == "verified"]
        verified_count = len(verified_submissions)

        streak_result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = streak_result.scalar_one_or_none()
        current_streak = streak.current_streak if streak else 0

        goals_result = await self.session.execute(
            select(Goal).where(
                Goal.user_id == user_id,
                Goal.status == "completed",
            )
        )
        completed_goals = list(goals_result.scalars().all())

        issued = []

        for achievement in achievements:
            progress_value = 0
            is_completed = False

            if achievement.key == "first_verified_task":
                progress_value = verified_count
                is_completed = verified_count >= 1

            elif achievement.key == "ten_verified_tasks":
                progress_value = verified_count
                is_completed = verified_count >= 10

            elif achievement.key == "streak_7":
                progress_value = current_streak
                is_completed = current_streak >= 7

            elif achievement.key == "streak_20":
                progress_value = current_streak
                is_completed = current_streak >= 20

            elif achievement.key == "streak_50":
                progress_value = current_streak
                is_completed = current_streak >= 50

            elif achievement.key == "first_goal_completed":
                progress_value = len(completed_goals)
                is_completed = len(completed_goals) >= 1

            else:
                continue

            existing = await self.repo.get_user_achievement(user_id, achievement.id)
            if existing:
                existing.progress_value = progress_value
                if is_completed and not existing.is_completed:
                    existing.is_completed = True
                    existing.unlocked_at = datetime.now(timezone.utc)
                await self.repo.update_user_achievement(existing)
                issued.append(existing)
            else:
                obj = await self.repo.create_user_achievement(
                    UserAchievement(
                        user_id=user_id,
                        achievement_id=achievement.id,
                        progress_value=progress_value,
                        is_completed=is_completed,
                        unlocked_at=datetime.now(timezone.utc) if is_completed else None,
                    )
                )
                issued.append(obj)

        return issued
