from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.services.notification_service import NotificationService
from app.domain.subscription import get_user_limits
from app.models.daily_plan import DailyPlan, DailyPlanTask
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.task_submission import TaskSubmission
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.user_skill_repository import UserSkillRepository
from app.services.ai_service import AIService
from datetime import date, datetime, timezone
from sqlalchemy import select
from zoneinfo import ZoneInfo
from app.domain.enums import SubmissionStatus

from app.models.task_submission import TaskSubmission
from app.domain.enums import SubmissionStatus

class DailyService:
    def __init__(self, session):
        self.session = session
        self.ai_service = AIService(session)
        self.submission_repo = SubmissionRepository(session)
        self.notification_service = NotificationService(session)

    async def get_today_plans(self, user):
        goal = await self._get_primary_active_goal(user)

        if not goal:
            return None

        existing_plan = await self._get_today_plan(user.id, goal.id)

        if existing_plan:
            return await self._serialize_plan(existing_plan, user)

        plan = await self._generate_ai_daily_plan_for_goal(
            user=user,
            goal=goal,
            regenerate=False,
        )

        return await self._serialize_plan(plan, user)

    async def generate_today_plans_for_all_goals(self, user):
        goal = await self._get_primary_active_goal(user)

        if not goal:
            return None

        plan = await self._generate_ai_daily_plan_for_goal(
            user=user,
            goal=goal,
            regenerate=False,
        )

        return self._serialize_plan(plan)

    async def _get_primary_active_goal(self, user):
        result = await self.session.execute(
            select(Goal)
            .where(
                Goal.user_id == user.id,
                Goal.status == "active",
            )
            .order_by(Goal.created_at.asc(), Goal.id.asc())
            .limit(1)
        )

        return result.scalar_one_or_none()

    async def _get_today_plan(self, user_id: int, goal_id: int):
        result = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(
                DailyPlan.user_id == user_id,
                DailyPlan.goal_id == goal_id,
                DailyPlan.plan_date == date.today(),
            )
            .order_by(DailyPlan.created_at.desc(), DailyPlan.id.desc())
            .limit(1)
        )

        return result.scalar_one_or_none()

    async def _generate_ai_daily_plan_for_goal(
        self,
        *,
        user,
        goal,
        regenerate: bool,
    ):
        self.ai_service.security_service.check_ai_rate_limit(user)

        milestone = await self._get_first_available_milestone(goal.id)

        if not milestone:
            milestone = Milestone(
                goal_id=goal.id,
                title="Foundation",
                order=1,
                status="available",
            )

            self.session.add(milestone)
            await self.session.commit()
            await self.session.refresh(milestone)

        limits = get_user_limits(user)

        existing_tasks = await self._get_existing_task_context(goal.id)
        unfinished_tasks = await self._get_unfinished_task_context(user.id, goal.id)
        weak_skills = await self._get_weak_skills(user)
        recent_submissions = await self._get_recent_submission_context(user.id)

        ai_plan = await self.ai_service.generator.generate_daily_plan(
            user,
            goal_title=goal.title,
            goal_description=goal.description,
            language=goal.language,
            level=goal.effective_level or goal.detected_level or goal.declared_level,
            learning_style=goal.learning_style,
            accountability_mode=goal.accountability_mode,
            milestone_title=milestone.title,
            existing_tasks=existing_tasks,
            unfinished_tasks=unfinished_tasks,
            weak_skills=weak_skills,
            recent_submissions=recent_submissions,
            daily_tasks_min=limits["daily_tasks_min"],
            daily_tasks_max=limits["daily_tasks_max"],
            max_daily_points=limits["max_daily_points"],
            pressure_level=getattr(user, "pressure_level", "normal"),
            ai_strictness=getattr(user, "ai_strictness", "balanced"),
            regenerate=regenerate,
        )

        plan = DailyPlan(
            user_id=user.id,
            goal_id=goal.id,
            plan_date=date.today(),
            source="ai_generated",
            replace_used_count=0,
            regenerate_used=regenerate,
            is_locked=False,
        )

        self.session.add(plan)
        await self.session.flush()

        used_task_ids: set[int] = set()

        for order, item in enumerate(ai_plan.items, start=1):
            task = await self._resolve_ai_plan_item_to_task(
                item=item,
                milestone=milestone,
                goal_id=goal.id,
                used_task_ids=used_task_ids,
            )

            used_task_ids.add(task.id)

            self.session.add(
                DailyPlanTask(
                    daily_plan_id=plan.id,
                    task_id=task.id,
                    order=order,
                    is_required=item.is_required,
                )
            )

        await self.session.commit()

        refreshed = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(DailyPlan.id == plan.id)
        )

        await self.notification_service.create_plan_generated(user)

        return refreshed.scalar_one()

    async def _resolve_ai_plan_item_to_task(
        self,
        *,
        item,
        milestone,
        goal_id: int,
        used_task_ids: set[int],
    ):
        if item.source == "existing" and item.existing_task_id:
            existing = await self._get_existing_task_for_goal(
                task_id=item.existing_task_id,
                goal_id=goal_id,
            )

            if existing and existing.id not in used_task_ids:
                return existing

        task = Task(
            milestone_id=milestone.id,
            title=item.title.strip(),
            description=item.description,
            task_type=self._enum_value(item.task_type),
            verification_type=self._enum_value(item.verification_type),
            skill_tag=(item.skill_tag or "general").strip().lower().replace(" ", "_"),
            max_attempts=5,
            required_score=item.required_score,
            reward_points=item.reward_points,
            status="available",
            is_required=item.is_required,
            unlock_condition_text=None,
            difficulty=item.difficulty,
            estimated_minutes=item.estimated_minutes,
        )

        self.session.add(task)
        await self.session.flush()

        return task

    async def _get_existing_task_for_goal(self, task_id: int, goal_id: int):
        result = await self.session.execute(
            select(Task)
            .join(Task.milestone)
            .where(
                Task.id == task_id,
                Task.milestone.has(goal_id=goal_id),
                Task.status.in_(
                    [
                        "available",
                        "in_progress",
                        "needs_revision",
                        "failed",
                    ]
                ),
            )
        )

        return result.scalar_one_or_none()

    async def _get_existing_task_context(self, goal_id: int, limit: int = 20):
        result = await self.session.execute(
            select(Task)
            .join(Task.milestone)
            .where(
                Task.milestone.has(goal_id=goal_id),
                Task.status.in_(
                    [
                        "available",
                        "in_progress",
                        "needs_revision",
                        "failed",
                    ]
                ),
            )
            .order_by(Task.created_at.asc(), Task.id.asc())
            .limit(limit)
        )

        tasks = list(result.scalars().all())

        return [self._task_to_context(task) for task in tasks]

    async def _get_unfinished_task_context(
        self,
        user_id: int,
        goal_id: int,
        limit: int = 10,
    ):
        result = await self.session.execute(
            select(TaskSubmission)
            .options(selectinload(TaskSubmission.task).selectinload(Task.milestone))
            .where(TaskSubmission.user_id == user_id)
            .order_by(TaskSubmission.created_at.desc(), TaskSubmission.id.desc())
            .limit(50)
        )

        submissions = list(result.scalars().all())

        unfinished = []

        for submission in submissions:
            task = submission.task

            if not task or not task.milestone:
                continue

            if task.milestone.goal_id != goal_id:
                continue

            if submission.status in ["verified"]:
                continue

            unfinished.append(
                {
                    **self._task_to_context(task),
                    "last_submission_status": submission.status,
                    "last_score": submission.score,
                    "why_not_verified": submission.why_not_verified,
                    "suspicion_score": submission.suspicion_score,
                }
            )

            if len(unfinished) >= limit:
                break

        return unfinished

    async def _get_recent_submission_context(self, user_id: int, limit: int = 10):
        submissions = await self.submission_repo.get_recent_by_user(
            user_id=user_id,
            limit=limit,
        )

        return [
            {
                "task_id": submission.task_id,
                "task_title": submission.task.title if submission.task else None,
                "task_type": submission.task.task_type if submission.task else None,
                "skill_tag": submission.task.skill_tag if submission.task else None,
                "status": submission.status,
                "score": submission.score,
                "earned_points": submission.earned_points,
                "feedback": submission.feedback,
                "why_not_verified": submission.why_not_verified,
                "suspicion_score": submission.suspicion_score,
            }
            for submission in submissions
        ]

    async def _get_weak_skills(self, user) -> list[str]:
        limits = get_user_limits(user)

        if not limits["adaptive_tasks_enabled"]:
            return []

        skill_repo = UserSkillRepository(self.session)
        skills = await skill_repo.get_by_user(user.id)

        weak_skills = [
            skill
            for skill in skills
            if skill.weakness_score >= 0.45
        ]

        weak_skills = sorted(
            weak_skills,
            key=lambda skill: skill.weakness_score,
            reverse=True,
        )

        return [skill.skill_name for skill in weak_skills[:5]]

    async def _get_first_available_milestone(self, goal_id: int):
        result = await self.session.execute(
            select(Milestone)
            .where(Milestone.goal_id == goal_id)
            .order_by(Milestone.order.asc(), Milestone.created_at.asc())
        )

        milestone = result.scalars().first()

        if milestone and milestone.status == "locked":
            milestone.status = "available"
            await self.session.commit()
            await self.session.refresh(milestone)

        return milestone

    async def replace_task(
        self,
        user,
        plan_id: int,
        old_task_id: int,
        new_task_id: int,
    ):
        plan_result = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(DailyPlan.id == plan_id)
        )

        plan = plan_result.scalar_one_or_none()

        if not plan or plan.user_id != user.id:
            raise ValueError("Plan not found")

        if plan.replace_used_count >= 1:
            raise ValueError("You already replaced a task for this goal today")

        if plan.is_locked:
            raise ValueError("Plan is locked")

        new_task_result = await self.session.execute(
            select(Task)
            .join(Task.milestone)
            .where(
                Task.id == new_task_id,
                Task.status == "available",
                Task.milestone.has(goal_id=plan.goal_id),
            )
        )

        new_task = new_task_result.scalar_one_or_none()

        if not new_task:
            raise ValueError("Replacement task not found")

        current_task_ids = {item.task_id for item in plan.tasks}

        if new_task_id in current_task_ids:
            raise ValueError("Task already in plan")

        replaced = False

        for item in plan.tasks:
            if item.task_id == old_task_id:
                item.task_id = new_task_id
                item.is_required = new_task.is_required
                replaced = True
                break

        if not replaced:
            raise ValueError("Task not found in plan")

        plan.replace_used_count += 1

        await self.session.commit()

        refreshed = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(DailyPlan.id == plan.id)
        )

        return await self._serialize_plan(refreshed.scalar_one(), user)

    async def regenerate_plan(self, user, plan_id: int):
        plan_result = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(DailyPlan.id == plan_id)
        )

        plan = plan_result.scalar_one_or_none()

        if not plan or plan.user_id != user.id:
            raise ValueError("Plan not found")

        if plan.regenerate_used:
            raise ValueError("Plan already regenerated for today")

        if plan.is_locked:
            raise ValueError("Plan is locked")

        goal_result = await self.session.execute(
            select(Goal).where(
                Goal.id == plan.goal_id,
                Goal.user_id == user.id,
                Goal.status == "active",
            )
        )

        goal = goal_result.scalar_one_or_none()

        if not goal:
            raise ValueError("Goal not found")

        for item in list(plan.tasks):
            await self.session.delete(item)

        plan.regenerate_used = True

        await self.session.commit()

        milestone = await self._get_first_available_milestone(goal.id)

        if not milestone:
            milestone = Milestone(
                goal_id=goal.id,
                title="Foundation",
                order=1,
                status="available",
            )

            self.session.add(milestone)
            await self.session.commit()
            await self.session.refresh(milestone)

        refreshed_plan = await self._rebuild_existing_plan_with_ai(
            user=user,
            goal=goal,
            plan=plan,
            regenerate=True,
        )

        return await self._serialize_plan(refreshed_plan, user)

    async def _rebuild_existing_plan_with_ai(
        self,
        *,
        user,
        goal,
        plan,
        regenerate: bool,
    ):
        self.ai_service.security_service.check_ai_rate_limit(user)

        milestone = await self._get_first_available_milestone(goal.id)

        if not milestone:
            milestone = Milestone(
                goal_id=goal.id,
                title="Foundation",
                order=1,
                status="available",
            )

            self.session.add(milestone)
            await self.session.commit()
            await self.session.refresh(milestone)

        limits = get_user_limits(user)

        existing_tasks = await self._get_existing_task_context(goal.id)
        unfinished_tasks = await self._get_unfinished_task_context(user.id, goal.id)
        weak_skills = await self._get_weak_skills(user)
        recent_submissions = await self._get_recent_submission_context(user.id)

        ai_plan = await self.ai_service.generator.generate_daily_plan(
            user,
            goal_title=goal.title,
            goal_description=goal.description,
            language=goal.language,
            level=goal.effective_level or goal.detected_level or goal.declared_level,
            learning_style=goal.learning_style,
            accountability_mode=goal.accountability_mode,
            milestone_title=milestone.title,
            existing_tasks=existing_tasks,
            unfinished_tasks=unfinished_tasks,
            weak_skills=weak_skills,
            recent_submissions=recent_submissions,
            daily_tasks_min=limits["daily_tasks_min"],
            daily_tasks_max=limits["daily_tasks_max"],
            max_daily_points=limits["max_daily_points"],
            pressure_level=getattr(user, "pressure_level", "normal"),
            ai_strictness=getattr(user, "ai_strictness", "balanced"),
            regenerate=regenerate,
        )

        used_task_ids: set[int] = set()

        for order, item in enumerate(ai_plan.items, start=1):
            task = await self._resolve_ai_plan_item_to_task(
                item=item,
                milestone=milestone,
                goal_id=goal.id,
                used_task_ids=used_task_ids,
            )

            used_task_ids.add(task.id)

            self.session.add(
                DailyPlanTask(
                    daily_plan_id=plan.id,
                    task_id=task.id,
                    order=order,
                    is_required=item.is_required,
                )
            )

        await self.session.commit()

        refreshed = await self.session.execute(
            select(DailyPlan)
            .options(
                selectinload(DailyPlan.tasks).selectinload(DailyPlanTask.task)
            )
            .where(DailyPlan.id == plan.id)
        )

        return refreshed.scalar_one()

    def _task_to_context(self, task: Task) -> dict:
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "task_type": task.task_type,
            "verification_type": task.verification_type,
            "skill_tag": task.skill_tag,
            "difficulty": task.difficulty,
            "estimated_minutes": task.estimated_minutes,
            "reward_points": task.reward_points,
            "required_score": task.required_score,
            "is_required": task.is_required,
        }

    def _enum_value(self, value):
        return value.value if hasattr(value, "value") else value

    async def _get_earned_points_today(self, user_id: int, user_timezone: str | None = None) -> int:
        timezone_name = user_timezone or "Asia/Almaty"

        try:
            tz = ZoneInfo(timezone_name)
        except Exception:
            tz = ZoneInfo("Asia/Almaty")

        today = datetime.now(timezone.utc).astimezone(tz).date()

        result = await self.session.execute(
            select(TaskSubmission).where(
                TaskSubmission.user_id == user_id,
                TaskSubmission.status == SubmissionStatus.VERIFIED.value,
            )
        )

        submissions = list(result.scalars().all())

        earned_points = 0

        for submission in submissions:
            if not submission.earned_points:
                continue

            points_datetime = submission.reviewed_at or submission.created_at

            if points_datetime.tzinfo is None:
                points_datetime = points_datetime.replace(tzinfo=timezone.utc)

            points_date = points_datetime.astimezone(tz).date()

            if points_date == today:
                earned_points += submission.earned_points

        return earned_points

    async def _serialize_plan(self, plan: DailyPlan, user=None) -> dict:
        slot_by_order = {
            1: "learn",
            2: "practice",
            3: "build",
        }
        today = date.today()

        verified_points = await self._get_earned_points_today(
            user_id=plan.user_id,
            user_timezone=getattr(user, "timezone", "Asia/Almaty") if user else "Asia/Almaty",
        )

        return {
            "id": plan.id,
            "user_id": plan.user_id,
            "goal_id": plan.goal_id,
            "earned_points_today": verified_points,
            "required_points_today": 100,
            "plan_date": plan.plan_date,
            "source": plan.source,
            "replace_used_count": plan.replace_used_count,
            "regenerate_used": plan.regenerate_used,
            "is_locked": plan.is_locked,
            "created_at": plan.created_at,
            "tasks": [
                {
                    "id": item.id,
                    "daily_plan_id": item.daily_plan_id,
                    "task_id": item.task_id,
                    "order": item.order,
                    "slot": slot_by_order.get(item.order, "task"),
                    "is_required": item.is_required,
                    "title": item.task.title if item.task else None,
                    "description": item.task.description if item.task else None,
                    "status": item.task.status if item.task else None,
                    "task_type": item.task.task_type if item.task else None,
                    "verification_type": item.task.verification_type if item.task else None,
                    "skill_tag": item.task.skill_tag if item.task else None,
                    "difficulty": item.task.difficulty if item.task else None,
                    "estimated_minutes": item.task.estimated_minutes if item.task else None,
                    "reward_points": item.task.reward_points if item.task else None,
                    "required_score": item.task.required_score if item.task else None,
                }
                for item in sorted(plan.tasks, key=lambda x: x.order)
            ],
            "can_replace_task_today": plan.replace_used_count < 1 and not plan.is_locked,
            "can_regenerate_today": not plan.regenerate_used and not plan.is_locked,
        }