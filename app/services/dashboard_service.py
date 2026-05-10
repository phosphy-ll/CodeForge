from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.user import User
from app.repositories.streak_repository import StreakRepository
from app.repositories.submission_repository import SubmissionRepository
from app.domain.subscription import get_user_limits
from app.services.daily_service import DailyService
from app.services.rank_service import RankService
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.services.streak_service import StreakService


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.sub_repo = SubmissionRepository(session)
        self.streak_repo = StreakRepository(session)
        self.daily_service = DailyService(session)

    async def get_dashboard(self, user_id: int):
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one()

        submissions = await self.sub_repo.get_by_task_and_user(None, user_id)

        user_timezone = getattr(user, "timezone", "Asia/Almaty") or "Asia/Almaty"

        try:
            tz = ZoneInfo(user_timezone)
        except Exception:
            tz = ZoneInfo("Asia/Almaty")

        today = datetime.now(timezone.utc).astimezone(tz).date()

        earned_points = 0

        for s in submissions:
            if not s.earned_points:
                continue

            points_datetime = s.reviewed_at or s.created_at

            if points_datetime.tzinfo is None:
                points_datetime = points_datetime.replace(tzinfo=timezone.utc)

            points_date = points_datetime.astimezone(tz).date()

            if points_date == today:
                earned_points += s.earned_points

        required_points = 100

        rank_service = RankService(self.session)
        await rank_service.update_rank(user)

        limits = get_user_limits(user)
        progress = min(100, int((earned_points / required_points) * 100)) if required_points > 0 else 0

        streak_service = StreakService(self.session)
        await streak_service.apply_points(user_id, earned_points)
        
        streak = await self.streak_repo.get_or_create(user_id)

        goals_result = await self.session.execute(
            select(Goal).where(
                Goal.user_id == user_id,
                Goal.status == "active",
            )
        )
        active_goals = list(goals_result.scalars().all())

        today_plans = await self.daily_service.get_today_plans(user)

        if today_plans is None:
            today_plans_list = []
        elif isinstance(today_plans, list):
            today_plans_list = today_plans
        else:
            today_plans_list = [today_plans]

        goal_summaries = []
        for goal in active_goals:
            related_plan = next((p for p in today_plans_list if p["goal_id"] == goal.id), None)
            goal_summaries.append(
                {
                    "goal_id": goal.id,
                    "title": goal.title,
                    "status": goal.status,
                    "today_plan_task_count": len(related_plan["tasks"]) if related_plan else 0,
                }
            )

        selected_goal = goal_summaries[0] if goal_summaries else None

        return {
            "earned_points_today": earned_points,
            "required_points_today": required_points,
            "progress_percent": progress,
            "bonus_streak_eligible": earned_points >= 300,
            "extra_streak_already_earned_today": earned_points >= 300,

            "current_streak": streak.current_streak,
            "best_streak": streak.best_streak,

            "rank": user.rank,
            "subscription_tier": user.subscription_tier,
            "daily_task_limit": limits["daily_tasks_max"],
            "ai_level": limits["ai_level"],

            "active_goals": goal_summaries,
            "selected_goal": selected_goal,
            "today_plans": today_plans,

            "penalty_active": False,
            "recovery_active": False,
        }
