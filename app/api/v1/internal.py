from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.config import get_settings
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/internal", tags=["Internal"])

settings = get_settings()


@router.post("/cron/generate-pressure")
async def cron_generate_pressure(
    db: DbSession,
    x_cron_secret: str | None = Header(default=None),
):
    if x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=403, detail="Invalid cron secret")

    result = await db.execute(
        select(User).where(User.is_active.is_(True))
    )

    users = list(result.scalars().all())

    service = NotificationService(db)

    created_count = 0
    skipped_count = 0

    for user in users:
        notification = await service.create_pressure_signal(user)

        if notification:
            created_count += 1
        else:
            skipped_count += 1

    return {
        "message": "Pressure generation completed",
        "users_checked": len(users),
        "created": created_count,
        "skipped": skipped_count,
    }