from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.exceptions import RateLimitError
from app.core.rate_limit import rate_limiter
from app.domain.subscription import get_user_limits
from app.models.practice_attempt import PracticeAttempt
from app.models.task_submission import TaskSubmission


class SecurityService:
    def __init__(self, session) -> None:
        self.session = session

    def check_auth_rate_limit(self, identifier: str, action: str):
        key = f"auth:{action}:{identifier}"
        if not rate_limiter.check(key, limit=5, window_seconds=60):
            raise RateLimitError("Too many authentication attempts. Try again later.")

    def check_email_rate_limit(self, identifier: str, action: str):
        key = f"email:{action}:{identifier}"
        if not rate_limiter.check(key, limit=3, window_seconds=300):
            raise RateLimitError("Too many email requests. Try again later.")

    def check_ai_rate_limit(self, user):
        limits = get_user_limits(user)
        limit = limits["ai_requests_per_day"]
        key = f"ai:{user.id}:{date.today().isoformat()}"
        if not rate_limiter.check(key, limit=limit, window_seconds=86400):
            raise RateLimitError("Daily AI limit reached for your plan.")

    async def check_submission_spam_limit(self, user_id: int):
        now = datetime.now(timezone.utc)
        since = now - timedelta(minutes=10)

        result = await self.session.execute(
            select(TaskSubmission).where(
                TaskSubmission.user_id == user_id,
                TaskSubmission.created_at >= since,
            )
        )
        count = len(list(result.scalars().all()))
        if count >= 20:
            raise RateLimitError("Too many submissions in a short time.")

    async def check_practice_spam_limit(self, user_id: int):
        now = datetime.now(timezone.utc)
        since = now - timedelta(minutes=10)

        result = await self.session.execute(
            select(PracticeAttempt).where(
                PracticeAttempt.user_id == user_id,
                PracticeAttempt.created_at >= since,
            )
        )
        count = len(list(result.scalars().all()))
        if count >= 30:
            raise RateLimitError("Too many practice attempts in a short time.")
