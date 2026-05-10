from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_session import UserSession


class SessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, obj: UserSession) -> UserSession:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def get_by_session_token(self, session_token: str) -> UserSession | None:
        result = await self.session.execute(
            select(UserSession).where(UserSession.session_token == session_token)
        )
        return result.scalar_one_or_none()

    async def get_active_user_sessions(self, user_id: int) -> list[UserSession]:
        result = await self.session.execute(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.is_active.is_(True),
            )
        )
        return list(result.scalars().all())

    async def update(self, obj: UserSession) -> UserSession:
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def deactivate_session(self, session_token: str) -> None:
        await self.session.execute(
            update(UserSession)
            .where(UserSession.session_token == session_token)
            .values(is_active=False)
        )
        await self.session.commit()

    async def deactivate_all_user_sessions(self, user_id: int) -> None:
        await self.session.execute(
            update(UserSession)
            .where(UserSession.user_id == user_id)
            .values(is_active=False)
        )
        await self.session.commit()
