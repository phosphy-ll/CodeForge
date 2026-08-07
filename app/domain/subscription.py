from app.domain.subscription_config import SUBSCRIPTION_CONFIG
from app.domain.languages import normalize_language, ULTRA_RECOMMENDED_LANGUAGES


def get_user_limits(user):
    return SUBSCRIPTION_CONFIG.get(
        user.subscription_tier,
        SUBSCRIPTION_CONFIG["free"],
    )


def is_language_allowed_for_user(user, language: str) -> bool:
    limits = get_user_limits(user)
    allowed = limits.get("allowed_languages", [])

    if "*" in allowed:
        return True

    normalized = normalize_language(language).lower()
    return normalized in [item.lower() for item in allowed]


def get_allowed_languages_for_user(user) -> list[str]:
    limits = get_user_limits(user)
    allowed = limits.get("allowed_languages", [])

    if "*" in allowed:
        return ULTRA_RECOMMENDED_LANGUAGES

    return allowed
