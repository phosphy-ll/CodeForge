from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository


class AuditService:
    def __init__(self, session) -> None:
        self.session = session
        self.repo = AuditLogRepository(session)

    async def log(
        self,
        *,
        action: str,
        status: str = "success",
        user_id: int | None = None,
        target_type: str | None = None,
        target_id: int | None = None,
        ip_address: str | None = None,
        details: str | None = None,
    ):
        return await self.repo.create(
            AuditLog(
                user_id=user_id,
                action=action,
                target_type=target_type,
                target_id=target_id,
                status=status,
                ip_address=ip_address,
                details=details,
            )
        )
