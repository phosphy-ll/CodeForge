from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select

from app.api.deps import DbSession, get_current_user
from app.models.analytics_event import AnalyticsEvent
from app.models.daily_plan import DailyPlan
from app.models.goal import Goal
from app.models.task_submission import TaskSubmission
from app.models.user import User

router = APIRouter(prefix="/admin/metrics", tags=["Admin Metrics"])


def require_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


@router.get("")
async def get_admin_metrics(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    require_admin(current_user)

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    async def count(model, *conditions) -> int:
        result = await db.execute(
            select(func.count()).select_from(model).where(*conditions)
        )
        return int(result.scalar() or 0)

    users_total = await count(User)
    users_verified = await count(User, User.is_email_verified.is_(True))
    users_last_24h = await count(User, User.created_at >= last_24h)
    users_last_7d = await count(User, User.created_at >= last_7d)

    paid_users = await count(
        User,
        User.subscription_tier.in_(["starter", "plus", "ultra"]),
    )

    beta_testers = await count(User, User.beta_tester.is_(True))

    goals_total = await count(Goal)
    goals_active = await count(Goal, Goal.status == "active")
    goals_last_24h = await count(Goal, Goal.created_at >= last_24h)
    goals_last_7d = await count(Goal, Goal.created_at >= last_7d)

    daily_plans_total = await count(DailyPlan)
    daily_plans_last_24h = await count(DailyPlan, DailyPlan.created_at >= last_24h)
    daily_plans_last_7d = await count(DailyPlan, DailyPlan.created_at >= last_7d)

    submissions_total = await count(TaskSubmission)
    submissions_last_24h = await count(TaskSubmission, TaskSubmission.created_at >= last_24h)
    submissions_last_7d = await count(TaskSubmission, TaskSubmission.created_at >= last_7d)

    verified_submissions = await count(
        TaskSubmission,
        TaskSubmission.status == "verified",
    )

    analytics_events = [
        "landing_view",
        "start_free_click",
        "signup_opened",
        "signup_submit",
        "signup_success",
        "signup_failed",
        "email_verify_opened",
        "email_verify_submit",
        "email_verified",
        "email_verify_failed",
        "today_opened",
        "today_plan_loaded",
        "today_task_opened",
    ]

    analytics = {}

    for event_name in analytics_events:
        analytics[event_name] = {
            "total": await count(AnalyticsEvent, AnalyticsEvent.event_name == event_name),
            "last_24h": await count(
                AnalyticsEvent,
                AnalyticsEvent.event_name == event_name,
                AnalyticsEvent.created_at >= last_24h,
            ),
            "last_7d": await count(
                AnalyticsEvent,
                AnalyticsEvent.event_name == event_name,
                AnalyticsEvent.created_at >= last_7d,
            ),
        }

    return {
        "users": {
            "total": users_total,
            "verified": users_verified,
            "last_24h": users_last_24h,
            "last_7d": users_last_7d,
            "paid": paid_users,
            "beta_testers": beta_testers,
        },
        "goals": {
            "total": goals_total,
            "active": goals_active,
            "last_24h": goals_last_24h,
            "last_7d": goals_last_7d,
        },
        "daily_plans": {
            "total": daily_plans_total,
            "last_24h": daily_plans_last_24h,
            "last_7d": daily_plans_last_7d,
        },
        "submissions": {
            "total": submissions_total,
            "verified": verified_submissions,
            "last_24h": submissions_last_24h,
            "last_7d": submissions_last_7d,
        },
        "analytics": analytics,
    }