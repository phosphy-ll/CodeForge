from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, task: Task) -> Task:
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def get_by_id(self, task_id: int) -> Task | None:
        result = await self.session.execute(
            select(Task).where(Task.id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, task_ids: list[int]) -> list[Task]:
        if not task_ids:
            return []

        result = await self.session.execute(
            select(Task).where(Task.id.in_(task_ids))
        )
        return list(result.scalars().all())

    async def get_by_milestone_id(self, milestone_id: int) -> list[Task]:
        result = await self.session.execute(
            select(Task)
            .where(Task.milestone_id == milestone_id)
            .order_by(Task.created_at.asc())
        )
        return list(result.scalars().all())

    async def update(self, task: Task) -> Task:
        await self.session.commit()
        await self.session.refresh(task)
        return task
