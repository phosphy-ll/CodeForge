from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "CodeForge"
    DEBUG: bool = False
    ENVIRONMENT: str = "dev"

    DATABASE_URL: str

    ACCESS_TOKEN_SECRET_KEY: str
    REFRESH_TOKEN_SECRET_KEY: str
    EMAIL_TOKEN_SECRET_KEY: str
    RESET_TOKEN_SECRET_KEY: str
    CRON_SECRET: str
    POLAR_WEBHOOK_SECRET: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"

    EMAIL_FROM: str
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str

    POLAR_ACCESS_TOKEN: str
    POLAR_STARTER_PRODUCT_ID: str
    POLAR_PLUS_PRODUCT_ID: str
    POLAR_ULTRA_PRODUCT_ID: str
    POLAR_BETA_PRODUCT_ID: str

    FRONTEND_URL: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
