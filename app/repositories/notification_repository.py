from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from datetime import datetime

class NotificationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, notification: Notification) -> Notification:
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        return notification

    async def get_by_user(self, user_id: int, limit: int = 30) -> list[Notification]:
        result = await self.session.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def unread_count(self, user_id: int) -> int:
        result = await self.session.execute(
            select(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return len(list(result.scalars().all()))

    async def mark_read(self, user_id: int, notification_id: int) -> None:
        await self.session.execute(
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .values(is_read=True)
        )
        await self.session.commit()

    async def mark_all_read(self, user_id: int) -> None:
        await self.session.execute(
            update(Notification)
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
        await self.session.commit()

    async def exists_recent(
        self,
        *,
        user_id: int,
        type: str,
        since: datetime,
    ) -> bool:
        result = await self.session.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.type == type,
                Notification.created_at >= since,
            )
        )

        return result.scalar_one_or_none() is not None