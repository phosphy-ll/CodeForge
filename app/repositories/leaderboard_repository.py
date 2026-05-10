from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.leaderboard import LeaderboardEntry


class LeaderboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_period_entries(self, period_type: str, period_start: date) -> list[LeaderboardEntry]:
        result = await self.session.execute(
            select(LeaderboardEntry)
            .where(
                LeaderboardEntry.period_type == period_type,
                LeaderboardEntry.period_start == period_start,
            )
            .order_by(
                LeaderboardEntry.rank.asc().nullslast(),
                LeaderboardEntry.score_points.desc(),
                LeaderboardEntry.verified_tasks.desc(),
            )
        )
        return list(result.scalars().all())

    async def get_user_period_entry(
        self,
        user_id: int,
        period_type: str,
        period_start: date,
    ) -> LeaderboardEntry | None:
        result = await self.session.execute(
            select(LeaderboardEntry).where(
                LeaderboardEntry.user_id == user_id,
                LeaderboardEntry.period_type == period_type,
                LeaderboardEntry.period_start == period_start,
            )
        )
        return result.scalar_one_or_none()

    async def get_existing(self, user_id: int, period_type: str, period_start: date) -> LeaderboardEntry | None:
        return await self.get_user_period_entry(user_id, period_type, period_start)

    async def create(self, entry: LeaderboardEntry) -> LeaderboardEntry:
        self.session.add(entry)
        await self.session.commit()
        await self.session.refresh(entry)
        return entry

    async def update(self, entry: LeaderboardEntry) -> LeaderboardEntry:
        await self.session.commit()
        await self.session.refresh(entry)
        return entry
