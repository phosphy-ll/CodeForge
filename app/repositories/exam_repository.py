from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exam_attempt import ExamAttempt


class ExamRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, attempt: ExamAttempt) -> ExamAttempt:
        self.session.add(attempt)
        await self.session.commit()
        await self.session.refresh(attempt)
        return attempt

    async def get_by_id(self, attempt_id: int) -> ExamAttempt | None:
        result = await self.session.execute(
            select(ExamAttempt).where(ExamAttempt.id == attempt_id)
        )
        return result.scalar_one_or_none()

    async def get_attempts(
        self,
        *,
        user_id: int,
        attempt_type: str,
        skill_name: str,
    ) -> list[ExamAttempt]:
        result = await self.session.execute(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == user_id,
                ExamAttempt.attempt_type == attempt_type,
                ExamAttempt.skill_name == skill_name,
            )
            .order_by(ExamAttempt.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_best_attempt(
        self,
        *,
        user_id: int,
        attempt_type: str,
        skill_name: str,
    ) -> ExamAttempt | None:
        result = await self.session.execute(
            select(ExamAttempt)
            .where(
                ExamAttempt.user_id == user_id,
                ExamAttempt.attempt_type == attempt_type,
                ExamAttempt.skill_name == skill_name,
            )
            .order_by(ExamAttempt.score.desc().nullslast(), ExamAttempt.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def update(self, attempt: ExamAttempt) -> ExamAttempt:
        await self.session.commit()
        await self.session.refresh(attempt)
        return attempt