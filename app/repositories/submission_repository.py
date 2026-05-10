from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.enums import SubmissionStatus
from sqlalchemy.orm import selectinload

from app.models.task_submission import TaskSubmission


class SubmissionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, submission: TaskSubmission) -> TaskSubmission:
        self.session.add(submission)
        await self.session.commit()
        await self.session.refresh(submission)
        return submission

    async def get_by_id(self, submission_id: int) -> TaskSubmission | None:
        result = await self.session.execute(
            select(TaskSubmission).where(TaskSubmission.id == submission_id)
        )
        return result.scalar_one_or_none()

    async def update(self, submission: TaskSubmission) -> TaskSubmission:
        await self.session.commit()
        await self.session.refresh(submission)
        return submission

    async def get_by_task_and_user(self, task_id: int | None, user_id: int):
        query = select(TaskSubmission).where(TaskSubmission.user_id == user_id)

        if task_id is not None:
            query = query.where(TaskSubmission.task_id == task_id)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_latest(self, task_id: int, user_id: int) -> TaskSubmission | None:
        result = await self.session.execute(
            select(TaskSubmission)
            .where(
                TaskSubmission.task_id == task_id,
                TaskSubmission.user_id == user_id,
            )
            .order_by(TaskSubmission.created_at.desc(), TaskSubmission.id.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def count_attempts(self, task_id: int, user_id: int) -> int:
        result = await self.session.execute(
            select(func.count(TaskSubmission.id))
            .where(
                TaskSubmission.task_id == task_id,
                TaskSubmission.user_id == user_id,
            )
        )
        return int(result.scalar() or 0)

    async def count_failed_attempts(self, task_id: int, user_id: int) -> int:
        result = await self.session.execute(
            select(func.count(TaskSubmission.id))
            .where(
                TaskSubmission.task_id == task_id,
                TaskSubmission.user_id == user_id,
                TaskSubmission.status == SubmissionStatus.REJECTED.value,
            )
        )
        return int(result.scalar() or 0)

    async def get_recent_by_user(self, user_id: int, limit: int = 10):
        result = await self.session.execute(
            select(TaskSubmission)
            .options(selectinload(TaskSubmission.task))
            .where(TaskSubmission.user_id == user_id)
            .order_by(TaskSubmission.created_at.desc(), TaskSubmission.id.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
