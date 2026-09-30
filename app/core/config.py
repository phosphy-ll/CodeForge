from functools import lru_cache

from pydantic import model_validator
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

    @model_validator(mode="after")
    def validate_production_settings(self):
        environment = self.ENVIRONMENT.strip().lower()
        if environment not in {"prod", "production"}:
            return self

        if self.DEBUG:
            raise ValueError("DEBUG must be disabled in production")

        if self.FRONTEND_URL.startswith(("http://localhost", "http://127.0.0.1")):
            raise ValueError("FRONTEND_URL must point to the production frontend")

        secret_fields = {
            "ACCESS_TOKEN_SECRET_KEY": self.ACCESS_TOKEN_SECRET_KEY,
            "REFRESH_TOKEN_SECRET_KEY": self.REFRESH_TOKEN_SECRET_KEY,
            "EMAIL_TOKEN_SECRET_KEY": self.EMAIL_TOKEN_SECRET_KEY,
            "RESET_TOKEN_SECRET_KEY": self.RESET_TOKEN_SECRET_KEY,
            "CRON_SECRET": self.CRON_SECRET,
            "POLAR_WEBHOOK_SECRET": self.POLAR_WEBHOOK_SECRET,
            "OPENAI_API_KEY": self.OPENAI_API_KEY,
            "SMTP_PASSWORD": self.SMTP_PASSWORD,
            "POLAR_ACCESS_TOKEN": self.POLAR_ACCESS_TOKEN,
        }

        invalid = [
            name
            for name, value in secret_fields.items()
            if not value
            or value.strip().lower().startswith("your_")
            or value.strip().lower() in {"changeme", "secret", "password"}
        ]
        if invalid:
            raise ValueError(
                "Production secrets contain placeholder values: "
                + ", ".join(sorted(invalid))
            )

        token_secrets = {
            self.ACCESS_TOKEN_SECRET_KEY,
            self.REFRESH_TOKEN_SECRET_KEY,
            self.RESET_TOKEN_SECRET_KEY,
        }
        if len(token_secrets) != 3:
            raise ValueError(
                "Access, refresh, and reset token secrets must be different in production"
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()