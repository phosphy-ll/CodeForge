from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    ResendVerificationCodeRequest,
)
from app.schemas.user import UserResponse, UserSettingsUpdate, UserProfileUpdate
from app.services.auth_service import AuthService
from app.schemas.auth import VerifyEmailCodeRequest

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    data: RegisterRequest,
    db: DbSession,
    request: Request,
) -> UserResponse:
    service = AuthService(db)
    user = await service.register(data, ip_address=request.client.host if request.client else None)
    return UserResponse.model_validate(user)


@router.post("/login/json", response_model=TokenResponse)
async def login_json(
    data: LoginRequest,
    db: DbSession,
    request: Request,
) -> TokenResponse:
    service = AuthService(db)
    return await service.login(
        data,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/token", response_model=TokenResponse)
async def login_oauth2(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
    request: Request,
) -> TokenResponse:
    service = AuthService(db)
    return await service.login(
        LoginRequest(
            email=form_data.username,
            password=form_data.password,
        ),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshTokenRequest,
    db: DbSession,
    request: Request,
) -> TokenResponse:
    service = AuthService(db)
    return await service.refresh(
        data.refresh_token,
        ip_address=request.client.host if request.client else None,
    )


@router.post("/logout")
async def logout(
    data: LogoutRequest,
    db: DbSession,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    service = AuthService(db)
    return await service.logout(
        data.refresh_token,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )


@router.post("/logout-all")
async def logout_all(
    db: DbSession,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    service = AuthService(db)
    return await service.logout_all(
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse.model_validate(current_user)

@router.patch("/me/settings", response_model=UserResponse)
async def update_my_settings(
    data: UserSettingsUpdate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    payload = data.model_dump(exclude_unset=True)

    repo = AuthService(db).user_repo
    user = await repo.update_settings(current_user, payload)

    return UserResponse.model_validate(user)

@router.post("/verify-email-code", response_model=TokenResponse)
async def verify_email_code(
    data: VerifyEmailCodeRequest,
    db: DbSession,
    request: Request,
) -> TokenResponse:
    service = AuthService(db)

    return await service.verify_email_code(
        data,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: DbSession,
    request: Request,
) -> dict[str, str]:
    service = AuthService(db)
    return await service.forgot_password(data, ip_address=request.client.host if request.client else None)


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: DbSession,
    request: Request,
) -> dict[str, str]:
    service = AuthService(db)
    return await service.reset_password(data, ip_address=request.client.host if request.client else None)

@router.patch("/me/profile", response_model=UserResponse)
async def update_my_profile(
    data: UserProfileUpdate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    payload = data.model_dump(exclude_unset=True)

    if "username" in payload:
        existing = await AuthService(db).user_repo.get_by_username(payload["username"])

        if existing and existing.id != current_user.id:
            raise ValueError("Username already taken")

    repo = AuthService(db).user_repo
    user = await repo.update_profile(current_user, payload)

    return UserResponse.model_validate(user)

@router.post("/resend-verification-code")
async def resend_verification_code(
    data: ResendVerificationCodeRequest,
    db: DbSession,
    request: Request,
) -> dict[str, str]:
    service = AuthService(db)

    return await service.resend_verification_code(
        data,
        ip_address=request.client.host if request.client else None,
    )