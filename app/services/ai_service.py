from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.generation_service import AIGenerationService
from app.models.task import Task
from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.repositories.milestone_repository import MilestoneRepository
from app.repositories.task_repository import TaskRepository
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService
from app.schemas.ai import (
    AILearnTopicResponse,
    AICoachResponse,
    AICoachChatResponse,
)
from app.repositories.user_skill_repository import UserSkillRepository
from app.repositories.submission_repository import SubmissionRepository
from app.domain.subscription import get_user_limits

class AIService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.goal_repo = GoalRepository(session)
        self.milestone_repo = MilestoneRepository(session)
        self.task_repo = TaskRepository(session)
        self.generator = AIGenerationService()
        self.security_service = SecurityService(session)
        self.audit_service = AuditService(session)
        self.submission_repo = SubmissionRepository(session)

    async def generate_tasks_for_milestone(
        self,
        user: User,
        *,
        goal_id: int,
        milestone_id: int,
        count: int,
        focus_topic: str | None,
    ):
        self.security_service.check_ai_rate_limit(user)

        goal = await self.goal_repo.get_by_id(goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Goal not found")

        milestone = await self.milestone_repo.get_by_id(milestone_id)
        if not milestone or milestone.goal_id != goal.id:
            raise ValueError("Milestone not found")

        weak_skills = await self._get_weak_skills_for_adaptive_generation(user)

        generated = await self.generator.generate_tasks(
            user,
            goal_title=goal.title,
            milestone_title=milestone.title,
            count=count,
            focus_topic=focus_topic,
            weak_skills=weak_skills,
        )

        created_tasks = []
        unique_titles = set()

        for item in generated.tasks:
            title = item.title.strip()

            # ❌ защита от дублей
            if title.lower() in unique_titles:
                continue
            unique_titles.add(title.lower())

            # ❌ защита от мусорных названий
            if len(title) < 10 or "practice" in title.lower():
                continue

            # нормализация skill_tag
            skill_tag = (item.skill_tag or "general").strip().lower().replace(" ", "_")

            task = Task(
                milestone_id=milestone.id,
                title=title,
                description=item.description,
                task_type=item.task_type.value,
                verification_type=item.verification_type.value,
                skill_tag=skill_tag,
                max_attempts=5,
                required_score=item.required_score,
                reward_points=item.reward_points,
                status="available",
                is_required=item.is_required,
                unlock_condition_text=item.unlock_condition_text,
                difficulty=item.difficulty,
                estimated_minutes=item.estimated_minutes,
            )

            created = await self.task_repo.create(task)
            created_tasks.append(created)

        await self.audit_service.log(
            action="ai.generate_tasks",
            status="success",
            user_id=user.id,
            target_type="milestone",
            target_id=milestone.id,
            details=f"count={count}, focus_topic={focus_topic}",
        )

        return created_tasks

    async def _get_weak_skills_for_adaptive_generation(self, user: User) -> list[str] | None:
        if user.subscription_tier not in ["plus", "ultra"]:
            return None

        skill_repo = UserSkillRepository(self.session)
        skills = await skill_repo.get_by_user(user.id)

        weak_skills = [
            skill
            for skill in skills
            if skill.weakness_score >= 0.6
        ]

        weak_skills = sorted(
            weak_skills,
            key=lambda skill: skill.weakness_score,
            reverse=True,
        )

        return [skill.skill_name for skill in weak_skills[:3]] or None

    async def coach_user(self, user: User) -> AICoachResponse:
        self.security_service.check_ai_rate_limit(user)

        limits = get_user_limits(user)

        if not limits["ai_coach_enabled"]:
            raise ValueError("AI Coach is available only for Plus and Ultra users")

        weak_skills = await self._get_weak_skills_for_adaptive_generation(user)
        recent_submissions = await self.submission_repo.get_recent_by_user(user.id, limit=10)

        recent_data = [
        {
            "task_title": submission.task.title if submission.task else None,
            "task_type": submission.task.task_type if submission.task else None,
            "skill_tag": submission.task.skill_tag if submission.task else None,
            "required_score": submission.task.required_score if submission.task else None,
            "score": submission.score,
            "status": submission.status,
            "earned_points": submission.earned_points,
            "feedback": submission.feedback,
            "why_not_verified": submission.why_not_verified,
            "suspicion_score": submission.suspicion_score,
        }
        for submission in recent_submissions
    ]

        result = await self.generator.generate_coach_feedback(
            user,
            weak_skills=weak_skills or [],
            recent_submissions=recent_data,
        )

        await self.audit_service.log(
            action="ai.coach",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            details="AI coach feedback generated",
        )

        result = self._normalize_coach_result(result, weak_skills or [])

        return AICoachResponse(**result)

    async def coach_chat(
        self,
        user: User,
        *,
        message: str,
        goal_id: int | None = None,
    ) -> AICoachChatResponse:
        self.security_service.check_ai_rate_limit(user)

        limits = get_user_limits(user)

        if not limits["ai_coach_enabled"]:
            raise ValueError("AI Coach is available only for Plus and Ultra users")

        weak_skills = await self._get_weak_skills_for_adaptive_generation(user)
        recent_submissions = await self.submission_repo.get_recent_by_user(user.id, limit=10)

        recent_data = [
            {
                "task_title": submission.task.title if submission.task else None,
                "task_type": submission.task.task_type if submission.task else None,
                "skill_tag": submission.task.skill_tag if submission.task else None,
                "required_score": submission.task.required_score if submission.task else None,
                "score": submission.score,
                "status": submission.status,
                "earned_points": submission.earned_points,
                "feedback": submission.feedback,
                "why_not_verified": submission.why_not_verified,
                "suspicion_score": submission.suspicion_score,
            }
            for submission in recent_submissions
        ]

        result = await self.generator.generate_coach_chat_answer(
            user,
            message=message,
            weak_skills=weak_skills or [],
            recent_submissions=recent_data,
        )

        await self.audit_service.log(
            action="ai.coach_chat",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            details=f"message={message[:120]}",
        )

        return AICoachChatResponse(**result)

    def _normalize_coach_result(self, result: dict, weak_skills: list[str]) -> dict:
        next_actions = result.get("next_actions") or []

        normalized_actions = []

        action_types = ["learn", "practice", "submit"]

        for idx, action in enumerate(next_actions[:3]):
            action_type = action_types[idx] if idx < len(action_types) else "practice"

            if isinstance(action, dict):
                normalized_actions.append(
                    {
                        "type": action.get("type") or action_type,
                        "title": action.get("title") or "Continue current task",
                        "reason": action.get("reason") or "This helps CodeForge verify real progress.",
                    }
                )
            else:
                normalized_actions.append(
                    {
                        "type": action_type,
                        "title": str(action),
                        "reason": "This is recommended based on your recent submissions.",
                    }
                )

        while len(normalized_actions) < 3:
            fallback_type = action_types[len(normalized_actions)]
            normalized_actions.append(
                {
                    "type": fallback_type,
                    "title": f"{fallback_type.capitalize()} the current weak topic",
                    "reason": "Not enough structured coach data was returned, so CodeForge generated a safe next step.",
                }
            )

        strengths = result.get("strengths") or ["No stable strengths yet"]
        strengths = [
            "No stable strengths yet" if str(item).lower() in ["none", "none identified"] else item
            for item in strengths
        ]

        return {
            "summary": result.get("summary") or "CodeForge needs more submission data to analyze your progress.",
            "severity": result.get("severity") or "medium",
            "weak_areas": result.get("weak_areas") or weak_skills,
            "strengths": strengths,
            "diagnosis": result.get("diagnosis") or "Your recent submissions are not specific enough to prove stable understanding yet.",
            "next_actions": normalized_actions,
            "recommended_focus": result.get("recommended_focus") or (weak_skills[0] if weak_skills else "current milestone"),
            "warning": result.get("warning"),
            "execution_risk": result.get("execution_risk") or result.get("severity") or "medium",
            "pressure_message": result.get("pressure_message") or (
            "You need to stop submitting vague proof. Submit working code, explain your logic, and show that you actually understand the task."
        ),
        }

    async def learn_topic(
        self,
        user: User,
        *,
        goal_id: int,
        topic: str,
        language: str | None,
        level: str | None,
    ):
        self.security_service.check_ai_rate_limit(user)

        goal = await self.goal_repo.get_by_id(goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Goal not found")

        result = await self.generator.learn_topic(
            user,
            goal_title=goal.title,
            topic=topic,
            language=language or getattr(goal, "language", None),
            level=level or getattr(goal, "declared_level", None),
        )

        await self.audit_service.log(
            action="ai.learn_topic",
            status="success",
            user_id=user.id,
            target_type="goal",
            target_id=goal.id,
            details=f"topic={topic}",
        )

        return AILearnTopicResponse(**result)

    async def generate_quiz_for_task(
        self,
        user: User,
        *,
        task_id: int,
        topic: str,
        question_count: int,
    ):
        self.security_service.check_ai_rate_limit(user)

        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        goal = await self.goal_repo.get_by_id(milestone.goal_id)

        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        result = await self.generator.generate_quiz(
            user,
            topic=topic,
            question_count=question_count,
            reward_points=task.reward_points,
        )

        await self.audit_service.log(
            action="ai.generate_quiz",
            status="success",
            user_id=user.id,
            target_type="task",
            target_id=task.id,
            details=f"topic={topic}, question_count={question_count}",
        )

        return result
    
    async def learn_task(
        self,
        user: User,
        *,
        task_id: int,
    ):
        self.security_service.check_ai_rate_limit(user)

        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        if not milestone:
            raise ValueError("Task not found")

        goal = await self.goal_repo.get_by_id(milestone.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        topic = task.title

        result = await self.generator.learn_topic(
            user,
            goal_title=goal.title,
            topic=topic,
            language=getattr(goal, "language", None),
            level=getattr(goal, "declared_level", None),
        )

        await self.audit_service.log(
            action="ai.learn_task",
            status="success",
            user_id=user.id,
            target_type="task",
            target_id=task.id,
            details=f"topic={topic}",
        )

        return AILearnTopicResponse(**result)

    
    async def get_weakness_map(self, user: User):
        skills = await self._get_all_user_skills(user)

        items = []
        for skill in skills:
            score = float(skill.weakness_score)

            if score >= 0.75:
                level = "high"
            elif score >= 0.45:
                level = "medium"
            else:
                level = "low"

            items.append(
                {
                    "skill_name": skill.skill_name,
                    "weakness_score": score,
                    "level": level,
                }
            )

        return {"items": items}


    async def _get_all_user_skills(self, user: User):
        from app.repositories.user_skill_repository import UserSkillRepository

        skill_repo = UserSkillRepository(self.session)
        skills = await skill_repo.get_by_user(user.id)

        return sorted(
            skills,
            key=lambda skill: skill.weakness_score,
            reverse=True,
        )
