from fastapi import APIRouter, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession
from app.models.analytics_event import AnalyticsEvent
from app.schemas.analytics import AnalyticsEventCreate

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/events", status_code=201)
async def create_analytics_event(
    data: AnalyticsEventCreate,
    db: DbSession,
    request: Request,
) -> dict[str, str]:
    user_id = None

    event = AnalyticsEvent(
        user_id=user_id,
        session_id=data.session_id,
        event_name=data.event_name,
        path=data.path,
        metadata_json=data.metadata,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    db.add(event)
    await db.commit()

    return {"status": "ok"}