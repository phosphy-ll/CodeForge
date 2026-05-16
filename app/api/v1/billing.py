from typing import Annotated

import requests
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from app.api.deps import get_current_user, DbSession
from app.core.config import get_settings
from app.models.user import User
from polar_sdk.webhooks import validate_event, WebhookVerificationError
from app.repositories.user_repository import UserRepository
from app.services.achievement_service import AchievementService
import json

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
        raise HTTPException(status_code=response.status_code, detail=response.json())

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

    event_type = getattr(payload, "type", None) or "order.paid"
    data = getattr(payload, "data", None) or payload

    if event_type not in {
        "order.paid",
        "subscription.active",
        "subscription.revoked",
        "subscription.canceled",
    }:
        return {"ok": True, "ignored": event_type}

    metadata = data.metadata or {}
    user_id = (
        metadata.get("user_id")
        or getattr(data, "external_customer_id", None)
        or getattr(data, "customer_external_id", None)
    )

    product_id = (
        getattr(data, "product_id", None)
        or getattr(data.product, "id", None)
    )

    if not user_id or not product_id:
        return {"ok": False, "reason": "missing user_id or product_id"}

    tier = PRODUCT_TO_TIER.get(product_id)

    if not tier:
        return {"ok": False, "reason": "unknown product"}

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))

    if not user:
        return {"ok": False, "reason": "user not found"}

    if event_type in {"subscription.revoked", "subscription.canceled"}:
        user.subscription_tier = "free"
        await db.commit()
        return {"ok": True, "tier": "free"}

    if tier == "beta":
        user.subscription_tier = "ultra"
        user.beta_tester = True
        user.subscription_expires_at = (
            datetime.now(timezone.utc) + timedelta(days=60)
        )

        await AchievementService(db).issue_beta_tester_system(user.id)

        await db.commit()

        return {"ok": True, "tier": "ultra", "beta": True}

    user.subscription_tier = tier
    await db.commit()

    return {"ok": True, "tier": tier}