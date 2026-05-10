from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.practice_attempt import PracticeAttempt


class PracticeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, attempt: PracticeAttempt) -> PracticeAttempt:
        self.session.add(attempt)
        await self.session.commit()
        await self.session.refresh(attempt)
        return attempt

    async def get_user_attempts(self, user_id: int) -> list[PracticeAttempt]:
        result = await self.session.execute(
            select(PracticeAttempt)
            .where(PracticeAttempt.user_id == user_id)
            .order_by(PracticeAttempt.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_user_task_attempts(self, user_id: int, task_id: int) -> list[PracticeAttempt]:
        result = await self.session.execute(
            select(PracticeAttempt)
            .where(
                PracticeAttempt.user_id == user_id,
                PracticeAttempt.task_id == task_id,
            )
            .order_by(PracticeAttempt.created_at.desc())
        )
        return list(result.scalars().all())
