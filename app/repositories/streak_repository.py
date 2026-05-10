from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.streak import UserStreak


class StreakRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create(self, user_id: int) -> UserStreak:
        result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()

        if not streak:
            streak = UserStreak(user_id=user_id)
            self.session.add(streak)
            await self.session.commit()
            await self.session.refresh(streak)

        return streak

    async def update(self, streak: UserStreak):
        await self.session.commit()
        await self.session.refresh(streak)
        return streak
