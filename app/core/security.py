from datetime import datetime, timedelta, timezone
from typing import Any
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def _build_token_payload(
    subject: str | int,
    token_type: str,
    expire_delta: timedelta,
    extra_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    expire = now + expire_delta

    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    if extra_data:
        payload.update(extra_data)

    return payload


def create_access_token(
    subject: str | int,
    extra_data: dict[str, Any] | None = None,
) -> str:
    payload = _build_token_payload(
        subject=subject,
        token_type="access",
        expire_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_data=extra_data,
    )
    return jwt.encode(
        payload,
        settings.ACCESS_TOKEN_SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_refresh_token(
    subject: str | int,
    session_token: str,
    refresh_token_version: int,
) -> str:
    payload = _build_token_payload(
        subject=subject,
        token_type="refresh",
        expire_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        extra_data={
            "sid": session_token,
            "rtv": refresh_token_version,
        },
    )
    return jwt.encode(
        payload,
        settings.REFRESH_TOKEN_SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_email_token(email: str) -> str:
    payload = _build_token_payload(
        subject=email,
        token_type="email_verify",
        expire_delta=timedelta(hours=24),
    )
    return jwt.encode(
        payload,
        settings.EMAIL_TOKEN_SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_reset_token(email: str, password_version: int) -> str:
    payload = _build_token_payload(
        subject=email,
        token_type="password_reset",
        expire_delta=timedelta(hours=1),
        extra_data={"pwdv": password_version},
    )
    return jwt.encode(
        payload,
        settings.RESET_TOKEN_SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.ACCESS_TOKEN_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def decode_refresh_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.REFRESH_TOKEN_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def decode_email_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.EMAIL_TOKEN_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def decode_reset_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.RESET_TOKEN_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
