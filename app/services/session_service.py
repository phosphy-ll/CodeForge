from datetime import datetime, timezone

from app.core.exceptions import UnauthorizedError
from app.core.security import create_refresh_token, decode_refresh_token, generate_session_token
from app.models.user_session import UserSession
from app.repositories.session_repository import SessionRepository


class SessionService:
    def __init__(self, session) -> None:
        self.session = session
        self.repo = SessionRepository(session)

    async def create_session(
        self,
        *,
        user_id: int,
        user_agent: str | None,
        ip_address: str | None,
    ) -> tuple[str, str, int]:
        session_token = generate_session_token()
        refresh_token_version = 1

        session_obj = await self.repo.create(
            UserSession(
                user_id=user_id,
                session_token=session_token,
                refresh_token_version=refresh_token_version,
                user_agent=user_agent,
                ip_address=ip_address,
                is_active=True,
            )
        )

        refresh_token = create_refresh_token(
            subject=user_id,
            session_token=session_obj.session_token,
            refresh_token_version=session_obj.refresh_token_version,
        )

        return refresh_token, session_obj.session_token, session_obj.refresh_token_version

    async def rotate_refresh_token(self, refresh_token: str) -> tuple[int, str]:
        try:
            payload = decode_refresh_token(refresh_token)
        except ValueError as exc:
            raise UnauthorizedError("Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid refresh token")

        user_id = payload.get("sub")
        session_token = payload.get("sid")
        refresh_token_version = payload.get("rtv")

        if not user_id or not session_token or refresh_token_version is None:
            raise UnauthorizedError("Invalid refresh token")

        session_obj = await self.repo.get_by_session_token(session_token)
        if not session_obj or not session_obj.is_active:
            raise UnauthorizedError("Session is inactive")

        if session_obj.refresh_token_version != refresh_token_version:
            raise UnauthorizedError("Refresh token already rotated")

        session_obj.refresh_token_version += 1
        session_obj.last_used_at = datetime.now(timezone.utc)
        await self.repo.update(session_obj)

        new_refresh_token = create_refresh_token(
            subject=user_id,
            session_token=session_obj.session_token,
            refresh_token_version=session_obj.refresh_token_version,
        )
        return int(user_id), new_refresh_token

    async def logout_by_refresh_token(self, refresh_token: str) -> None:
        try:
            payload = decode_refresh_token(refresh_token)
        except ValueError as exc:
            raise UnauthorizedError("Invalid refresh token") from exc

        session_token = payload.get("sid")
        if not session_token:
            raise UnauthorizedError("Invalid refresh token")

        await self.repo.deactivate_session(session_token)

    async def logout_all(self, user_id: int) -> None:
        await self.repo.deactivate_all_user_sessions(user_id)

    async def revoke_all_on_password_change(self, user_id: int) -> None:
        await self.repo.deactivate_all_user_sessions(user_id)
