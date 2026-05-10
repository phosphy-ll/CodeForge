from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.constants import (
    DAILY_STREAK_BONUS_THRESHOLD,
    DAILY_STREAK_REQUIRED_POINTS,
)
from app.domain.subscription import get_user_limits
from app.models.goal import Goal
from app.models.user import User
from app.repositories.streak_repository import StreakRepository
from app.services.daily_service import DailyService
from app.services.rank_service import RankService
from app.services.streak_service import StreakService


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.streak_repo = StreakRepository(session)
        self.daily_service = DailyService(session)

    async def get_dashboard(self, user_id: int):
        result = await self.session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        user_timezone = getattr(user, "timezone", "Asia/Almaty") or "Asia/Almaty"

        try:
            tz = ZoneInfo(user_timezone)
        except Exception:
            tz = ZoneInfo("Asia/Almaty")

        today = datetime.now(timezone.utc).astimezone(tz).date()

        rank_service = RankService(self.session)
        await rank_service.update_rank(user)

        streak_service = StreakService(self.session)

        total_today_points = await streak_service.get_total_streak_points_today(user_id)
        await streak_service.apply_points(user_id, total_today_points)

        streak = await self.streak_repo.get_or_create(user_id)

        earned_points = streak.today_verified_points or total_today_points
        required_points = DAILY_STREAK_REQUIRED_POINTS

        progress = (
            min(100, int((earned_points / required_points) * 100))
            if required_points > 0
            else 0
        )

        limits = get_user_limits(user)

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
            related_plan = next(
                (p for p in today_plans_list if p["goal_id"] == goal.id),
                None,
            )

            goal_summaries.append(
                {
                    "goal_id": goal.id,
                    "title": goal.title,
                    "status": goal.status,
                    "today_plan_task_count": len(related_plan["tasks"])
                    if related_plan
                    else 0,
                }
            )

        selected_goal = goal_summaries[0] if goal_summaries else None

        return {
            "earned_points_today": earned_points,
            "required_points_today": required_points,
            "progress_percent": progress,
            "bonus_streak_eligible": earned_points >= DAILY_STREAK_BONUS_THRESHOLD,
            "extra_streak_already_earned_today": earned_points
            >= DAILY_STREAK_BONUS_THRESHOLD,
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