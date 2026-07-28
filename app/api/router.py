from fastapi import APIRouter

from app.api.v1.achievements import router as achievements_router
from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.goals import router as goals_router
from app.api.v1.health import router as health_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.milestones import router as milestones_router
from app.api.v1.practice import router as practice_router
from app.api.v1.roadmap import router as roadmap_router
from app.api.v1.subscription_plans import router as subscription_plans_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.daily_plans import router as daily_plans_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.internal import router as internal_router
from app.api.v1.practice import router as practice_router
from app.api.v1.exams import router as exams_router
from app.api.v1.billing import router as billing_router
from app.api.v1 import analytics
from app.api.v1.admin_metrics import router as admin_metrics_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(goals_router)
api_router.include_router(milestones_router)
api_router.include_router(tasks_router)
api_router.include_router(submissions_router)
api_router.include_router(dashboard_router)
api_router.include_router(roadmap_router)
api_router.include_router(ai_router)
api_router.include_router(subscription_plans_router)
api_router.include_router(leaderboard_router)
api_router.include_router(achievements_router)
api_router.include_router(practice_router)
api_router.include_router(daily_plans_router)
api_router.include_router(notifications_router)
api_router.include_router(internal_router)
api_router.include_router(practice_router)
api_router.include_router(exams_router)
api_router.include_router(billing_router)
api_router.include_router(analytics.router)
api_router.include_router(admin_metrics_router)