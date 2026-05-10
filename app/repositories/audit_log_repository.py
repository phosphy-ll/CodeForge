from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, log: AuditLog) -> AuditLog:
        self.session.add(log)
        await self.session.commit()
        await self.session.refresh(log)
        return log
