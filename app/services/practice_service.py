from app.ai.review_service import AIReviewService
from app.models.practice_attempt import PracticeAttempt
from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.repositories.milestone_repository import MilestoneRepository
from app.repositories.practice_repository import PracticeRepository
from app.repositories.task_repository import TaskRepository
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService


class PracticeService:
    def __init__(self, session) -> None:
        self.session = session
        self.task_repo = TaskRepository(session)
        self.milestone_repo = MilestoneRepository(session)
        self.goal_repo = GoalRepository(session)
        self.practice_repo = PracticeRepository(session)
        self.ai_service = AIReviewService()
        self.security_service = SecurityService(session)
        self.audit_service = AuditService(session)

    async def practice_task(
        self,
        user: User,
        *,
        task_id: int,
        content_text: str | None,
        content_code: str | None,
    ) -> dict:
        await self.security_service.check_practice_spam_limit(user.id)
        self.security_service.check_ai_rate_limit(user)

        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        goal = await self.goal_repo.get_by_id(milestone.goal_id)

        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        ai_result = await self.ai_service.review_submission(
            user=user,
            task_description=task.description or task.title,
            submission_text=content_text,
            submission_code=content_code,
        )

        score = int(ai_result.get("score", 50))
        feedback = ai_result.get("feedback")
        suspicion_score = int(ai_result.get("suspicion", 0))
        followup_question = ai_result.get("followup_question")

        attempt = PracticeAttempt(
            user_id=user.id,
            task_id=task.id,
            task_title_snapshot=task.title,
            content_text=content_text,
            content_code=content_code,
            score=score,
            feedback=feedback,
            suspicion_score=suspicion_score,
            followup_question=followup_question,
            potential_reward_points=task.reward_points,
        )
        await self.practice_repo.create(attempt)

        await self.audit_service.log(
            action="practice.attempt",
            status="success",
            user_id=user.id,
            target_type="task",
            target_id=task.id,
            details=f"score={score}",
        )

        return {
            "mode": "practice",
            "score": score,
            "feedback": feedback,
            "suspicion_score": suspicion_score,
            "followup_question": followup_question,
            "earned_points": 0,
            "potential_reward_points": task.reward_points,
            "affects_streak": False,
            "task_title": task.title,
        }
    
    async def practice_drill(
        self,
        user: User,
        *,
        skill_name: str,
        action_type: str,
        content_text: str | None,
        content_code: str | None,
    ) -> dict:
        await self.security_service.check_practice_spam_limit(user.id)
        self.security_service.check_ai_rate_limit(user)

        task_description = (
            f"Practice drill for skill: {skill_name}. "
            f"Action type: {action_type}. "
            "User must submit proof, working code if relevant, and explain the reasoning."
        )

        ai_result = await self.ai_service.review_submission(
            user=user,
            task_title=f"{skill_name} practice drill",
            task_description=task_description,
            task_type="practice",
            verification_type="mixed",
            required_score=70,
            submission_text=content_text,
            submission_code=content_code,
        )

        score = int(ai_result.get("score", 50))
        feedback = ai_result.get("feedback")
        suspicion_score = int(ai_result.get("suspicion", 0))
        followup_question = ai_result.get("followup_question")

        await self.audit_service.log(
            action="practice.drill_attempt",
            status="success",
            user_id=user.id,
            target_type="skill",
            target_id=None,
            details=f"skill={skill_name}, action_type={action_type}, score={score}",
        )

        return {
            "mode": "practice_drill",
            "score": score,
            "feedback": feedback,
            "suspicion_score": suspicion_score,
            "followup_question": followup_question,
            "earned_points": 0,
            "potential_reward_points": 0,
            "affects_streak": False,
            "task_title": f"{skill_name} drill",
        }

    async def get_my_attempts(self, user: User):
        return await self.practice_repo.get_user_attempts(user.id)

    async def get_my_task_attempts(self, user: User, task_id: int):
        return await self.practice_repo.get_user_task_attempts(user.id, task_id)
