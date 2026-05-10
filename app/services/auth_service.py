from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError, ValidationAppError
from app.core.security import (
    create_access_token,
    create_email_token,
    create_reset_token,
    decode_email_token,
    decode_reset_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.audit_service import AuditService
from app.services.email_service import EmailService
from app.services.security_service import SecurityService
from app.services.session_service import SessionService

settings = get_settings()


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.email_service = EmailService()
        self.audit_service = AuditService(session)
        self.security_service = SecurityService(session)
        self.session_service = SessionService(session)

    async def register(self, data: RegisterRequest, ip_address: str | None = None) -> User:
        self.security_service.check_auth_rate_limit(data.email.lower(), "register")

        existing_email = await self.user_repo.get_by_email(data.email)
        if existing_email:
            raise ValidationAppError("Email already registered")

        existing_username = await self.user_repo.get_by_username(data.username)
        if existing_username:
            raise ValidationAppError("Username already taken")

        user = await self.user_repo.create(
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password),
        )

        token = create_email_token(user.email)
        verify_link = f"http://127.0.0.1:8000/api/v1/auth/verify-email?token={token}"

        self.email_service.send_email(
            user.email,
            "Verify your email",
            f"<h3>Click to verify your email</h3><p><a href='{verify_link}'>Verify Email</a></p>",
        )

        await self.audit_service.log(
            action="auth.register",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
            details=f"email={user.email}",
        )

        return user

    async def login(
        self,
        data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        self.security_service.check_auth_rate_limit(data.email.lower(), "login")
        generic_error = UnauthorizedError("Invalid credentials")

        user = await self.user_repo.get_by_email(data.email)
        if not user:
            await self.audit_service.log(
                action="auth.login",
                status="failed",
                ip_address=ip_address,
                details=f"email={data.email}",
            )
            raise generic_error

        if not verify_password(data.password, user.hashed_password):
            await self.audit_service.log(
                action="auth.login",
                status="failed",
                user_id=user.id,
                target_type="user",
                target_id=user.id,
                ip_address=ip_address,
                details="wrong_password",
            )
            raise generic_error

        if not user.is_active:
            raise generic_error

        if not user.is_email_verified:
            raise UnauthorizedError("Email is not verified")

        refresh_token, session_token, refresh_token_version = await self.session_service.create_session(
            user_id=user.id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        access_token = create_access_token(
            subject=user.id,
            extra_data={"role": user.role, "sid": session_token},
        )

        await self.audit_service.log(
            action="auth.login",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
            details=f"session_version={refresh_token_version}",
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh(
        self,
        refresh_token: str,
        ip_address: str | None = None,
    ) -> TokenResponse:
        user_id, new_refresh_token = await self.session_service.rotate_refresh_token(refresh_token)

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("Invalid refresh token")

        access_token = create_access_token(
            subject=user.id,
            extra_data={"role": user.role},
        )

        await self.audit_service.log(
            action="auth.refresh",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    async def logout(self, refresh_token: str, user_id: int, ip_address: str | None = None) -> dict[str, str]:
        await self.session_service.logout_by_refresh_token(refresh_token)

        await self.audit_service.log(
            action="auth.logout",
            status="success",
            user_id=user_id,
            target_type="user",
            target_id=user_id,
            ip_address=ip_address,
        )

        return {"message": "Logged out"}

    async def logout_all(self, user_id: int, ip_address: str | None = None) -> dict[str, str]:
        await self.session_service.logout_all(user_id)

        await self.audit_service.log(
            action="auth.logout_all",
            status="success",
            user_id=user_id,
            target_type="user",
            target_id=user_id,
            ip_address=ip_address,
        )

        return {"message": "Logged out from all sessions"}

    async def verify_email(self, token: str, ip_address: str | None = None) -> dict[str, str]:
        try:
            payload = decode_email_token(token)
        except ValueError as exc:
            raise ValidationAppError("Invalid token") from exc

        if payload.get("type") != "email_verify":
            raise ValidationAppError("Invalid token")

        email = payload.get("sub")
        if not email:
            raise ValidationAppError("Invalid token")

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValidationAppError("Invalid token")

        if user.is_email_verified:
            return {"message": "Already verified"}

        user.is_email_verified = True
        await self.session.commit()
        await self.session.refresh(user)

        await self.audit_service.log(
            action="auth.verify_email",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
        )

        return {"message": "Email verified"}

    async def forgot_password(self, data: ForgotPasswordRequest, ip_address: str | None = None) -> dict[str, str]:
        self.security_service.check_email_rate_limit(data.email.lower(), "forgot_password")

        user = await self.user_repo.get_by_email(data.email)

        if not user:
            return {"message": "If user exists, email sent"}

        token = create_reset_token(user.email, user.password_version)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        self.email_service.send_email(
            user.email,
            "Reset your password",
            f"<h3>Password reset</h3><p><a href='{reset_link}'>Reset password</a></p>",
        )

        await self.audit_service.log(
            action="auth.forgot_password",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
        )

        return {"message": "If user exists, email sent"}

    async def reset_password(self, data: ResetPasswordRequest, ip_address: str | None = None) -> dict[str, str]:
        try:
            payload = decode_reset_token(data.token)
        except ValueError as exc:
            raise ValidationAppError("Invalid token") from exc

        if payload.get("type") != "password_reset":
            raise ValidationAppError("Invalid token")

        email = payload.get("sub")
        pwdv = payload.get("pwdv")

        if not email or pwdv is None:
            raise ValidationAppError("Invalid token")

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValidationAppError("Invalid token")

        if user.password_version != pwdv:
            raise ValidationAppError("Token already invalidated")

        user.hashed_password = hash_password(data.new_password)
        user.password_version += 1

        await self.session.commit()
        await self.session.refresh(user)

        await self.session_service.revoke_all_on_password_change(user.id)

        await self.audit_service.log(
            action="auth.reset_password",
            status="success",
            user_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
        )

        return {"message": "Password updated"}
