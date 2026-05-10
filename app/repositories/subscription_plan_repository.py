from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription_plan import SubscriptionPlan


class SubscriptionPlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all_active(self) -> list[SubscriptionPlan]:
        result = await self.session.execute(
            select(SubscriptionPlan)
            .where(SubscriptionPlan.is_active.is_(True))
            .order_by(SubscriptionPlan.price_usd.asc())
        )
        return list(result.scalars().all())

    async def get_by_tier(self, tier: str) -> SubscriptionPlan | None:
        result = await self.session.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.tier == tier)
        )
        return result.scalar_one_or_none()

    async def create(self, plan: SubscriptionPlan) -> SubscriptionPlan:
        self.session.add(plan)
        await self.session.commit()
        await self.session.refresh(plan)
        return plan
