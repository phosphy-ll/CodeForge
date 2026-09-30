from app.domain.languages import (
    FREE_LANGUAGES,
    STARTER_LANGUAGES,
    PLUS_LANGUAGES,
)
import os

SUBSCRIPTION_CONFIG = {
    "free": {
        "max_active_goals": 1,
        "daily_tasks_min": 2,
        "daily_tasks_max": 4,
        "max_daily_points": 135,
        "ai_level": "basic",
        "weakness_map": False,
        "adaptive_difficulty": False,
        "hardcore_allowed": False,
        "ai_requests_per_day": 20,
        "ai_coach_enabled": False,
        "precheck_enabled": False,
        "adaptive_tasks_enabled": False,
        "allowed_languages": FREE_LANGUAGES,
        "custom_language_allowed": False,
        "quiz_generations_per_day": 3,
    },
    "starter": {
        "max_active_goals": 1,
        "daily_tasks_min": 4,
        "daily_tasks_max": 7,
        "max_daily_points": 250,
        "ai_level": "improved",
        "weakness_map": True,
        "adaptive_difficulty": False,
        "hardcore_allowed": False,
        "ai_requests_per_day": 50,
        "ai_coach_enabled": False,
        "precheck_enabled": True,
        "adaptive_tasks_enabled": False,
        "allowed_languages": STARTER_LANGUAGES,
        "custom_language_allowed": False,
        "quiz_generations_per_day": 6,
    },
    "plus": {
        "max_active_goals": 3,
        "daily_tasks_min": 10,
        "daily_tasks_max": 15,
        "max_daily_points": 400,
        "ai_level": "advanced",
        "weakness_map": True,
        "adaptive_difficulty": True,
        "hardcore_allowed": False,
        "ai_requests_per_day": 110,
        "ai_coach_enabled": True,
        "precheck_enabled": True,
        "adaptive_tasks_enabled": True,
        "allowed_languages": PLUS_LANGUAGES,
        "custom_language_allowed": False,
        "quiz_generations_per_day": 9,
    },
    "ultra": {
        "max_active_goals": 5,
        "daily_tasks_min": 15,
        "daily_tasks_max": 25,
        "max_daily_points": 600,
        "ai_level": "elite",
        "weakness_map": True,
        "adaptive_difficulty": True,
        "hardcore_allowed": True,
        "ai_requests_per_day": 250,
        "ai_coach_enabled": True,
        "precheck_enabled": True,
        "adaptive_tasks_enabled": True,
        "allowed_languages": ["*"],
        "custom_language_allowed": True,
        "quiz_generations_per_day": 12,
    },
}

SUBSCRIPTION_PRICING = {
    "starter": {
        "label": "Starter",
        "base_price_usd": 6.5,
        "price_usd": 5.0,
    },
    "plus": {
        "label": "Plus",
        "base_price_usd": 12.5,
        "price_usd": 10.0,
    },
    "ultra": {
        "label": "Ultra",
        "base_price_usd": 25.0,
        "price_usd": 20.0,
    },
}

for tier, pricing in SUBSCRIPTION_PRICING.items():
    base = pricing["base_price_usd"]
    price = pricing["price_usd"]
    pricing["discount_percent"] = round(((base - price) / base) * 100)

BETA_PACK = {
    "key": "beta",
    "label": "Founding Beta Access",
    "price_usd": 20.0,
    "included_tier": "ultra",
    "included_months": 2,
    "achievement_code": "beta_tester",
}

BETA_PACK["base_value_usd"] = (
    SUBSCRIPTION_PRICING["ultra"]["base_price_usd"]
    * BETA_PACK["included_months"]
)

BETA_PACK["discount_percent"] = round(
    ((BETA_PACK["base_value_usd"] - BETA_PACK["price_usd"])
    / BETA_PACK["base_value_usd"]) * 100
)

SUBSCRIPTION_META = {
    "starter": {
        "price": SUBSCRIPTION_PRICING["starter"]["price_usd"],
        "original_price": SUBSCRIPTION_PRICING["starter"]["base_price_usd"],
        "polar_product_id": os.getenv("POLAR_STARTER_PRODUCT_ID"),
    },
    "plus": {
        "price": SUBSCRIPTION_PRICING["plus"]["price_usd"],
        "original_price": SUBSCRIPTION_PRICING["plus"]["base_price_usd"],
        "polar_product_id": os.getenv("POLAR_PLUS_PRODUCT_ID"),
    },
    "ultra": {
        "price": SUBSCRIPTION_PRICING["ultra"]["price_usd"],
        "original_price": SUBSCRIPTION_PRICING["ultra"]["base_price_usd"],
        "polar_product_id": os.getenv("POLAR_ULTRA_PRODUCT_ID"),
    },
    "beta": {
        "price": BETA_PACK["price_usd"],
        "original_price": BETA_PACK["base_value_usd"],
        "polar_product_id": os.getenv("POLAR_BETA_PRODUCT_ID"),
    },
}
