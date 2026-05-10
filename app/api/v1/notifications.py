from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService
from sqlalchemy import select
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
async def get_my_notifications(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    repo = NotificationRepository(db)
    return await repo.get_by_user(current_user.id)


@router.get("/unread-count")
async def get_unread_count(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, int]:
    repo = NotificationRepository(db)
    count = await repo.unread_count(current_user.id)
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    repo = NotificationRepository(db)
    await repo.mark_read(current_user.id, notification_id)
    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_notifications_read(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    repo = NotificationRepository(db)
    await repo.mark_all_read(current_user.id)
    return {"message": "All notifications marked as read"}

@router.post("/generate-pressure")
async def generate_pressure_notification(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = NotificationService(db)
    notification = await service.create_pressure_signal(current_user)

    if not notification:
        return {"message": "No pressure notification needed"}

    return NotificationResponse.model_validate(notification)

@router.post("/generate-pressure-all")
async def generate_pressure_notifications_for_all(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role != "admin":
        return {"message": "Admin only"}

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

@router.post("/generate-pressure-all")
async def generate_pressure_notifications_for_all(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role != "admin":
        return {"message": "Admin only"}

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