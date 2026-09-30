import asyncio
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from polar_sdk.webhooks import WebhookVerificationError, validate_event
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession, get_current_user
from app.core.config import get_settings
from app.models.billing_webhook_event import BillingWebhookEvent
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.achievement_service import AchievementService
from app.services.email_service import EmailService
from app.services.email_templates import (
    beta_welcome_email_template,
    payment_success_email_template,
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

SUPPORTED_WEBHOOK_EVENTS = {
    "order.paid",
    "subscription.active",
    "subscription.updated",
    "subscription.revoked",
    "subscription.canceled",
}


class CheckoutRequest(BaseModel):
    tier: str


def parse_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    return None


def get_attr_or_key(obj, key: str, default=None):
    if obj is None:
        return default

    if isinstance(obj, dict):
        return obj.get(key, default)

    return getattr(obj, key, default)


def get_webhook_event_id(payload, request: Request, body: bytes) -> str:
    payload_id = (
        get_attr_or_key(payload, "id")
        or get_attr_or_key(payload, "event_id")
    )
    if payload_id:
        return str(payload_id)

    for header_name in ("webhook-id", "svix-id"):
        header_value = request.headers.get(header_name)
        if header_value:
            return header_value

    return "sha256:" + hashlib.sha256(body).hexdigest()


async def send_email_safely(
    recipient: str,
    subject: str,
    html: str,
) -> None:
    try:
        service = EmailService()
        await asyncio.to_thread(service.send_email, recipient, subject, html)
    except Exception:
        # Billing state must not fail because a transactional email could not be sent.
        return


async def get_existing_webhook_event(
    db: DbSession,
    external_event_id: str,
) -> BillingWebhookEvent | None:
    result = await db.execute(
        select(BillingWebhookEvent).where(
            BillingWebhookEvent.external_event_id == external_event_id
        )
    )
    return result.scalar_one_or_none()


async def begin_webhook_event(
    db: DbSession,
    *,
    external_event_id: str,
    event_type: str,
    payload_hash: str,
) -> tuple[BillingWebhookEvent, bool]:
    existing = await get_existing_webhook_event(db, external_event_id)

    if existing and existing.status in {"processed", "processing"}:
        return existing, True

    if existing:
        existing.status = "processing"
        existing.last_error = None
        existing.processed_at = None
        existing.event_type = event_type
        existing.payload_hash = payload_hash
        await db.flush()
        return existing, False

    event = BillingWebhookEvent(
        provider="polar",
        external_event_id=external_event_id,
        event_type=event_type,
        payload_hash=payload_hash,
        status="processing",
    )
    db.add(event)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        existing = await get_existing_webhook_event(db, external_event_id)
        if existing:
            return existing, True
        raise

    return event, False


async def mark_webhook_processed(
    db: DbSession,
    event: BillingWebhookEvent,
) -> None:
    event.status = "processed"
    event.last_error = None
    event.processed_at = datetime.now(timezone.utc)
    await db.commit()


async def mark_webhook_failed(
    db: DbSession,
    event: BillingWebhookEvent,
    reason: str,
) -> None:
    event.status = "failed"
    event.last_error = reason[:1000]
    event.processed_at = None
    await db.commit()


async def polar_api_request(
    method: str,
    path: str,
    *,
    json: dict | None = None,
) -> httpx.Response:
    try:
        async with httpx.AsyncClient(
            base_url="https://api.polar.sh",
            timeout=httpx.Timeout(20.0),
        ) as client:
            response = await client.request(
                method,
                path,
                headers={
                    "Authorization": f"Bearer {settings.POLAR_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=json,
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Billing provider is temporarily unavailable",
        ) from exc

    return response


@router.post("/checkout")
async def create_checkout(
    data: CheckoutRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    tier = data.tier.lower()
    product_id = PRODUCT_IDS.get(tier)

    if not product_id:
        raise HTTPException(status_code=400, detail="Invalid tier")

    response = await polar_api_request(
        "POST",
        "/v1/checkouts/",
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
    )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail="Unable to create billing checkout",
        )

    return response.json()


@router.post("/webhook")
async def polar_webhook(request: Request, db: DbSession):
    body = await request.body()

    try:
        payload = validate_event(
            body,
            dict(request.headers),
            settings.POLAR_WEBHOOK_SECRET,
        )
    except WebhookVerificationError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid webhook signature",
        ) from exc

    event_type = get_attr_or_key(payload, "type", "order.paid")
    data = get_attr_or_key(payload, "data", payload)

    if event_type not in SUPPORTED_WEBHOOK_EVENTS:
        return {"ok": True, "ignored": event_type}

    external_event_id = get_webhook_event_id(payload, request, body)
    payload_hash = hashlib.sha256(body).hexdigest()

    event, duplicate = await begin_webhook_event(
        db,
        external_event_id=external_event_id,
        event_type=event_type,
        payload_hash=payload_hash,
    )

    if duplicate:
        return {"ok": True, "duplicate": True}

    email_payload: tuple[str, str, str] | None = None

    try:
        metadata = get_attr_or_key(data, "metadata", {}) or {}

        user_id = (
            metadata.get("user_id")
            or get_attr_or_key(data, "external_customer_id")
            or get_attr_or_key(data, "customer_external_id")
        )

        if not user_id:
            await mark_webhook_processed(db, event)
            return {"ok": False, "reason": "missing user_id"}

        repo = UserRepository(db)
        user = await repo.get_by_id(int(user_id))

        if not user:
            await mark_webhook_processed(db, event)
            return {"ok": False, "reason": "user not found"}

        previous_tier = user.subscription_tier
        was_beta_tester = user.beta_tester

        product = get_attr_or_key(data, "product")
        product_id = (
            get_attr_or_key(data, "product_id")
            or get_attr_or_key(product, "id")
        )

        subscription_obj = get_attr_or_key(data, "subscription")
        subscription_id = (
            get_attr_or_key(data, "subscription_id")
            or get_attr_or_key(subscription_obj, "id")
        )

        cancel_at_period_end = None
        current_period_end = None

        if event_type.startswith("subscription."):
            subscription_id = get_attr_or_key(data, "id") or subscription_id
            cancel_at_period_end = get_attr_or_key(
                data,
                "cancel_at_period_end",
            )
            current_period_end = get_attr_or_key(
                data,
                "current_period_end",
            )

        if subscription_id:
            user.polar_subscription_id = str(subscription_id)

        if cancel_at_period_end is not None:
            user.polar_subscription_cancel_at_period_end = bool(
                cancel_at_period_end
            )

        parsed_period_end = parse_datetime(current_period_end)
        if parsed_period_end:
            user.polar_subscription_current_period_end = parsed_period_end

        now = datetime.now(timezone.utc)

        if event_type == "subscription.revoked":
            user.subscription_tier = "free"
            user.beta_tester = False
            user.subscription_expires_at = None
            user.polar_subscription_id = None
            user.polar_subscription_cancel_at_period_end = False
            user.polar_subscription_current_period_end = None

            await mark_webhook_processed(db, event)
            return {"ok": True, "tier": "free"}

        if event_type == "subscription.canceled":
            user.polar_subscription_cancel_at_period_end = True

            if parsed_period_end and parsed_period_end > now:
                user.subscription_expires_at = parsed_period_end
                await mark_webhook_processed(db, event)
                return {
                    "ok": True,
                    "tier": user.subscription_tier,
                    "cancel_at_period_end": True,
                }

            user.subscription_tier = "free"
            user.beta_tester = False
            user.subscription_expires_at = None
            user.polar_subscription_id = None
            user.polar_subscription_current_period_end = None

            await mark_webhook_processed(db, event)
            return {"ok": True, "tier": "free"}

        if (
            event_type in {"subscription.active", "subscription.updated"}
            and cancel_at_period_end is False
            and not user.beta_tester
        ):
            user.subscription_expires_at = None

        if not product_id:
            await mark_webhook_processed(db, event)
            return {
                "ok": True,
                "reason": "synced subscription state only",
            }

        tier = PRODUCT_TO_TIER.get(product_id)

        if not tier:
            await mark_webhook_failed(
                db,
                event,
                f"unknown product: {product_id}",
            )
            raise HTTPException(
                status_code=500,
                detail="Unknown billing product",
            )

        if tier == "beta":
            user.subscription_tier = "ultra"
            user.beta_tester = True

            if not was_beta_tester or not user.subscription_expires_at:
                user.subscription_expires_at = now + timedelta(days=60)

            await AchievementService(db).issue_beta_tester_system(user.id)

            if not was_beta_tester:
                email_payload = (
                    user.email,
                    "Welcome to CodeForge Beta",
                    beta_welcome_email_template(),
                )

            await mark_webhook_processed(db, event)

            if email_payload:
                await send_email_safely(*email_payload)

            return {"ok": True, "tier": "ultra", "beta": True}

        user.subscription_tier = tier
        user.beta_tester = False

        if cancel_at_period_end is not True:
            user.subscription_expires_at = None

        if previous_tier != tier:
            email_payload = (
                user.email,
                "CodeForge Subscription Activated",
                payment_success_email_template(tier.capitalize()),
            )

        await mark_webhook_processed(db, event)

        if email_payload:
            await send_email_safely(*email_payload)

        return {"ok": True, "tier": tier}

    except HTTPException:
        raise
    except Exception as exc:
        try:
            await mark_webhook_failed(
                db,
                event,
                exc.__class__.__name__,
            )
        except Exception:
            await db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Billing webhook processing failed",
        ) from exc


@router.post("/cancel")
async def cancel_subscription(
    current_user: Annotated[User, Depends(get_current_user)],
    db: DbSession,
):
    if not current_user.polar_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    response = await polar_api_request(
        "PATCH",
        f"/v1/subscriptions/{current_user.polar_subscription_id}",
        json={"cancel_at_period_end": True},
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
            status_code=502,
            detail="Unable to update subscription",
        )

    payload = response.json()

    current_user.polar_subscription_cancel_at_period_end = True

    period_end = parse_datetime(payload.get("current_period_end"))
    if period_end:
        current_user.polar_subscription_current_period_end = period_end
        current_user.subscription_expires_at = period_end

    await db.commit()

    return {
        "ok": True,
        "message": "Subscription cancellation scheduled",
    }
