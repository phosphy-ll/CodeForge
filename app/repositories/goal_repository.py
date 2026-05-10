from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal


class GoalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, goal: Goal) -> Goal:
        self.session.add(goal)
        await self.session.commit()
        await self.session.refresh(goal)
        return goal

    async def get_by_id(self, goal_id: int) -> Goal | None:
        result = await self.session.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        return result.scalar_one_or_none()

    async def get_user_goals(self, user_id: int) -> list[Goal]:
        result = await self.session.execute(
            select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_goal_for_user(self, user_id: int) -> Goal | None:
        result = await self.session.execute(
            select(Goal).where(
                Goal.user_id == user_id,
                Goal.status == "active",
            )
        )
        return result.scalar_one_or_none()
