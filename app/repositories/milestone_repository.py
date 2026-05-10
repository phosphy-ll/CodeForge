from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone


class MilestoneRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, milestone: Milestone) -> Milestone:
        self.session.add(milestone)
        await self.session.commit()
        await self.session.refresh(milestone)
        return milestone

    async def get_by_goal_id(self, goal_id: int) -> list[Milestone]:
        result = await self.session.execute(
            select(Milestone)
            .where(Milestone.goal_id == goal_id)
            .order_by(Milestone.order.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, milestone_id: int) -> Milestone | None:
        result = await self.session.execute(
            select(Milestone).where(Milestone.id == milestone_id)
        )
        return result.scalar_one_or_none()
