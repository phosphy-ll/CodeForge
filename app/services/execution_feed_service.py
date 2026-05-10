from sqlalchemy import select

from app.models.exam_attempt import ExamAttempt
from app.models.practice_attempt import PracticeAttempt
from app.models.task_submission import TaskSubmission
from app.models.user import User
from app.schemas.execution_feed import ExecutionFeedItem, ExecutionFeedResponse


class ExecutionFeedService:
    def __init__(self, session) -> None:
        self.session = session

    async def get_feed(self, user: User) -> ExecutionFeedResponse:
        items: list[ExecutionFeedItem] = []

        task_result = await self.session.execute(
            select(TaskSubmission)
            .where(TaskSubmission.user_id == user.id)
            .order_by(TaskSubmission.created_at.desc())
            .limit(50)
        )

        for item in task_result.scalars().all():
            items.append(
                ExecutionFeedItem(
                    id=item.id,
                    source="task",
                    title=f"Task submission #{item.id}",
                    skill_name=None,
                    status=item.status,
                    score=item.score,
                    earned_points=item.earned_points or 0,
                    max_points=None,
                    suspicion_score=item.suspicion_score,
                    feedback=item.feedback,
                    manual_review_requested=item.manual_review_requested,
                    created_at=item.created_at,
                )
            )

        practice_result = await self.session.execute(
            select(PracticeAttempt)
            .where(PracticeAttempt.user_id == user.id)
            .order_by(PracticeAttempt.created_at.desc())
            .limit(50)
        )

        for item in practice_result.scalars().all():
            items.append(
                ExecutionFeedItem(
                    id=item.id,
                    source="practice",
                    title=item.task_title_snapshot or "Practice attempt",
                    skill_name=None,
                    status="practice",
                    score=item.score,
                    earned_points=item.earned_points or 0,
                    max_points=item.potential_reward_points,
                    suspicion_score=item.suspicion_score,
                    feedback=item.feedback,
                    manual_review_requested=False,
                    created_at=item.created_at,
                )
            )

        exam_result = await self.session.execute(
            select(ExamAttempt)
            .where(ExamAttempt.user_id == user.id)
            .order_by(ExamAttempt.created_at.desc())
            .limit(100)
        )

        for item in exam_result.scalars().all():
            items.append(
                ExecutionFeedItem(
                    id=item.id,
                    source=item.attempt_type,
                    title=f"{item.skill_name} {item.attempt_type}",
                    skill_name=item.skill_name,
                    status=item.status,
                    score=item.score,
                    earned_points=item.earned_points or 0,
                    max_points=item.max_points,
                    suspicion_score=item.suspicion_score,
                    feedback=item.feedback,
                    manual_review_requested=item.manual_review_requested,
                    created_at=item.created_at,
                )
            )

        items.sort(key=lambda x: x.created_at, reverse=True)

        scores = [x.score for x in items if x.score is not None]
        avg_score = int(round(sum(scores) / len(scores))) if scores else None

        return ExecutionFeedResponse(
            total_items=len(items),
            avg_score=avg_score,
            total_earned_points=sum(x.earned_points for x in items),
            rejected_count=sum(1 for x in items if x.status == "rejected"),
            partial_count=sum(1 for x in items if x.status == "partial"),
            verified_count=sum(1 for x in items if x.status == "verified"),
            items=items[:100],
        )