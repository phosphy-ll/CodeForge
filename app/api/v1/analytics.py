import hashlib

from fastapi import APIRouter, Request

from app.api.deps import DbSession
from app.core.exceptions import RateLimitError
from app.core.rate_limit import rate_limiter
from app.models.analytics_event import AnalyticsEvent
from app.schemas.analytics import AnalyticsEventCreate

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _anonymize_ip(value: str | None) -> str | None:
    if not value:
        return None
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:32]


@router.post("/events", status_code=201)
async def create_analytics_event(
    data: AnalyticsEventCreate,
    db: DbSession,
    request: Request,
) -> dict[str, str]:
    client_ip = request.client.host if request.client else "unknown"
    limiter_key = f"analytics:{client_ip}:{data.session_id or 'anonymous'}"

    if not rate_limiter.check(limiter_key, limit=60, window_seconds=60):
        raise RateLimitError("Too many analytics events. Try again later.")

    event = AnalyticsEvent(
        user_id=None,
        session_id=data.session_id,
        event_name=data.event_name,
        path=data.path,
        metadata_json=data.metadata,
        ip_address=_anonymize_ip(client_ip),
        user_agent=(request.headers.get("user-agent") or "")[:500] or None,
    )

    db.add(event)
    await db.commit()

    return {"status": "ok"}
