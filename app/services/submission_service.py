from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.subscription import get_user_limits
from app.repositories.user_skill_repository import UserSkillRepository
from app.ai.review_service import AIReviewService
from app.domain.enums import SubmissionStatus, TaskStatus
from app.models.task_submission import TaskSubmission
from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.repositories.milestone_repository import MilestoneRepository
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionReviewRequest,
    SubmissionPrecheckRequest,
    SubmissionPrecheckResponse,
    SubmissionManualReviewRequest,
)
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService
from app.services.streak_service import StreakService
from app.services.notification_service import NotificationService

class SubmissionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.goal_repo = GoalRepository(session)
        self.milestone_repo = MilestoneRepository(session)
        self.task_repo = TaskRepository(session)
        self.submission_repo = SubmissionRepository(session)
        self.ai_service = AIReviewService()
        self.security_service = SecurityService(session)
        self.audit_service = AuditService(session)
        self.notification_service = NotificationService(session)

    async def create_submission(self, user: User, data: SubmissionCreate) -> TaskSubmission:
        await self.security_service.check_submission_spam_limit(user.id)

        task = await self.task_repo.get_by_id(data.task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        if not milestone:
            raise ValueError("Task not found")

        goal = await self.goal_repo.get_by_id(milestone.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        if task.status in [
            TaskStatus.LOCKED.value,
            TaskStatus.SKIPPED.value,
            TaskStatus.VERIFIED.value,
            TaskStatus.SUBMITTED.value,
        ]:
            raise ValueError("Task cannot be submitted in current status")

        attempts = await self.submission_repo.count_attempts(task.id, user.id)
        if attempts >= task.max_attempts:
            raise ValueError("Max attempts reached")

        submission = TaskSubmission(
            task_id=task.id,
            user_id=user.id,
            attempt_number=attempts + 1,
            content_text=data.content_text,
            content_code=data.content_code,
            content_link=data.content_link,
            status=SubmissionStatus.PENDING_REVIEW.value,
            earned_points=0,
        )

        task.status = TaskStatus.SUBMITTED.value
        await self.task_repo.update(task)

        created = await self.submission_repo.create(submission)

        await self.audit_service.log(
            action="submission.create",
            status="success",
            user_id=user.id,
            target_type="task",
            target_id=task.id,
            details=f"attempt_number={created.attempt_number}",
        )

        # Auto AI exam review immediately after submission
        reviewed = await self.review_submission(
            reviewer=user,
            submission_id=created.id,
            data=None,
        )

        return reviewed

    async def get_task_submissions(self, user: User, task_id: int) -> list[TaskSubmission]:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        if not milestone:
            raise ValueError("Task not found")

        goal = await self.goal_repo.get_by_id(milestone.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        return await self.submission_repo.get_by_task_and_user(task_id, user.id)

    async def request_manual_review(self, user: User, submission_id: int) -> TaskSubmission:
        submission = await self.submission_repo.get_by_id(submission_id)
        if not submission or submission.user_id != user.id:
            raise ValueError("Submission not found")

        if submission.manual_review_requested:
            raise ValueError("Already requested")

        submission.manual_review_requested = True
        updated = await self.submission_repo.update(submission)

        await self.audit_service.log(
            action="submission.request_manual_review",
            status="success",
            user_id=user.id,
            target_type="submission",
            target_id=submission.id,
        )

        return updated

    async def review_submission(
        self,
        reviewer: User,
        submission_id: int,
        data: SubmissionReviewRequest | None = None,
    ) -> TaskSubmission:
        submission = await self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found")

        task = await self.task_repo.get_by_id(submission.task_id)
        if not task:
            raise ValueError("Task not found")

        ai_result = await self.ai_service.review_submission(
            user=reviewer,
            task_title=task.title,
            task_description=task.description or task.title,
            task_type=task.task_type,
            verification_type=task.verification_type,
            required_score=task.required_score,
            submission_text=submission.content_text,
            submission_code=submission.content_code,
            submission_link=submission.content_link,
        )

        score = int(ai_result.get("score", 50))
        feedback = ai_result.get("feedback", "No feedback provided")
        why_not_verified = ai_result.get("why_not_verified")
        improvement_steps = ai_result.get("improvement_steps", [])
        suspicion = int(ai_result.get("suspicion_score", 0))
        followup = ai_result.get("followup_question")

        reviewer_type = "ai"
        if data and data.reviewer_type:
            reviewer_type = data.reviewer_type.value

        status, earned_points = self._calculate_review_result(
            score=score,
            reward_points=task.reward_points,
            required_score=task.required_score,
        )

        if suspicion > 40 or score < task.required_score:
            status = SubmissionStatus.NEEDS_REVISION.value
            earned_points = 0

        await self._update_user_weakness(
            user_id=submission.user_id,
            skill_name=task.skill_tag or task.title,
            score=score,
            required_score=task.required_score,
        )

        submission.score = score
        submission.feedback = feedback
        submission.why_not_verified = why_not_verified
        submission.improvement_steps = "\n".join(improvement_steps) if isinstance(improvement_steps, list) else str(improvement_steps or "")
        submission.reviewer_type = reviewer_type
        submission.suspicion_score = suspicion
        submission.followup_question = followup
        submission.status = status
        submission.earned_points = earned_points
        submission.reviewed_at = datetime.now(timezone.utc)

        if status == SubmissionStatus.VERIFIED.value:
            task.status = TaskStatus.VERIFIED.value
        elif status == SubmissionStatus.REJECTED.value:
            task.status = TaskStatus.FAILED.value
        elif status in [SubmissionStatus.NEEDS_REVISION.value, SubmissionStatus.PARTIAL.value]:
            task.status = TaskStatus.NEEDS_REVISION.value
        else:
            task.status = TaskStatus.NEEDS_REVISION.value

        await self.task_repo.update(task)
        updated_submission = await self.submission_repo.update(submission)

        submissions = await self.submission_repo.get_by_task_and_user(None, submission.user_id)
        today = date.today()

        earned_today = 0

        for s in submissions:
            if not s.earned_points:
                continue

            points_date = s.reviewed_at.date() if s.reviewed_at else s.created_at.date()

            if points_date == today:
                earned_today += s.earned_points

        streak_service = StreakService(self.session)
        await streak_service.apply_points(submission.user_id, earned_today)

        await self.audit_service.log(
            action="submission.review",
            status="success",
            user_id=reviewer.id,
            target_type="submission",
            target_id=submission.id,
            details=f"score={score}, final_status={status}",
        )

        await self.notification_service.create_submission_reviewed(
            user=reviewer,
            task_id=submission.task_id,
            status=submission.status,
        )

        return updated_submission

    async def manual_review_submission(
        self,
        reviewer: User,
        submission_id: int,
        data: SubmissionManualReviewRequest,
    ) -> TaskSubmission:
        submission = await self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found")

        task = await self.task_repo.get_by_id(submission.task_id)
        if not task:
            raise ValueError("Task not found")

        status = data.status.value if hasattr(data.status, "value") else data.status

        allowed_statuses = {
            SubmissionStatus.VERIFIED.value,
            SubmissionStatus.REJECTED.value,
            SubmissionStatus.NEEDS_REVISION.value,
            SubmissionStatus.PARTIAL.value,
        }

        if status not in allowed_statuses:
            raise ValueError("Invalid manual review status")

        if status == SubmissionStatus.VERIFIED.value:
            earned_points = task.reward_points
        elif status == SubmissionStatus.PARTIAL.value:
            earned_points = int(task.reward_points * 0.6)
        else:
            earned_points = 0

        if data.earned_points is not None:
            earned_points = min(data.earned_points, task.reward_points)

        submission.score = data.score
        submission.earned_points = earned_points
        submission.status = status
        submission.reviewer_type = "manual"
        submission.feedback = data.feedback
        submission.why_not_verified = data.why_not_verified
        submission.improvement_steps = data.improvement_steps
        submission.suspicion_score = data.suspicion_score or 0
        submission.reviewed_at = datetime.now(timezone.utc)
        submission.manual_review_requested = False

        if status == SubmissionStatus.VERIFIED.value:
            submission.why_not_verified = None
            submission.improvement_steps = None
            submission.followup_question = None
            submission.followup_answer = None
        else:
            submission.why_not_verified = data.why_not_verified
            submission.improvement_steps = data.improvement_steps

        if status == SubmissionStatus.VERIFIED.value:
            task.status = TaskStatus.VERIFIED.value
        elif status == SubmissionStatus.REJECTED.value:
            task.status = TaskStatus.FAILED.value
        elif status in [SubmissionStatus.NEEDS_REVISION.value, SubmissionStatus.PARTIAL.value]:
            task.status = TaskStatus.NEEDS_REVISION.value
        else:
            task.status = TaskStatus.NEEDS_REVISION.value

        await self._update_user_weakness(
            user_id=submission.user_id,
            skill_name=task.skill_tag or task.title,
            score=data.score,
            required_score=task.required_score,
        )

        await self.task_repo.update(task)
        updated_submission = await self.submission_repo.update(submission)

        submissions = await self.submission_repo.get_by_task_and_user(None, submission.user_id)
        today = date.today()
        earned_today = 0

        for s in submissions:
            if not s.earned_points:
                continue

            points_date = s.reviewed_at.date() if s.reviewed_at else s.created_at.date()

            if points_date == today:
                earned_today += s.earned_points

        streak_service = StreakService(self.session)
        await streak_service.apply_points(submission.user_id, earned_today)

        await self.audit_service.log(
            action="submission.manual_review",
            status="success",
            user_id=reviewer.id,
            target_type="submission",
            target_id=submission.id,
            details=f"score={data.score}, final_status={status}, earned_points={earned_points}",
        )

        reviewed_user = await self.session.get(User, submission.user_id)

        if reviewed_user:
            await self.notification_service.create_submission_reviewed(
                user=reviewed_user,
                task_id=submission.task_id,
                status=submission.status,
            )

        return updated_submission

    async def _update_user_weakness(
        self,
        *,
        user_id: int,
        skill_name: str | None,
        score: int,
        required_score: int,
    ) -> None:
        if not skill_name:
            return

        normalized_skill = skill_name.strip().lower().replace(" ", "_")

        if not normalized_skill:
            return

        skill_repo = UserSkillRepository(self.session)
        skill = await skill_repo.get_or_create(user_id, normalized_skill)

        if score < required_score:
            delta = 0.1
        elif score < 90:
            delta = -0.03
        else:
            delta = -0.05

        await skill_repo.update_score(skill, delta)

    def _calculate_review_result(
        self,
        *,
        score: int,
        reward_points: int,
        required_score: int,
    ) -> tuple[str, int]:
        if score < 50:
            return SubmissionStatus.REJECTED.value, 0

        if score < required_score:
            if score < 60:
                return SubmissionStatus.PARTIAL.value, int(reward_points * 0.6)
            return SubmissionStatus.PARTIAL.value, int(reward_points * 0.75)

        return SubmissionStatus.VERIFIED.value, reward_points

    async def precheck_submission(
        self,
        user: User,
        data: SubmissionPrecheckRequest,
    ) -> SubmissionPrecheckResponse:
        task = await self.task_repo.get_by_id(data.task_id)
        if not task:
            raise ValueError("Task not found")

        milestone = await self.milestone_repo.get_by_id(task.milestone_id)
        if not milestone:
            raise ValueError("Task not found")

        goal = await self.goal_repo.get_by_id(milestone.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Task not found")

        issues: list[str] = []
        tips: list[str] = []
        score = 0.5

        if task.status in [
            TaskStatus.LOCKED.value,
            TaskStatus.SKIPPED.value,
            TaskStatus.VERIFIED.value,
            TaskStatus.SUBMITTED.value,
        ]:
            return SubmissionPrecheckResponse(
                can_submit=False,
                confidence_score=0.0,
                confidence_label="low",
                rejection_risk="high",
                likely_issues=["Task cannot be submitted in current status"],
                tips=["Open another available task"],
            )

        attempts = await self.submission_repo.count_attempts(task.id, user.id)
        if attempts >= task.max_attempts:
            return SubmissionPrecheckResponse(
                can_submit=False,
                confidence_score=0.0,
                confidence_label="low",
                rejection_risk="high",
                likely_issues=["Max attempts reached"],
                tips=["Open another task or request help"],
            )

        if not any([data.content_text, data.content_code, data.content_link]):
            return SubmissionPrecheckResponse(
                can_submit=False,
                confidence_score=0.0,
                confidence_label="low",
                rejection_risk="high",
                likely_issues=["No content provided"],
                tips=["Add code, text, or link"],
            )

        limits = get_user_limits(user)

        if limits["precheck_enabled"]:
            ai_result = await self.ai_service.precheck_submission(
                user,
                task_title=task.title,
                task_description=task.description or task.title,
                task_type=task.task_type,
                verification_type=task.verification_type,
                submission_text=data.content_text,
                submission_code=data.content_code,
                submission_link=data.content_link,
            )

            return SubmissionPrecheckResponse(**ai_result)

        if task.verification_type == "code" and not data.content_code:
            issues.append("Code is required for this task")
            tips.append("Add your code solution")
            score -= 0.3

        if data.content_text and len(data.content_text.strip()) < 40:
            issues.append("Explanation is too short")
            tips.append("Describe your approach in more detail")
            score -= 0.2

        if data.content_link and not data.content_text:
            issues.append("Link provided without explanation")
            tips.append("Explain what is inside the link")
            score -= 0.1

        if data.content_code and data.content_text:
            score += 0.2

        score = max(0.0, min(score, 1.0))

        if score > 0.75:
            confidence_label = "high"
            rejection_risk = "low"
        elif score > 0.4:
            confidence_label = "medium"
            rejection_risk = "medium"
        else:
            confidence_label = "low"
            rejection_risk = "high"

        return SubmissionPrecheckResponse(
            can_submit=True,
            confidence_score=score,
            confidence_label=confidence_label,
            rejection_risk=rejection_risk,
            likely_issues=issues,
            tips=tips,
        )
    
    async def answer_followup(
        self,
        user: User,
        submission_id: int,
        answer: str,
    ) -> TaskSubmission:
        submission = await self.submission_repo.get_by_id(submission_id)

        if not submission or submission.user_id != user.id:
            raise ValueError("Submission not found")

        if not submission.followup_question:
            raise ValueError("No follow-up question for this submission")

        if submission.status == SubmissionStatus.VERIFIED.value:
            raise ValueError("Submission is already verified")

        task = await self.task_repo.get_by_id(submission.task_id)
        if not task:
            raise ValueError("Task not found")

        submission.followup_answer = answer

        combined_text = f"""
    Original explanation:
    {submission.content_text or "none"}

    Follow-up question:
    {submission.followup_question}

    Follow-up answer:
    {answer}
    """

        ai_result = await self.ai_service.review_submission(
            user=user,
            task_title=task.title,
            task_description=task.description or task.title,
            task_type=task.task_type,
            verification_type=task.verification_type,
            required_score=task.required_score,
            submission_text=combined_text,
            submission_code=submission.content_code,
            submission_link=submission.content_link,
        )

        score = int(ai_result.get("score", submission.score or 50))
        feedback = ai_result.get("feedback", submission.feedback or "No feedback provided")
        why_not_verified = ai_result.get("why_not_verified")
        improvement_steps = ai_result.get("improvement_steps", [])
        suspicion = int(ai_result.get("suspicion_score", submission.suspicion_score or 0))
        followup = ai_result.get("followup_question")

        status, earned_points = self._calculate_review_result(
            score=score,
            reward_points=task.reward_points,
            required_score=task.required_score,
        )

        if suspicion > 40 or score < task.required_score:
            status = SubmissionStatus.NEEDS_REVISION.value
            earned_points = 0

        submission.score = score
        submission.feedback = feedback
        submission.reviewer_type = "ai"
        submission.suspicion_score = suspicion
        submission.followup_question = followup
        submission.status = status
        submission.earned_points = earned_points
        submission.reviewed_at = datetime.now(timezone.utc)

        if status == SubmissionStatus.VERIFIED.value:
            task.status = TaskStatus.VERIFIED.value
        elif status == SubmissionStatus.REJECTED.value:
            task.status = TaskStatus.FAILED.value
        elif status in [SubmissionStatus.NEEDS_REVISION.value, SubmissionStatus.PARTIAL.value]:
            task.status = TaskStatus.NEEDS_REVISION.value
        else:
            task.status = TaskStatus.NEEDS_REVISION.value

        await self.task_repo.update(task)
        updated_submission = await self.submission_repo.update(submission)

        await self.audit_service.log(
            action="submission.answer_followup",
            status="success",
            user_id=user.id,
            target_type="submission",
            target_id=submission.id,
            details=f"score={score}, final_status={status}",
        )

        await self.notification_service.create_submission_reviewed(
            user=user,
            task_id=submission.task_id,
            status=submission.status,
        )

        return updated_submission