from typing import Annotated, Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(int(user_id))
    if not user:
        raise UnauthorizedError("User not found")

    if not user.is_active:
        raise UnauthorizedError("User is inactive")

    return user


async def get_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != "admin":
        raise ForbiddenError("Admin access required")
    return current_user


def require_roles(*allowed_roles: str) -> Callable:
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError("Insufficient permissions")
        return current_user

    return role_checker
