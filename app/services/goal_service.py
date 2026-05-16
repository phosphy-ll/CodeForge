from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.subscription import get_user_limits
from app.models.goal import Goal
from app.models.user import User
from app.repositories.goal_repository import GoalRepository
from app.schemas.goal import GoalCreate
from app.domain.subscription import is_language_allowed_for_user
from app.domain.languages import normalize_language
from app.models.milestone import Milestone
from app.repositories.milestone_repository import MilestoneRepository

class GoalService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.goal_repo = GoalRepository(session)
        self.milestone_repo = MilestoneRepository(session)

    async def create_goal(self, user: User, data: GoalCreate) -> Goal:
        limits = get_user_limits(user)

        goals = await self.goal_repo.get_user_goals(user.id)
        active_goals = [g for g in goals if g.status == "active"]

        if len(active_goals) >= limits["max_active_goals"]:
            raise ValueError("Active goals limit reached for your plan")

        language = normalize_language(data.language)

        if not is_language_allowed_for_user(user, language):
            raise ValueError("This language is not available on your current subscription tier")

        goal = Goal(
            user_id=user.id,
            title=data.title,
            description=data.description,
            language=language,
            goal_type=data.goal_type.value,
            declared_level=data.declared_level.value,
            detected_level=data.declared_level.value,
            effective_level=data.declared_level.value,
            learning_style=data.learning_style.value,
            accountability_mode=data.accountability_mode.value,
            target_months=data.target_months,
            optimal_months=data.target_months,
            status="active",
        )

        created_goal = await self.goal_repo.create(goal)

        milestone = Milestone(
            goal_id=created_goal.id,
            title="Foundation",
            order=1,
            status="available",
        )

        await self.milestone_repo.create(milestone)

        return created_goal

    async def get_user_goals(self, user: User):
        return await self.goal_repo.get_user_goals(user.id)

    async def get_goal_for_user(self, user: User, goal_id: int) -> Goal:
        goal = await self.goal_repo.get_by_id(goal_id)
        if not goal or goal.user_id != user.id:
            raise ValueError("Goal not found")
        return goal
