from app.models.user import User
from app.repositories.subscription_plan_repository import SubscriptionPlanRepository
from app.repositories.user_repository import UserRepository


class SubscriptionService:
    def __init__(self, session) -> None:
        self.session = session
        self.plan_repo = SubscriptionPlanRepository(session)
        self.user_repo = UserRepository(session)

    async def get_active_plans(self):
        return await self.plan_repo.get_all_active()

    async def grant_tier(self, admin_user: User, *, user_id: int, subscription_tier: str):
        if admin_user.role != "admin":
            raise ValueError("Only admin can grant tiers")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        plan = await self.plan_repo.get_by_tier(subscription_tier)
        if not plan:
            raise ValueError("Plan not found")

        user.subscription_tier = subscription_tier
        await self.session.commit()
        await self.session.refresh(user)
        return user
