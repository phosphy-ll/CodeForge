from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.repositories.milestone_repository import MilestoneRepository
from app.repositories.task_repository import TaskRepository


class RoadmapService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.goal_repo = GoalRepository(session)
        self.milestone_repo = MilestoneRepository(session)
        self.task_repo = TaskRepository(session)

    async def get_goal_roadmap(self, user: User, goal_id: int) -> dict:
        goal = await self.goal_repo.get_by_id(goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Goal not found")

        milestones = await self.milestone_repo.get_by_goal_id(goal_id)

        milestone_items = []
        for milestone in milestones:
            tasks = await self.task_repo.get_by_milestone_id(milestone.id)
            milestone_items.append(
                {
                    "id": milestone.id,
                    "title": milestone.title,
                    "order": milestone.order,
                    "status": milestone.status,
                    "tasks": [
                        {
                            "id": task.id,
                            "title": task.title,
                            "description": task.description,
                            "task_type": task.task_type,
                            "verification_type": task.verification_type,
                            "status": task.status,
                            "reward_points": task.reward_points,
                            "difficulty": task.difficulty,
                            "estimated_minutes": task.estimated_minutes,
                            "is_required": task.is_required,
                            "unlock_condition_text": task.unlock_condition_text,
                        }
                        for task in tasks
                    ],
                }
            )

        return {
            "goal": {
                "id": goal.id,
                "title": goal.title,
                "description": goal.description,
                "language": goal.language,
                "goal_type": goal.goal_type,
                "status": goal.status,
            },
            "milestones": milestone_items,
        }
