from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone
from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.repositories.milestone_repository import MilestoneRepository
from app.schemas.milestone import MilestoneCreate


class MilestoneService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.goal_repo = GoalRepository(session)
        self.milestone_repo = MilestoneRepository(session)

    async def create_milestone(self, user: User, data: MilestoneCreate) -> Milestone:
        goal = await self.goal_repo.get_by_id(data.goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Goal not found")

        milestone = Milestone(
            goal_id=data.goal_id,
            title=data.title,
            order=data.order,
            status="available" if data.order == 1 else "locked",
        )
        return await self.milestone_repo.create(milestone)

    async def get_goal_milestones(self, user: User, goal_id: int):
        goal = await self.goal_repo.get_by_id(goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Goal not found")

        return await self.milestone_repo.get_by_goal_id(goal_id)
