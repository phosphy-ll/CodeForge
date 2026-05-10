from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.services.email_service import EmailService
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.ai.generation_service import AIGenerationService
from app.domain.subscription import get_user_limits
from sqlalchemy.orm import selectinload

from sqlalchemy import select

from app.models.task_submission import TaskSubmission
from app.models.daily_plan import DailyPlan, DailyPlanTask


class NotificationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = NotificationRepository(session)
        self.email_service = EmailService()
        self.generator = AIGenerationService()


    async def create_plan_generated(self, user: User) -> Notification:
        return await self.create_in_app(
            user_id=user.id,
            type="plan_generated",
            title="Daily execution plan ready",
            message="Your plan is generated. Start now or fall behind.",
            action_url="/today",
            dedupe_hours=20,
        )

    async def create_submission_reviewed(self, user: User, task_id: int, status: str) -> Notification:
        return await self.create_in_app(
            user_id=user.id,
            type="submission_reviewed",
            title="Submission reviewed",
            message=f"Your submission was reviewed: {status}. Check feedback and continue.",
            action_url=f"/tasks/{task_id}",
        )

    async def create_streak_warning(self, user: User) -> Notification | None:
        if not user.streak_warning_enabled:
            return None

        notification = await self.create_in_app(
            user_id=user.id,
            type="streak_warning",
            title="Streak at risk",
            message="You have not secured today’s verified points yet.",
            action_url="/today",
            dedupe_hours=6,
        )

        self.email_service.send_email(
            user.email,
            "CodeForge: streak at risk",
            "<p>Your streak is at risk. Open Today and submit proof.</p>",
        )

        return notification

    async def create_daily_reminder(self, user: User) -> Notification | None:
        if not user.daily_reminder_enabled:
            return None

        return await self.create_in_app(
            user_id=user.id,
            type="daily_reminder",
            title="Today’s execution is waiting",
            message="Open your daily plan. Progress is not counted without proof.",
            action_url="/today",
            dedupe_hours=6,
        )

    async def create_inactivity_alert(self, user: User) -> Notification | None:
        if not user.inactivity_alert_enabled:
            return None

        return await self.create_in_app(
            user_id=user.id,
            type="inactivity_alert",
            title="You are going inactive",
            message="CodeForge detected no execution movement. Resume before you lose momentum.",
            action_url="/today",
            dedupe_hours=8,
        )

    async def create_pressure_signal(self, user: User) -> Notification | None:
        local_now = self._get_user_local_now(user)
        local_hour = local_now.hour

        pressure_type: str | None = None

        if user.daily_reminder_enabled and local_hour == user.daily_reminder_hour:
            pressure_type = "daily_reminder"

        if user.streak_warning_enabled and local_hour == user.streak_warning_hour:
            earned_today = await self._get_earned_points_today(user)

            if earned_today < 100:
                pressure_type = "streak_warning"

        if user.inactivity_alert_enabled:
            earned_today = await self._get_earned_points_today(user)

            if earned_today == 0 and local_hour >= 18:
                pressure_type = "inactivity_alert"

        if not pressure_type:
            return None

        limits = get_user_limits(user)
        earned_today = await self._get_earned_points_today(user)

        if limits.get("ai_coach_enabled"):
            return await self._create_ai_pressure_notification(
                user=user,
                pressure_type=pressure_type,
                earned_points_today=earned_today,
                required_points=100,
            )

        if pressure_type == "daily_reminder":
            return await self.create_daily_reminder(user)

        if pressure_type == "streak_warning":
            return await self.create_streak_warning(user)

        if pressure_type == "inactivity_alert":
            return await self.create_inactivity_alert(user)

        return None

        return None

    def _get_user_local_now(self, user: User) -> datetime:
        try:
            tz = ZoneInfo(user.timezone or "UTC")
        except Exception:
            tz = ZoneInfo("UTC")

        return datetime.now(timezone.utc).astimezone(tz)

    async def _get_earned_points_today(self, user: User) -> int:
        local_now = self._get_user_local_now(user)
        local_today = local_now.date()

        result = await self.session.execute(
            select(TaskSubmission).where(TaskSubmission.user_id == user.id)
        )

        submissions = list(result.scalars().all())

        total = 0

        for submission in submissions:
            created_at = submission.created_at

            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            local_created = created_at.astimezone(
                ZoneInfo(user.timezone or "UTC")
            )

            if local_created.date() == local_today:
                total += submission.earned_points

        return total


    async def create_in_app(
        self,
        *,
        user_id: int,
        type: str,
        title: str,
        message: str,
        action_url: str | None = None,
        dedupe_hours: int | None = None,
    ) -> Notification | None:
        if dedupe_hours:
            from datetime import datetime, timedelta, timezone

            since = datetime.now(timezone.utc) - timedelta(hours=dedupe_hours)

            exists = await self.repo.exists_recent(
                user_id=user_id,
                type=type,
                since=since,
            )

            if exists:
                return None

        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            action_url=action_url,
        )

        return await self.repo.create(notification)

    async def _create_ai_pressure_notification(
        self,
        *,
        user: User,
        pressure_type: str,
        earned_points_today: int,
        required_points: int,
    ) -> Notification | None:
        unfinished_tasks = await self._get_unfinished_tasks_for_pressure(user)
        recent_submissions = await self._get_recent_submissions_for_pressure(user)

        result = await self.generator.generate_pressure_message(
            user,
            pressure_type=pressure_type,
            earned_points_today=earned_points_today,
            required_points=required_points,
            unfinished_tasks=unfinished_tasks,
            recent_submissions=recent_submissions,
            pressure_level=getattr(user, "pressure_level", "normal"),
            ai_strictness=getattr(user, "ai_strictness", "balanced"),
        )

        return await self.create_in_app(
            user_id=user.id,
            type=result.type,
            title=result.title,
            message=result.message,
            action_url="/today",
            dedupe_hours=6 if result.type != "inactivity_alert" else 8,
        )

    async def _get_unfinished_tasks_for_pressure(self, user: User) -> list[dict]:
        result = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(
                DailyPlan.user_id == user.id,
                DailyPlan.plan_date == self._get_user_local_now(user).date(),
            )
            .order_by(DailyPlan.created_at.desc(), DailyPlan.id.desc())
            .limit(1)
        )

        plan = result.scalar_one_or_none()

        if not plan:
            return []

        items = []

        for item in plan.tasks:
            task = item.task

            if not task:
                continue

            if task.status == "verified":
                continue

            items.append(
                {
                    "task_id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "task_type": task.task_type,
                    "skill_tag": task.skill_tag,
                    "reward_points": task.reward_points,
                }
            )

        return items

    async def _get_recent_submissions_for_pressure(self, user: User) -> list[dict]:
        result = await self.session.execute(
            select(TaskSubmission)
            .where(TaskSubmission.user_id == user.id)
            .order_by(TaskSubmission.created_at.desc(), TaskSubmission.id.desc())
            .limit(5)
        )

        submissions = list(result.scalars().all())

        return [
            {
                "task_id": submission.task_id,
                "status": submission.status,
                "score": submission.score,
                "earned_points": submission.earned_points,
                "suspicion_score": submission.suspicion_score,
            }
            for submission in submissions
        ]