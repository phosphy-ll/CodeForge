from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/me", tags=["Dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = DashboardService(db)
    return await service.get_dashboard(current_user.id)
