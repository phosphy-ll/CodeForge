from typing import Annotated
from datetime import datetime, timedelta, timezone

import requests
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from polar_sdk.webhooks import validate_event, WebhookVerificationError

from app.services.achievement_service import AchievementService
from app.api.deps import get_current_user, DbSession
from app.core.config import get_settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.achievement_service import AchievementService
from app.services.email_service import EmailService
from app.services.email_templates import (
    payment_success_email_template,
    beta_welcome_email_template,
)

router = APIRouter(prefix="/billing", tags=["billing"])
settings = get_settings()


PRODUCT_IDS = {
    "starter": settings.POLAR_STARTER_PRODUCT_ID,
    "plus": settings.POLAR_PLUS_PRODUCT_ID,
    "ultra": settings.POLAR_ULTRA_PRODUCT_ID,
    "beta": settings.POLAR_BETA_PRODUCT_ID,
}

PRODUCT_TO_TIER = {
    settings.POLAR_STARTER_PRODUCT_ID: "starter",
    settings.POLAR_PLUS_PRODUCT_ID: "plus",
    settings.POLAR_ULTRA_PRODUCT_ID: "ultra",
    settings.POLAR_BETA_PRODUCT_ID: "beta",
}


class CheckoutRequest(BaseModel):
    tier: str


def parse_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))

    return None


def get_attr_or_key(obj, key: str, default=None):
    if obj is None:
        return default

    if isinstance(obj, dict):
        return obj.get(key, default)

    return getattr(obj, key, default)


@router.post("/checkout")
def create_checkout(
    data: CheckoutRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    tier = data.tier.lower()
    product_id = PRODUCT_IDS.get(tier)

    if not product_id:
        raise HTTPException(status_code=400, detail="Invalid tier")

    response = requests.post(
        "https://api.polar.sh/v1/checkouts/",
        headers={
            "Authorization": f"Bearer {settings.POLAR_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        },
        json={
            "products": [product_id],
            "customer_email": current_user.email,
            "external_customer_id": str(current_user.id),
            "metadata": {
                "user_id": current_user.id,
                "tier": tier,
                "source": "codeforge_app",
            },
            "success_url": f"{settings.FRONTEND_URL}/subscription?checkout=success",
            "return_url": f"{settings.FRONTEND_URL}/subscription",
        },
        timeout=20,
    )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.post("/webhook")
async def polar_webhook(request: Request, db: DbSession):
    body = await request.body()
    headers = request.headers

    try:
        payload = validate_event(
            body,
            dict(headers),
            settings.POLAR_WEBHOOK_SECRET,
        )
    except WebhookVerificationError:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    event_type = get_attr_or_key(payload, "type", "order.paid")
    data = get_attr_or_key(payload, "data", payload)

    if event_type not in {
        "order.paid",
        "subscription.active",
        "subscription.updated",
        "subscription.revoked",
        "subscription.canceled",
    }:
        return {"ok": True, "ignored": event_type}

    metadata = get_attr_or_key(data, "metadata", {}) or {}

    user_id = (
        metadata.get("user_id")
        or get_attr_or_key(data, "external_customer_id")
        or get_attr_or_key(data, "customer_external_id")
    )

    product = get_attr_or_key(data, "product")
    product_id = (
        get_attr_or_key(data, "product_id")
        or get_attr_or_key(product, "id")
    )

    if not user_id:
        return {"ok": False, "reason": "missing user_id"}

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))

    if not user:
        return {"ok": False, "reason": "user not found"}
    
    email_service = EmailService()

    subscription_obj = get_attr_or_key(data, "subscription")

    subscription_id = (
        get_attr_or_key(data, "subscription_id")
        or get_attr_or_key(subscription_obj, "id")
    )
    cancel_at_period_end = None
    current_period_end = None

    if event_type.startswith("subscription."):
        subscription_id = get_attr_or_key(data, "id") or subscription_id
        cancel_at_period_end = get_attr_or_key(data, "cancel_at_period_end")
        current_period_end = get_attr_or_key(data, "current_period_end")

    if subscription_id:
        user.polar_subscription_id = subscription_id

    if cancel_at_period_end is not None:
        user.polar_subscription_cancel_at_period_end = bool(cancel_at_period_end)

    parsed_period_end = parse_datetime(current_period_end)
    if parsed_period_end:
        user.polar_subscription_current_period_end = parsed_period_end

    if event_type in {"subscription.revoked", "subscription.canceled"}:
        user.subscription_tier = "free"
        user.polar_subscription_id = None
        user.polar_subscription_cancel_at_period_end = False
        user.polar_subscription_current_period_end = None

        await db.commit()
        return {"ok": True, "tier": "free"}

    if not product_id:
        await db.commit()
        return {"ok": True, "reason": "synced subscription state only"}

    tier = PRODUCT_TO_TIER.get(product_id)

    if not tier:
        await db.commit()
        return {"ok": False, "reason": "unknown product"}

    if tier == "beta":
        user.subscription_tier = "ultra"
        user.beta_tester = True
        user.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=60)

        await AchievementService(db).issue_beta_tester_system(user.id)

        await db.commit()

        email_service.send_email(
            user.email,
            "Welcome to CodeForge Beta",
            beta_welcome_email_template(),
        )

        return {"ok": True, "tier": "ultra", "beta": True}

    user.subscription_tier = tier

    await db.commit()

    email_service.send_email(
        user.email,
        "CodeForge Subscription Activated",
        payment_success_email_template(tier.capitalize()),
    )

    return {"ok": True, "tier": tier}


@router.post("/cancel")
async def cancel_subscription(
    current_user: Annotated[User, Depends(get_current_user)],
    db: DbSession,
):
    if not current_user.polar_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    response = requests.patch(
        f"https://api.polar.sh/v1/subscriptions/{current_user.polar_subscription_id}",
        headers={
            "Authorization": f"Bearer {settings.POLAR_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"cancel_at_period_end": True},
        timeout=20,
    )

    if response.status_code >= 400:
        if "AlreadyCanceledSubscription" in response.text:
            current_user.polar_subscription_cancel_at_period_end = True
            await db.commit()

            return {
                "ok": True,
                "message": "Subscription was already scheduled for cancellation",
            }

        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    payload = response.json()

    current_user.polar_subscription_cancel_at_period_end = True

    period_end = parse_datetime(payload.get("current_period_end"))
    if period_end:
        current_user.polar_subscription_current_period_end = period_end

    await db.commit()

    return {
        "ok": True,
        "message": "Subscription cancellation scheduled",
    }