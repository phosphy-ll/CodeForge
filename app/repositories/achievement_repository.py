from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement, UserAchievement


class AchievementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all_active(self) -> list[Achievement]:
        result = await self.session.execute(
            select(Achievement)
            .where(Achievement.is_active.is_(True))
            .order_by(Achievement.id.asc())
        )
        return list(result.scalars().all())

    async def get_by_key(self, key: str) -> Achievement | None:
        result = await self.session.execute(
            select(Achievement).where(Achievement.key == key)
        )
        return result.scalar_one_or_none()

    async def get_user_achievements(self, user_id: int) -> list[UserAchievement]:
        result = await self.session.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at.desc().nullslast())
        )
        return list(result.scalars().all())

    async def get_user_achievement(self, user_id: int, achievement_id: int) -> UserAchievement | None:
        result = await self.session.execute(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_user_achievement(self, obj: UserAchievement) -> UserAchievement:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update_user_achievement(self, obj: UserAchievement) -> UserAchievement:
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def create_achievement(self, achievement: Achievement) -> Achievement:
        self.session.add(achievement)
        await self.session.commit()
        await self.session.refresh(achievement)
        return achievement
